import json
from openai import OpenAI
from ..config import settings

client = OpenAI(api_key=settings.openai_api_key)


def generate_response(
    review_comment: str,
    reviewer_name: str,
    rating: int,
    business_name: str,
    tone_description: str
) -> dict:
    # builds the prompt — single call that returns both the response
    # and a confidence score in JSON format
    prompt = f"""You are responding to a Google review on behalf of {business_name}.

Business tone: {tone_description}

Review from {reviewer_name} ({rating}/5 stars):
"{review_comment}"

Write a response to this review in the business's tone. The response should:
- Sound human and genuine, not like a template
- Be 2-4 sentences
- Thank the reviewer by name
- Address the specific things they mentioned
- For negative reviews, acknowledge the issue and invite them to reach out directly
- Never make promises you can't keep
- Never mention specific staff names unless the reviewer did
- Never use em dashed or other text formatting that might make u explicity look like ai. remember u must look like the business respondign and not an ai response.

Return ONLY a JSON object with exactly these fields:
{{
  "response": "your response text here",
  "confidence": 0.95
}}

Confidence should be between 0 and 1. Use lower confidence (below 0.7) if:
- The review is vague and hard to respond to meaningfully
- You're unsure how to handle the tone
- The review contains unusual claims"""

    result = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7
    )

    # parses the JSON response
    try:
        data = json.loads(result.choices[0].message.content)
        return {
            "response": data.get("response", ""),
            "confidence": float(data.get("confidence", 0.5))
        }
    except Exception as e:
        print(f"LLM parsing error: {e}")
        return {
            "response": "",
            "confidence": 0.0
        }
