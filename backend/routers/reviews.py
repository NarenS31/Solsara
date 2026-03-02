from datetime import datetime, timezone
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db import supabase
from ..services.llm import generate_response

logger = logging.getLogger("solsara.reviews")

router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReplyRequest(BaseModel):
    business_id: str
    response: str


def _fmt_relative(iso_value: Optional[str]) -> str:
    if not iso_value:
        return "just now"
    try:
        when = datetime.fromisoformat(iso_value.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if when.tzinfo is None:
            when = when.replace(tzinfo=timezone.utc)
        delta = now - when
        seconds = int(delta.total_seconds())
        if seconds < 3600:
            return f"{max(seconds // 60, 1)}m ago"
        if seconds < 86400:
            return f"{seconds // 3600}h ago"
        return f"{seconds // 86400}d ago"
    except Exception:
        return "just now"


@router.get("")
def list_reviews(business_id: str, limit: int = 50, offset: int = 0):
    logger.info("list_reviews_start", extra={
                "business_id": business_id, "limit": limit, "offset": offset})

    if not business_id:
        raise HTTPException(status_code=400, detail="business_id is required")

    limit = max(1, min(limit, 200))

    reviews_result = supabase.table("reviews") \
        .select("id,business_id,reviewer_name,rating,comment,review_created_at") \
        .eq("business_id", business_id) \
        .order("review_created_at", desc=True) \
        .range(offset, offset + limit - 1) \
        .execute()

    reviews_data = reviews_result.data or []

    queue_result = supabase.table("response_queue") \
        .select("review_id,status,generated_response,flag_reason,created_at") \
        .eq("business_id", business_id) \
        .order("created_at", desc=True) \
        .execute()
    queue_data = queue_result.data or []

    latest_by_review: dict[str, dict] = {}
    for row in queue_data:
        rid = row.get("review_id")
        if rid and rid not in latest_by_review:
            latest_by_review[rid] = row

    normalized = []
    for review in reviews_data:
        q = latest_by_review.get(review["id"], {})
        raw_status = q.get("status")
        status_map = {
            "held_for_review": "held",
            "posted": "posted",
            "pending_post": "pending",
        }
        normalized_status = status_map.get(raw_status, "pending")

        normalized.append({
            "id": review["id"],
            "reviewer": review.get("reviewer_name") or "Anonymous",
            "rating": review.get("rating") or 0,
            "comment": review.get("comment") or "",
            "time": _fmt_relative(review.get("review_created_at")),
            "status": normalized_status,
            "response": q.get("generated_response"),
            "flagReason": q.get("flag_reason"),
        })

    posted = sum(1 for r in normalized if r["status"] == "posted")
    held = sum(1 for r in normalized if r["status"] == "held")
    avg = round((sum(r["rating"] for r in normalized) /
                len(normalized)), 1) if normalized else 0.0

    logger.info("list_reviews_done", extra={
                "business_id": business_id, "count": len(normalized), "held": held})

    return {
        "reviews": normalized,
        "stats": {
            "posted": posted,
            "held": held,
            "avg": avg,
            "total": len(normalized),
        },
        "source": "db",
    }


@router.post("/seed/{business_id}")
def seed_reviews_for_business(business_id: str):
    logger.info("seed_reviews_start", extra={"business_id": business_id})

    # Check if business exists, if not create it for demo purposes
    business = supabase.table("businesses").select(
        "id").eq("id", business_id).execute()
    if not business.data:
        logger.info("seed_business_not_found_creating_demo",
                    extra={"business_id": business_id})
        try:
            supabase.table("businesses").insert({
                "id": business_id,
                "name": f"Demo Business {business_id[:8]}",
                "google_business_id": business_id,
            }).execute()
        except Exception as e:
            logger.error("seed_business_create_failed",
                         extra={"error": str(e)})
            raise HTTPException(
                status_code=500, detail="Failed to create demo business")

    sample_reviews = [
        {
            "google_review_id": f"demo-{business_id}-1",
            "reviewer_name": "James Thornton",
            "rating": 5,
            "comment": "Absolutely outstanding service. The team went above and beyond.",
        },
        {
            "google_review_id": f"demo-{business_id}-2",
            "reviewer_name": "Sarah Mitchell",
            "rating": 1,
            "comment": "Food quality was poor and service was slow.",
        },
        {
            "google_review_id": f"demo-{business_id}-3",
            "reviewer_name": "David Park",
            "rating": 4,
            "comment": "Good overall experience and friendly staff.",
        },
    ]

    inserted = 0
    for row in sample_reviews:
        exists = supabase.table("reviews").select("id").eq(
            "google_review_id", row["google_review_id"]).execute()
        if exists.data:
            continue

        created = supabase.table("reviews").insert({
            "business_id": business_id,
            "google_review_id": row["google_review_id"],
            "reviewer_name": row["reviewer_name"],
            "rating": row["rating"],
            "comment": row["comment"],
            "review_created_at": datetime.now(timezone.utc).isoformat(),
            "responded": False,
        }).execute()

        if not created.data:
            continue

        review_id = created.data[0]["id"]

        drafted = generate_response(
            review_comment=row["comment"],
            reviewer_name=row["reviewer_name"],
            rating=row["rating"],
            business_name="Demo Cafe",
            tone_description="warm and professional",
        )

        status = "posted" if row["rating"] >= 4 else "held_for_review"

        supabase.table("response_queue").insert({
            "review_id": review_id,
            "business_id": business_id,
            "generated_response": drafted.get("response", ""),
            "confidence_score": drafted.get("confidence", 0.8),
            "flagged": status == "held_for_review",
            "flag_reason": "Demo flagged review" if status == "held_for_review" else None,
            "status": status,
        }).execute()

        inserted += 1

    logger.info("seed_reviews_done", extra={
                "business_id": business_id, "inserted": inserted})
    return {"ok": True, "inserted": inserted, "business_id": business_id}


@router.post("/{review_id}/reply")
def reply_to_review(review_id: str, payload: ReplyRequest):
    if not payload.response.strip():
        raise HTTPException(status_code=400, detail="response is required")

    queue = supabase.table("response_queue").select("id").eq(
        "review_id", review_id).eq("business_id", payload.business_id).execute()

    update_data = {
        "generated_response": payload.response,
        "status": "posted",
        "flagged": False,
        "flag_reason": None,
        "posted_at": datetime.now(timezone.utc).isoformat(),
    }

    if queue.data:
        supabase.table("response_queue").update(
            update_data).eq("id", queue.data[0]["id"]).execute()
    else:
        supabase.table("response_queue").insert({
            **update_data,
            "review_id": review_id,
            "business_id": payload.business_id,
            "confidence_score": 1.0,
        }).execute()

    supabase.table("reviews").update(
        {"responded": True}).eq("id", review_id).execute()

    logger.info("reply_posted", extra={
                "review_id": review_id, "business_id": payload.business_id})
    return {"ok": True, "review_id": review_id}
