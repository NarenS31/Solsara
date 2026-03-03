# backend/routers/checkout.py
import stripe
from fastapi import APIRouter, HTTPException
from ..db import supabase
from ..config import settings

router = APIRouter()

stripe.api_key = settings.stripe_secret_key


@router.post("/checkout/{business_id}")
async def create_checkout(business_id: str):
    if not settings.stripe_price_id:
        raise HTTPException(
            status_code=500, detail="Stripe price ID not configured")

    result = supabase.table("businesses").select(
        "id, name").eq("id", business_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")

    business = result.data[0]

    # Find or create Stripe customer record
    sub = supabase.table("subscriptions").select(
        "id, stripe_customer_id").eq("business_id", business_id).execute()

    stripe_customer_id = None
    if sub.data and sub.data[0].get("stripe_customer_id"):
        stripe_customer_id = sub.data[0]["stripe_customer_id"]
    else:
        customer = stripe.Customer.create(
            name=business.get("name") or "Solsara Business",
            metadata={"business_id": business_id},
        )
        stripe_customer_id = customer.id

        if sub.data:
            supabase.table("subscriptions").update({
                "stripe_customer_id": stripe_customer_id
            }).eq("business_id", business_id).execute()
        else:
            supabase.table("subscriptions").insert({
                "business_id": business_id,
                "stripe_customer_id": stripe_customer_id,
                "status": "incomplete",
            }).execute()

    success_url = f"{settings.frontend_url}/dashboard?business_id={business_id}&checkout=success"
    cancel_url = f"{settings.frontend_url}/onboarding?business_id={business_id}&checkout=cancel"

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=stripe_customer_id,
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        payment_method_collection="always",
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=business_id,
        metadata={"business_id": business_id},
    )

    return {"url": session.url}
