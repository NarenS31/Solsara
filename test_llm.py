from backend.services.llm import generate_response

res = generate_response(
    review_comment="The food was amazing but service was slow.",
    reviewer_name="Alice",
    rating=4,
    business_name="Cafe Test",
    tone_description="friendly and professional"
)

print(res)
