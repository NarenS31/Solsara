from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from ..db import supabase

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.get("/{business_id}")
def get_business(business_id: str):
    """Return basic business info for dashboard display."""
    result = supabase.table("businesses").select("id, name").eq(
        "id", business_id
    ).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    return {"business": result.data[0]}


TONE_MAP = {
    "warm": "Warm and personal. Sounds like the owner writing at the end of a long day. Genuine, welcoming, not trying too hard.",
    "professional": "Professional and clear. Polished, business-appropriate, respectful, and still human.",
    "casual": "Casual and friendly. Light, conversational, approachable, and easygoing.",
    "premium": "Premium and refined. Confident, elevated, understated, and high-end.",
}


class ToneUpdateRequest(BaseModel):
    voice: str
    business_description: str = ""
    never_say: str = ""
    example_response: str = ""
    custom_rules: List[str] = []


class SignupRequest(BaseModel):
    business_name: str
    email: str
    password: str


def build_tone_description(
    voice: str,
    business_description: str,
    never_say: str,
    example_response: str,
    custom_rules: List[str]
) -> str:
    base = TONE_MAP.get(voice, TONE_MAP["professional"])
    extras = []
    if business_description.strip():
        extras.append(f"Business description: {business_description.strip()}")
    if never_say.strip():
        extras.append(f"Never say: {never_say.strip()}")
    if example_response.strip():
        extras.append(f"Example to emulate: {example_response.strip()}")
    if custom_rules:
        formatted = "\n".join(
            f"- {r.strip()}" for r in custom_rules if r and r.strip())
        if formatted:
            extras.append("Additional rules:\n" + formatted)
    if extras:
        return base + "\n\n" + "\n".join(extras)
    return base


@router.post("/signup")
def signup(payload: SignupRequest):
    if not payload.email or not payload.password:
        raise HTTPException(
            status_code=400, detail="email and password are required")

    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256(
        f"{salt}:{payload.password}".encode()).hexdigest()
    stored = f"{salt}${password_hash}"

    result = supabase.table("businesses").insert({
        "name": payload.business_name,
        "email": payload.email,
        "password_hash": stored,
        "is_active": False,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create account")

    return {"business_id": result.data[0]["id"]}


@router.post("/{business_id}/tone")
def update_business_tone(business_id: str, payload: ToneUpdateRequest):
    tone_description = build_tone_description(
        payload.voice,
        payload.business_description,
        payload.never_say,
        payload.example_response,
        payload.custom_rules
    )

    result = supabase.table("businesses").update({
        "tone_description": tone_description
    }).eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="business not found")

    return {"ok": True, "tone_description": tone_description}


@router.post("/{business_id}/start-trial")
def start_trial(business_id: str):
    now = datetime.now(timezone.utc)
    trial_ends = now + timedelta(days=14)

    result = supabase.table("businesses").update({
        "is_active": True,
        "trial_started_at": now.isoformat(),
        "trial_ends_at": trial_ends.isoformat(),
    }).eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="business not found")

    return {
        "ok": True,
        "trial_started_at": now.isoformat(),
        "trial_ends_at": trial_ends.isoformat(),
    }
