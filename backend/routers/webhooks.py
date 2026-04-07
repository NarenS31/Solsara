import stripe
from fastapi import APIRouter, Request, HTTPException
import logging
from ..db import supabase
from ..config import settings

router = APIRouter()
logger = logging.getLogger("solsara.webhooks")

stripe.api_key = settings.stripe_secret_key


def safe_update(table_name: str, match_column: str, match_value: str, data: dict):
    """
    Updates Supabase table with only the fields that are not None.
    """
    filtered_data = {k: v for k, v in data.items() if v is not None}
    if filtered_data:
        supabase.table(table_name).update(filtered_data).eq(
            match_column, match_value).execute()


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


def _event_already_processed(event_id: str) -> bool:
    result = supabase.table("stripe_webhook_events").select("id").eq(
        "event_id", event_id
    ).limit(1).execute()
    return bool(result.data)


def _mark_event_processed(event_id: str, event_type: str, customer_id: str | None, business_id: str | None):
    try:
        supabase.table("stripe_webhook_events").insert({
            "event_id": event_id,
            "event_type": event_type,
            "customer_id": customer_id,
            "business_id": business_id,
            "processed": True,
        }).execute()
    except Exception as e:
        if _is_duplicate_key_error(e):
            return
        raise


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # Verify the Stripe webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        logger.warning("stripe_webhook_invalid_signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except ValueError:
        logger.warning("stripe_webhook_invalid_payload")
        raise HTTPException(status_code=400, detail="Invalid signature")

    obj = event["data"]["object"]
    event_id = event.get("id", "")
    event_type = event.get("type", "unknown")
    customer_id = getattr(obj, "customer", None)

    logger.info("stripe_webhook_received", extra={
                "event_id": event_id, "event_type": event_type, "customer_id": customer_id})

    if event_id and _event_already_processed(event_id):
        logger.info("stripe_webhook_duplicate_skipped", extra={
                    "event_id": event_id, "event_type": event_type})
        return {"status": "ok", "duplicate": True}

    if not customer_id:
        if event_id:
            _mark_event_processed(event_id, event_type, None, None)
        return {"status": "ok"}  # No customer to update

    # Lookup subscription info in Supabase
    result = supabase.table("subscriptions").select("business_id").eq(
        "stripe_customer_id", customer_id
    ).execute()

    if not result.data:
        logger.info("stripe_webhook_customer_not_found", extra={
                    "event_id": event_id, "event_type": event_type, "customer_id": customer_id})
        if event_id:
            _mark_event_processed(event_id, event_type, customer_id, None)
        return {"status": "ok"}  # Nothing to update

    business_id = result.data[0]["business_id"]

    # Safe helpers to avoid KeyErrors
    subscription_id = getattr(obj, "id", None)
    status = getattr(obj, "status", None)
    current_period_end = getattr(obj, "current_period_end", None)
    cancel_at_period_end = getattr(obj, "cancel_at_period_end", None)

    # Handle event types
    if event_type == "customer.subscription.created":
        # Activate business
        supabase.table("businesses").update(
            {"is_active": True}).eq("id", business_id).execute()

        # Update subscription safely
        safe_update("subscriptions", "stripe_customer_id", customer_id, {
            "stripe_subscription_id": subscription_id,
            "status": status or "active",
            "current_period_end": current_period_end,
            "cancel_at_period_end": cancel_at_period_end
        })

    elif event_type == "invoice.payment_failed":
        supabase.table("businesses").update(
            {"is_active": False}).eq("id", business_id).execute()
        safe_update("subscriptions", "stripe_customer_id",
                    customer_id, {"status": "past_due"})

    elif event_type == "customer.subscription.deleted":
        supabase.table("businesses").update(
            {"is_active": False}).eq("id", business_id).execute()
        safe_update("subscriptions", "stripe_customer_id",
                    customer_id, {"status": "cancelled"})

    elif event_type == "customer.subscription.paused":
        supabase.table("businesses").update(
            {"is_active": False}).eq("id", business_id).execute()
        safe_update("subscriptions", "stripe_customer_id",
                    customer_id, {"status": status or "paused"})

    elif event_type == "customer.subscription.resumed":
        supabase.table("businesses").update(
            {"is_active": True}).eq("id", business_id).execute()
        safe_update("subscriptions", "stripe_customer_id", customer_id, {
            "status": status or "active",
            "current_period_end": current_period_end,
            "cancel_at_period_end": cancel_at_period_end,
        })

    else:
        logger.info("stripe_webhook_unhandled_event", extra={
                    "event_id": event_id, "event_type": event_type, "business_id": business_id})

    if event_id:
        _mark_event_processed(event_id, event_type, customer_id, business_id)

    return {"status": "ok"}
