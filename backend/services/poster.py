from ..db import supabase
from .google import post_review_response
from datetime import datetime, timezone


def post_pending_responses():
    # gets all responses waiting to be posted
    result = supabase.table("response_queue").select(
        "*, businesses(*), reviews(*)"
    ).eq("status", "pending_post").execute()

    pending = result.data

    if not pending:
        print("No pending responses to post")
        return

    for item in pending:
        try:
            post_response(item)
        except Exception as e:
            print(f"Error posting response {item['id']}: {e}")
            # marks as failed so you can investigate
            supabase.table("response_queue").update({
                "status": "failed"
            }).eq("id", item["id"]).execute()


def post_response(queue_item: dict):
    business = queue_item["businesses"]
    review = queue_item["reviews"]

    # uses the owner-edited response if they changed it
    # otherwise uses the AI generated one
    response_text = queue_item.get(
        "final_response") or queue_item["generated_response"]

    # posts to Google
    success = post_review_response(
        business=business,
        review_name=review["google_review_id"],
        response_text=response_text
    )

    if success:
        now = datetime.now(timezone.utc).isoformat()

        # marks response as posted
        supabase.table("response_queue").update({
            "status": "posted",
            "posted_at": now
        }).eq("id", queue_item["id"]).execute()

        # marks review as responded
        supabase.table("reviews").update({
            "responded": True
        }).eq("id", review["id"]).execute()

        print(
            f"Successfully posted response for review {review['google_review_id']}")
    else:
        # marks as failed
        supabase.table("response_queue").update({
            "status": "failed"
        }).eq("id", queue_item["id"]).execute()

        print(
            f"Failed to post response for review {review['google_review_id']}")
