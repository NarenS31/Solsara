from ..db import supabase
from .google import get_reviews
from .llm import generate_response
from .guardrails import check_guardrails


def _get_recent_responses(business_id: str, limit: int = 5) -> list:
    result = supabase.table("response_queue").select(
        "final_response,generated_response,posted_at"
    ).eq("business_id", business_id).eq("status", "posted").order(
        "posted_at", desc=True
    ).limit(limit).execute()

    responses = []
    for row in result.data or []:
        text = (row.get("final_response") or row.get(
            "generated_response") or "").strip()
        if text:
            responses.append(text)
    return responses


def poll_all_businesses():
    # fetch all active businesses
    result = supabase.table("businesses").select(
        "*").eq("is_active", True).execute()
    businesses = result.data

    if not businesses:
        print("No active businesses to poll")
        return {"processed": 0, "details": []}

    details = []
    for business in businesses:
        try:
            # Example: simulate a single review to test
            review = {
                "reviewId": "test-review-1",
                "comment": "The food was great, but service was slow.",
                "starRating": "FOUR",
                "reviewer": {"displayName": "Alice"},
                "createTime": "2026-02-28T00:00:00Z"
            }

            # call your LLM function
            result = generate_response(
                review_comment=review["comment"],
                reviewer_name=review["reviewer"]["displayName"],
                rating=4,
                business_name=business["name"],
                tone_description=business.get(
                    "tone_description", "professional and friendly"),
                previous_responses=_get_recent_responses(business["id"])
            )

            details.append({
                "business_id": business["id"],
                "response": result["response"],
                "confidence": result["confidence"]
            })
        except Exception as e:
            details.append({
                "business_id": business["id"],
                "error": str(e)
            })

    return {"processed": len(businesses), "details": details}


def poll_business(business: dict):
    """
    Poll a single business for reviews.
    """

    print(
        f"Polling reviews for business: {business.get('name', business['id'])}")

    reviews = get_reviews(business)

    if not reviews:
        return {
            "reviews_seen": 0,
            "reviews_processed": 0
        }

    processed_count = 0
    skipped_count = 0

    for review in reviews:
        was_processed = process_review(business, review)
        if was_processed:
            processed_count += 1
        else:
            skipped_count += 1

    return {
        "reviews_seen": len(reviews),
        "reviews_processed": processed_count,
        "reviews_skipped": skipped_count
    }


def process_review(business: dict, review: dict):
    """
    Process a single review.
    Returns True if new review processed, False if skipped.
    """

    review_id = review.get("reviewId") or review.get("name")

    if not review_id:
        return False

    # Check if review already exists
    existing = supabase.table("reviews") \
        .select("id") \
        .eq("google_review_id", review_id) \
        .execute()

    if existing.data:
        # Already processed
        return False

    # Extract review data
    rating_map = {
        "ONE": 1,
        "TWO": 2,
        "THREE": 3,
        "FOUR": 4,
        "FIVE": 5
    }

    rating = rating_map.get(review.get("starRating"), 0)
    comment = review.get("comment", "")
    reviewer_name = review.get("reviewer", {}).get("displayName", "Anonymous")

    # Save review to DB
    review_result = supabase.table("reviews").insert({
        "business_id": business["id"],
        "google_review_id": review_id,
        "reviewer_name": reviewer_name,
        "rating": rating,
        "comment": comment,
        "review_created_at": review.get("createTime"),
        "responded": False
    }).execute()

    if not review_result.data:
        print(f"Failed to save review {review_id}")
        return False

    saved_review_id = review_result.data[0]["id"]

    # Generate AI response
    tone = business.get("tone_description", "professional and friendly")
    business_name = business.get("name", "our business")

    generated = generate_response(
        review_comment=comment,
        reviewer_name=reviewer_name,
        rating=rating,
        business_name=business_name,
        tone_description=tone,
        previous_responses=_get_recent_responses(business["id"])
    )

    # Guardrails check
    flag_result = check_guardrails(generated["response"], comment)

    status = "pending_post"

    if flag_result["flagged"]:
        status = "held_for_review"

    if generated["confidence"] < 0.7:
        status = "held_for_review"

    # Save response to queue
    supabase.table("response_queue").insert({
        "review_id": saved_review_id,
        "business_id": business["id"],
        "generated_response": generated["response"],
        "confidence_score": generated["confidence"],
        "flagged": flag_result["flagged"],
        "flag_reason": flag_result.get("reason"),
        "status": status
    }).execute()

    print(f"Review {review_id} processed — status: {status}")

    return True
