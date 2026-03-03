import json
from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from ..config import settings

router = APIRouter(prefix="/demo")
client = OpenAI(api_key=settings.openai_api_key)

TONE_MAP = {
    "warm":         "Warm and personal — like talking to a trusted friend. Genuine, caring, approachable.",
    "professional": "Professional and polished — business-appropriate, confident, respectful.",
    "casual":       "Casual and fun — friendly, light-hearted, conversational.",
    "premium":      "Premium and refined — elevated tone, confident, high-end feel.",
}


class DemoGenerateRequest(BaseModel):
    reviewer_name: str
    rating: int
    review_text: str
    tone: str
    custom_rules: list[str] = []


@router.post("/generate")
def demo_generate(req: DemoGenerateRequest):
    base_tone = TONE_MAP.get(req.tone, TONE_MAP["warm"])

    extra = ""
    if req.custom_rules:
        formatted = "\n".join(f"- {r}" for r in req.custom_rules)
        extra = f"\n\nAdditional rules from the business owner:\n{formatted}"

    tone_description = base_tone + extra

    prompt = f"""You are responding to a Google review on behalf of Marco's Italian Kitchen.

Business tone: {tone_description}

Review from {req.reviewer_name} ({req.rating}/5 stars):
"{req.review_text}"

Write a response that sounds like the owner personally wrote it at the end of a long day: genuine, warm, not trying too hard.

Rules:
- Sound human and genuine, not like a template
- 2-3 sentences only
- Thank the reviewer by name
- Address what they specifically mentioned
- For negative reviews, acknowledge the issue and invite them to reach out
- Never use em dashes or AI-sounding formatting
- Sound like the business owner wrote it, not a bot

Never say any of these:
- "Thank you for your feedback"
- "We strive to"
- "We apologize for any inconvenience"

Never sound like a corporate PR statement.

Good example:
"James, this honestly made our morning. So glad you had a great experience. Hope to see you back soon!"

Bad example:
"Thank you for your positive review. We are pleased to hear about your experience."

Return ONLY a JSON object: {{"response": "your response here"}}"""

    result = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=120,
        temperature=0.8,
    )

    try:
        data = json.loads(result.choices[0].message.content)
        return {"response": data.get("response", ""), "confidence": 0.9}
    except Exception:
        return {"response": "", "confidence": 0.0}
