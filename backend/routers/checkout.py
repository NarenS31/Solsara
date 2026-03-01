# backend/routers/checkout.py
from fastapi import APIRouter, HTTPException
from ..db import supabase

router = APIRouter()


@router.post("/checkout/{business_id}")
async def create_checkout(business_id: str):
    result = supabase.table("businesses").select(
        "*").eq("id", business_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    # For now, just return the business info
    return {"status": "ok", "business": result.data[0]}
