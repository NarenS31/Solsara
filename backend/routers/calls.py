from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
from ..db import supabase
from ..config import settings
from ..services.twilio_service import (
    provision_number,
    release_number,
    send_missed_call_sms,
    forward_reply_to_owner,
    build_forward_twiml,
    attach_existing_number,
    normalize_us_number
)
from datetime import datetime, timezone
import logging
from twilio.request_validator import RequestValidator

router = APIRouter()
logger = logging.getLogger("solsara.calls")


def _normalize_us_number(value: str) -> str:
    try:
        return normalize_us_number(value)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid phone number format")


def _is_duplicate_key_error(err: Exception) -> bool:
    err_str = str(err)
    if "23505" in err_str:
        return True
    code = getattr(err, "code", None)
    if code in ("23505", 23505):
        return True
    details = getattr(err, "details", None)
    if isinstance(details, dict) and details.get("code") in ("23505", 23505):
        return True
    return False


def _twiml_empty() -> Response:
    return Response(
        content="<?xml version='1.0' encoding='UTF-8'?><Response/>",
        media_type="application/xml"
    )


def _twiml_hangup() -> Response:
    return Response(
        content="<?xml version='1.0' encoding='UTF-8'?><Response><Hangup/></Response>",
        media_type="application/xml"
    )


def _validate_twilio_signature(request: Request, form: dict) -> bool:
    validator = RequestValidator(settings.twilio_auth_token or "")
    signature = request.headers.get("X-Twilio-Signature", "")
    if not signature:
        return False
    return validator.validate(str(request.url), form, signature)


def _event_already_processed(event_sid: str, event_type: str) -> bool:
    result = supabase.table("twilio_webhook_events").select("id").eq(
        "event_sid", event_sid
    ).eq("event_type", event_type).limit(1).execute()
    return bool(result.data)


def _mark_event_processed(event_sid: str, event_type: str, business_id: str | None = None):
    try:
        supabase.table("twilio_webhook_events").insert({
            "event_sid": event_sid,
            "event_type": event_type,
            "business_id": business_id,
        }).execute()
    except Exception as e:
        if _is_duplicate_key_error(e):
            return
        raise


@router.post("/calls/incoming")
async def incoming_call(request: Request):
    # Twilio hits this when a call comes in to any of our numbers
    # we return TwiML telling Twilio to forward the call
    form = await request.form()
    form_data = dict(form)

    if not _validate_twilio_signature(request, form_data):
        logger.warning("incoming_call_invalid_signature")
        return _twiml_hangup()

    # which Twilio number was called
    called_number_raw = form.get("To")
    call_sid = form.get("CallSid")
    if call_sid and _event_already_processed(call_sid, "incoming"):
        logger.info("incoming_call_duplicate_skipped", extra={"call_sid": call_sid})
        return _twiml_empty()
    try:
        called_number = normalize_us_number(called_number_raw)
    except Exception:
        logger.warning("incoming_call_invalid_to_number", extra={"to": called_number_raw})
        return _twiml_hangup()

    # finds which business owns this number
    result = supabase.table("businesses").select("*").eq(
        "twilio_number", called_number
    ).execute()

    if not result.data:
        logger.info("incoming_call_unprovisioned_number", extra={"to": called_number})
        if call_sid:
            _mark_event_processed(call_sid, "incoming")
        return _twiml_hangup()

    business = result.data[0]
    real_number = business["real_number"]

    # builds TwiML to forward the call to their real number
    twiml = build_forward_twiml(real_number)
    if call_sid:
        _mark_event_processed(call_sid, "incoming", business.get("id"))

    # must return XML — Twilio only understands TwiML not JSON
    return Response(content=twiml, media_type="application/xml")


