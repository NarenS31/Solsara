import logging
from typing import List, Optional
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field
from ..config import settings

logger = logging.getLogger("solsara.llm")
client = instructor.from_anthropic(
    Anthropic(api_key=settings.anthropic_api_key)
)


class LLMResponse(BaseModel):
    response: str = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0)


def generate_response(
    review_comment: str,
    reviewer_name: str,
    rating: int,
    business_name: str,
    tone_description: str,
    previous_responses: Optional[List[str]] = None
) -> dict:
    # --- OpenAI version (commented out) ---
    # from openai import OpenAI
    # client = OpenAI(api_key=settings.openai_api_key)
    # prompt = f"""You are responding to a Google review on behalf of {business_name}.
    #
    # Business tone: {tone_description}
    #
    # Review from {reviewer_name} ({rating}/5 stars):
    # "{review_comment}"
    #
    # Write a response to this review in the business's tone. The response should:
    # - Sound human and genuine, not like a template
    # - Be 2-4 sentences
    # - Thank the reviewer by name
    # - Address the specific things they mentioned
    # - For negative reviews, acknowledge the issue and invite them to reach out directly
    # - Never make promises you can't keep
    # - Never mention specific staff names unless the reviewer did
    # - Never use em dashed or other text formatting that might make u explicity look like ai. remember u must look like the business respondign and not an ai response.
    #
    # Return ONLY a JSON object with exactly these fields:
    # {{
    #   "response": "your response text here",
    #   "confidence": 0.95
    # }}
    #
    # Confidence should be between 0 and 1. Use lower confidence (below 0.7) if:
    # - The review is vague and hard to respond to meaningfully
    # - You're unsure how to handle the tone
    # - The review contains unusual claims"""
    #
    # result = client.chat.completions.create(
    #     model="gpt-4o",
    #     messages=[{"role": "user", "content": prompt}],
    #     response_format={"type": "json_object"},
    #     temperature=0.7
    # )
    #
    # try:
    #     data = json.loads(result.choices[0].message.content)
    #     return {
    #         "response": data.get("response", ""),
    #         "confidence": float(data.get("confidence", 0.5))
    #     }
    # except Exception as e:
    #     print(f"LLM parsing error: {e}")
    #     return {
    #         "response": "",
    #         "confidence": 0.0
    #     }

    # --- Claude Sonnet version ---
    prompt = f"""You are responding to a Google review on behalf of {business_name}.

Business tone: {tone_description}

Review from {reviewer_name} ({rating}/5 stars):
"{review_comment}"

Write a response that sounds like the owner personally wrote it at the end of a long day: genuine, warm, not trying too hard.

Rules:
- Be 2-4 sentences
- Thank the reviewer by name
- Address the specific things they mentioned
- For negative reviews, acknowledge the issue and invite them to reach out directly
- Never make promises you can't keep
- Never mention specific staff names unless the reviewer did
- Never use em dashes or other AI-sounding formatting

Never say any of these:
- "Thank you for your feedback"
- "We strive to"
- "We apologize for any inconvenience"

Never sound like a corporate PR statement.

Good example:
"James, this honestly made our morning. So glad you had a great experience. Hope to see you back soon!"

Bad example:
"Thank you for your positive review. We are pleased to hear about your experience."

Return ONLY a JSON object with exactly these fields:
{{
    "response": "your response text here",
    "confidence": 0.95
}}

Confidence should be between 0 and 1. Use lower confidence (below 0.7) if:
- The review is vague and hard to respond to meaningfully
- You're unsure how to handle the tone
- The review contains unusual claims"""

    if previous_responses:
        cleaned = [r.strip() for r in previous_responses if r and r.strip()]
        if cleaned:
            prompt += f"""

Here are some real responses this business has posted before —
match this voice exactly:
{chr(10).join(cleaned)}"""

    try:
        result = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=220,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}],
            response_model=LLMResponse,
        )
        return {
            "response": result.response,
            "confidence": float(result.confidence),
        }
    except Exception as e:
        logger.exception(
            "llm_generation_failed",
            extra={
                "business_name": business_name,
                "reviewer_name": reviewer_name,
                "rating": rating,
            },
        )
        fallback_response = (
            f"{reviewer_name}, thanks for taking the time to leave a review. "
            "We appreciate the feedback and will follow up directly if needed."
        )
        return {
            "response": fallback_response,
            "confidence": 0.0,
            "fallback_reason": str(type(e).__name__),
        }
