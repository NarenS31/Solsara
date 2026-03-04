from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
from db import supabase
from services.twilio_service import (
    provision_number,
    release_number,
    send_missed_call_sms,
    forward_reply_to_owner,
    build_forward_twiml
)
from datetime import datetime, timezone

router = APIRouter()


@router.post("/calls/incoming")
async def incoming_call(request: Request):
    # Twilio hits this when a call comes in to any of our numbers
    # we return TwiML telling Twilio to forward the call
    form = await request.form()

    # which Twilio number was called
    called_number = form.get("To")

    # finds which business owns this number
    result = supabase.table("businesses").select("*").eq(
        "twilio_number", called_number
    ).execute()

    if not result.data:
        # unknown number — just hang up
        return Response(
            content="<?xml version='1.0' encoding='UTF-8'?><Response><Hangup/></Response>",
            media_type="application/xml"
        )

    business = result.data[0]
    real_number = business["real_number"]

    # builds TwiML to forward the call to their real number
    twiml = build_forward_twiml(real_number)

    # must return XML — Twilio only understands TwiML not JSON
    return Response(content=twiml, media_type="application/xml")


@router.post("/calls/status")
async def call_status(request: Request):
    # Twilio hits this after a call ends or goes unanswered
    # this is where we detect missed calls
    form = await request.form()

    dial_status = form.get("DialCallStatus")
    caller_number = form.get("From")
    called_number = form.get("To")

    # DialCallStatus is "no-answer" or "busy" when nobody picks up
    # "completed" means someone answered — not a missed call
    if dial_status not in ["no-answer", "busy", "failed"]:
        return Response(
            content="<?xml version='1.0' encoding='UTF-8'?><Response/>",
            media_type="application/xml"
        )

    # finds the business that owns this Twilio number
    result = supabase.table("businesses").select("*").eq(
        "twilio_number", called_number
    ).execute()

    if not result.data:
        return Response(
            content="<?xml version='1.0' encoding='UTF-8'?><Response/>",
            media_type="application/xml"
        )

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
        return Response(
            content="<?xml version='1.0' encoding='UTF-8'?><Response/>",
            media_type="application/xml"
        )

    missed_call_id = missed_call.data[0]["id"]

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
        print(f"Failed to send missed call SMS: {e}")

    # must return valid TwiML even if we're done
    return Response(
        content="<?xml version='1.0' encoding='UTF-8'?><Response/>",
        media_type="application/xml"
    )


@router.post("/calls/reply")
async def incoming_sms_reply(request: Request):
    # Twilio hits this when a caller replies to the missed call SMS
    form = await request.form()

    caller_number = form.get("From")
    twilio_number = form.get("To")
    reply_text = form.get("Body")

    # finds the business
    result = supabase.table("businesses").select("*").eq(
        "twilio_number", twilio_number
    ).execute()

    if not result.data:
        return Response(
            content="<?xml version='1.0' encoding='UTF-8'?><Response/>",
            media_type="application/xml"
        )

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
            business_name=business.get("name", "your business")
        )
    except Exception as e:
        print(f"Failed to forward reply: {e}")

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

    try:
        twilio_number = provision_number(business_id, real_number)
        return {
            "message": "Number provisioned successfully",
            "twilio_number": twilio_number
        }
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