@router.post("/calls/status")
async def call_status(request: Request):
    # Twilio hits this after a call ends or goes unanswered
    # this is where we detect missed calls
    form = await request.form()
    form_data = dict(form)
    if not _validate_twilio_signature(request, form_data):
        logger.warning("call_status_invalid_signature")
        return _twiml_empty()

    dial_status = form.get("DialCallStatus")
    caller_number_raw = form.get("From")
    called_number_raw = form.get("To")
    call_sid = form.get("CallSid")

    if call_sid and _event_already_processed(call_sid, "status"):
        logger.info("call_status_duplicate_skipped", extra={"call_sid": call_sid})
        return _twiml_empty()
    try:
        caller_number = normalize_us_number(caller_number_raw)
        called_number = normalize_us_number(called_number_raw)
    except Exception:
        logger.warning("call_status_invalid_numbers", extra={
                       "from": caller_number_raw, "to": called_number_raw})
        if call_sid:
            _mark_event_processed(call_sid, "status")
        return _twiml_empty()

    # DialCallStatus is "no-answer" or "busy" when nobody picks up
    # "completed" means someone answered — not a missed call
    if dial_status not in ["no-answer", "busy", "failed"]:
        if call_sid:
            _mark_event_processed(call_sid, "status")
        return _twiml_empty()

    # finds the business that owns this Twilio number
    result = supabase.table("businesses").select("*").eq(
        "twilio_number", called_number
    ).execute()

    if not result.data:
        logger.info("call_status_unprovisioned_number", extra={"to": called_number})
        if call_sid:
            _mark_event_processed(call_sid, "status")
        return _twiml_empty()

    business = result.data[0]

    # saves the missed call to the database
    missed_call = supabase.table("missed_calls").insert({
        "business_id": business["id"],
        "caller_number": caller_number,
        "twilio_number": called_number,
        "called_at": datetime.now(timezone.utc).isoformat(),
        "sms_sent": False,
        "caller_replied": False
    }).execute()

    if not missed_call.data:
        if call_sid:
            _mark_event_processed(call_sid, "status", business.get("id"))
        return _twiml_empty()

    missed_call_id = missed_call.data[0]["id"]

    if business.get("missed_call_paused"):
        if call_sid:
            _mark_event_processed(call_sid, "status", business.get("id"))
        return _twiml_empty()

    # gets the business's custom message if they set one
    custom_message = business.get("missed_call_message")
    business_name = business.get("name", "us")

    # sends the SMS to the missed caller
    try:
        send_missed_call_sms(
            to_number=caller_number,
            from_number=called_number,
            business_name=business_name,
            custom_message=custom_message
        )

        # marks SMS as sent in database
        supabase.table("missed_calls").update({
            "sms_sent": True,
            "sms_sent_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", missed_call_id).execute()

    except Exception as e:
        logger.exception("call_status_sms_send_failed", extra={
                         "business_id": business.get("id"), "caller_number": caller_number, "twilio_number": called_number})

    # must return valid TwiML even if we're done
    if call_sid:
        _mark_event_processed(call_sid, "status", business.get("id"))
    return _twiml_empty()


@router.post("/calls/reply")
async def incoming_sms_reply(request: Request):
    # Twilio hits this when a caller replies to the missed call SMS
    form = await request.form()
    form_data = dict(form)
    if not _validate_twilio_signature(request, form_data):
        logger.warning("incoming_sms_reply_invalid_signature")
        return _twiml_empty()

    caller_number_raw = form.get("From")
    twilio_number_raw = form.get("To")
    reply_text = form.get("Body")
    message_sid = form.get("MessageSid")

    if message_sid and _event_already_processed(message_sid, "sms_reply"):
        logger.info("incoming_sms_reply_duplicate_skipped", extra={"message_sid": message_sid})
        return _twiml_empty()
    try:
        caller_number = normalize_us_number(caller_number_raw)
        twilio_number = normalize_us_number(twilio_number_raw)
    except Exception:
        logger.warning("incoming_sms_reply_invalid_numbers", extra={
                       "from": caller_number_raw, "to": twilio_number_raw})
        if message_sid:
            _mark_event_processed(message_sid, "sms_reply")
        return _twiml_empty()

    # finds the business
    result = supabase.table("businesses").select("*").eq(
        "twilio_number", twilio_number
    ).execute()

    if not result.data:
        logger.info("incoming_sms_reply_unprovisioned_number", extra={"to": twilio_number})
        if message_sid:
            _mark_event_processed(message_sid, "sms_reply")
        return _twiml_empty()

    business = result.data[0]

    # updates the missed call record to show they replied
    supabase.table("missed_calls").update({
        "caller_replied": True,
        "reply_text": reply_text
    }).eq("business_id", business["id"]).eq(
        "caller_number", caller_number
    ).execute()

    # forwards the reply to the business owner's real number
    try:
        forward_reply_to_owner(
            owner_number=business["real_number"],
            caller_number=caller_number,
            reply_text=reply_text,
            business_name=business.get("name", "your business"),
            twilio_number=twilio_number,
        )
    except Exception as e:
        logger.exception("incoming_sms_reply_forward_failed", extra={
                         "business_id": business.get("id"), "caller_number": caller_number, "twilio_number": twilio_number})

    if message_sid:
        _mark_event_processed(message_sid, "sms_reply", business.get("id"))

    # sends confirmation back to the caller
    return Response(
        content="<?xml version='1.0' encoding='UTF-8'?><Response><Message>Thanks! We've passed your message along and will get back to you shortly.</Message></Response>",
        media_type="application/xml"
    )


@router.post("/calls/provision/{business_id}")
async def provision_business_number(business_id: str, request: Request):
    # called from your frontend when a business enables Missed Call Net
    body = await request.json()
    real_number = body.get("real_number")

    if not real_number:
        raise HTTPException(status_code=400, detail="real_number is required")

    real_number = _normalize_us_number(real_number)

    try:
        twilio_number = provision_number(business_id, real_number)
        return {
            "message": "Number provisioned successfully",
            "twilio_number": twilio_number
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calls/provision")
async def provision_business_number_query(business_id: str, request: Request):
    body = await request.json()
    real_number = body.get("real_number")

    if not real_number:
        raise HTTPException(status_code=400, detail="real_number is required")

    real_number = _normalize_us_number(real_number)

    try:
        twilio_number = provision_number(business_id, real_number)
        return {
            "message": "Number provisioned successfully",
            "twilio_number": twilio_number
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calls/attach")
async def attach_existing_twilio_number(business_id: str, request: Request):
    body = await request.json()
    twilio_number = body.get("twilio_number")
    real_number = body.get("real_number")

    if not twilio_number or not real_number:
        raise HTTPException(
            status_code=400, detail="twilio_number and real_number are required")

    twilio_number = _normalize_us_number(twilio_number)
    real_number = _normalize_us_number(real_number)

    try:
        number = attach_existing_number(
            business_id, twilio_number, real_number)
        return {"message": "Number attached successfully", "twilio_number": number}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/calls/release/{business_id}")
async def release_business_number(business_id: str):
    # called when a business disables Missed Call Net or cancels
    result = supabase.table("businesses").select(
        "twilio_number"
    ).eq("id", business_id).execute()

    if not result.data or not result.data[0].get("twilio_number"):
        raise HTTPException(status_code=404, detail="No Twilio number found")

    twilio_number = result.data[0]["twilio_number"]

    try:
        release_number(twilio_number)

        # clears the number from the business record
        supabase.table("businesses").update({
            "twilio_number": None,
            "real_number": None
        }).eq("id", business_id).execute()

        return {"message": "Number released successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calls/missed/{business_id}")
async def get_missed_calls(business_id: str):
    # returns missed call history for the dashboard
    result = supabase.table("missed_calls").select("*").eq(
        "business_id", business_id
    ).order("called_at", desc=True).limit(50).execute()

    return {"missed_calls": result.data}


@router.get("/calls/missed")
async def get_missed_calls_query(business_id: str):
    result = supabase.table("missed_calls").select("*").eq(
        "business_id", business_id
    ).order("called_at", desc=True).limit(50).execute()

    return {"missed_calls": result.data}


@router.post("/calls/message/{business_id}")
async def update_missed_call_message(business_id: str, request: Request):
    # lets the business owner customize their missed call SMS
    body = await request.json()
    message = body.get("message")

    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    if len(message) > 160:
        raise HTTPException(
            status_code=400, detail="Message must be under 160 characters")

    supabase.table("businesses").update({
        "missed_call_message": message
    }).eq("id", business_id).execute()

    return {"message": "Custom message updated"}


@router.post("/calls/message")
async def update_missed_call_message_query(business_id: str, request: Request):
    body = await request.json()
    message = body.get("message")

    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    if len(message) > 160:
        raise HTTPException(
            status_code=400, detail="Message must be under 160 characters")

    supabase.table("businesses").update({
        "missed_call_message": message
    }).eq("id", business_id).execute()

    return {"message": "Custom message updated"}


@router.get("/calls/settings")
async def get_missed_call_settings(business_id: str):
    result = supabase.table("businesses").select(
        "twilio_number,real_number,missed_call_message,missed_call_paused"
    ).eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="business not found")

    return {"settings": result.data[0]}


@router.post("/calls/pause")
async def pause_missed_call_net(business_id: str, request: Request):
    body = await request.json()
    paused = bool(body.get("paused", False))

    supabase.table("businesses").update({
        "missed_call_paused": paused
    }).eq("id", business_id).execute()

    return {"paused": paused}


@router.post("/calls/test")
async def send_test_message(business_id: str, request: Request):
    body = await request.json()
    to_number = body.get("to_number")

    if not to_number:
        raise HTTPException(status_code=400, detail="to_number is required")

    to_number = _normalize_us_number(to_number)

    result = supabase.table("businesses").select(
        "twilio_number,missed_call_message,name"
    ).eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="business not found")

    business = result.data[0]
    twilio_number = business.get("twilio_number")
    if not twilio_number:
        raise HTTPException(
            status_code=400, detail="Twilio number not provisioned")
    twilio_number = _normalize_us_number(twilio_number)

    try:
        send_missed_call_sms(
            to_number=to_number,
            from_number=twilio_number,
            business_name=business.get("name", "us"),
            custom_message=business.get("missed_call_message")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Test message sent"}
