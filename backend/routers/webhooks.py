import stripe
from fastapi import APIRouter, Request, HTTPException
from ..db import supabase
from ..config import settings

router = APIRouter()

stripe.api_key = settings.stripe_secret_key


def safe_update(table_name: str, match_column: str, match_value: str, data: dict):
    """
    Updates Supabase table with only the fields that are not None.
    """
    filtered_data = {k: v for k, v in data.items() if v is not None}
    if filtered_data:
        supabase.table(table_name).update(filtered_data).eq(
            match_column, match_value).execute()


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
        raise HTTPException(status_code=400, detail="Invalid signature")

    obj = event["data"]["object"]
    customer_id = getattr(obj, "customer", None)
    if not customer_id:
        return {"status": "ok"}  # No customer to update

    # Lookup subscription info in Supabase
    result = supabase.table("subscriptions").select("business_id").eq(
        "stripe_customer_id", customer_id
    ).execute()

    if not result.data:
        return {"status": "ok"}  # Nothing to update

    business_id = result.data[0]["business_id"]

    # Safe helpers to avoid KeyErrors
    subscription_id = getattr(obj, "id", None)
    status = getattr(obj, "status", None)
    current_period_end = getattr(obj, "current_period_end", None)
    cancel_at_period_end = getattr(obj, "cancel_at_period_end", None)

    # Handle event types
    if event["type"] == "customer.subscription.created":
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

    elif event["type"] == "invoice.payment_failed":
        supabase.table("businesses").update(
            {"is_active": False}).eq("id", business_id).execute()
        safe_update("subscriptions", "stripe_customer_id",
                    customer_id, {"status": "past_due"})

    elif event["type"] == "customer.subscription.deleted":
        supabase.table("businesses").update(
            {"is_active": False}).eq("id", business_id).execute()
        safe_update("subscriptions", "stripe_customer_id",
                    customer_id, {"status": "cancelled"})

    # Add other event types as needed here
    # Example: subscription updated, trial ending, etc.

    return {"status": "ok"}
