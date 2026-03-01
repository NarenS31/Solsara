from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..db import get_db
from ..services.llm import generate_reply
from ..services.guardrails import check_reply
from ..services.poster import post_reply

router = APIRouter()


@router.get("/")
async def list_reviews(db: AsyncSession = Depends(get_db)):
    # TODO: fetch reviews from DB
    return {"reviews": []}


@router.get("/{review_id}")
async def get_review(review_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: fetch single review
    return {"review_id": review_id}


@router.post("/{review_id}/reply")
async def reply_to_review(review_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: fetch review text from DB
    review_text = ""

    draft = await generate_reply(review_text)

    safe, reason = await check_reply(draft)
    if not safe:
        raise HTTPException(
            status_code=422, detail=f"Reply blocked by guardrails: {reason}")

    result = await post_reply(review_id, draft)
    return {"reply": draft, "result": result}


@router.post("/{review_id}/reply/draft")
async def draft_reply(review_id: str, db: AsyncSession = Depends(get_db)):
    # TODO: fetch review text from DB
    review_text = ""

    draft = await generate_reply(review_text)
    return {"draft": draft}
