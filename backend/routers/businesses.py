from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db import supabase

router = APIRouter(prefix="/businesses", tags=["businesses"])

TONE_MAP = {
    "warm": "Warm and personal. Sounds like the owner writing at the end of a long day. Genuine, welcoming, not trying too hard.",
    "professional": "Professional and clear. Polished, business-appropriate, respectful, and still human.",
    "casual": "Casual and friendly. Light, conversational, approachable, and easygoing.",
    "premium": "Premium and refined. Confident, elevated, understated, and high-end.",
}


class ToneUpdateRequest(BaseModel):
    voice: str
    never_say: str = ""
    example_response: str = ""


def build_tone_description(voice: str, never_say: str, example_response: str) -> str:
    base = TONE_MAP.get(voice, TONE_MAP["professional"])
    extras = []
    if never_say.strip():
        extras.append(f"Never say: {never_say.strip()}")
    if example_response.strip():
        extras.append(f"Example to emulate: {example_response.strip()}")
    if extras:
        return base + "\n\n" + "\n".join(extras)
    return base


@router.post("/{business_id}/tone")
def update_business_tone(business_id: str, payload: ToneUpdateRequest):
    tone_description = build_tone_description(
        payload.voice, payload.never_say, payload.example_response
    )

    result = supabase.table("businesses").update({
        "tone_description": tone_description
    }).eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="business not found")

    return {"ok": True, "tone_description": tone_description}
