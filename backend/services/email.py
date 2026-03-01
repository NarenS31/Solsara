import resend
from ..db import supabase
from ..config import settings

resend.api_key = settings.resend_api_key


def send_held_review_alert(business: dict, review: dict, reason: str):
    # sends immediately when a review is flagged
    html = f"""
    <h2>A review needs your attention</h2>
    <p>A new review was flagged and needs manual response:</p>
    <p><strong>Reviewer:</strong> {review['reviewer_name']}</p>
    <p><strong>Rating:</strong> {review['rating']}/5</p>
    <p><strong>Review:</strong> {review['comment']}</p>
    <p><strong>Reason flagged:</strong> {reason}</p>
    <p><a href="https://solsara.ai/held">View and respond here</a></p>
    """

    resend.Emails.send({
        "from": "alerts@solsara.ai",
        "to": business["email"],
        "subject": "Action needed: Review requires your response",
        "html": html
    })


def send_token_expiry_alert(business: dict):
    # sends when Google OAuth token can't be refreshed
    html = f"""
    <h2>Reconnect your Google account</h2>
    <p>Your Google Business Profile connection has expired.</p>
    <p>Solsara has paused responding to your reviews until you reconnect.</p>
    <p><a href="https://solsara.ai/settings">Reconnect here</a></p>
    """

    resend.Emails.send({
        "from": "alerts@solsara.ai",
        "to": business["email"],
        "subject": "Action needed: Reconnect your Google account",
        "html": html
    })


def send_weekly_summaries():
    # gets all active businesses
    result = supabase.table("businesses").select(
        "*").eq("is_active", True).execute()
    businesses = result.data

    for business in businesses:
        try:
            send_weekly_summary(business)
        except Exception as e:
            print(f"Failed to send summary for {business['id']}: {e}")


def send_weekly_summary(business: dict):
    from datetime import datetime, timedelta, timezone

    # gets stats for the past 7 days
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    # counts responses posted this week
    posted = supabase.table("response_queue").select(
        "id", count="exact"
    ).eq("business_id", business["id"]).eq(
        "status", "posted"
    ).gte("posted_at", week_ago).execute()

    # counts held reviews needing attention
    held = supabase.table("response_queue").select(
        "id", count="exact"
    ).eq("business_id", business["id"]).eq(
        "status", "held_for_review"
    ).execute()

    posted_count = posted.count or 0
    held_count = held.count or 0

    held_section = ""
    if held_count > 0:
        held_section = f"""
        <p style="color: #e53e3e;">
            ⚠️ You have {held_count} review(s) waiting for your response.
            <a href="https://solsara.ai/held">Handle them here</a>
        </p>
        """

    html = f"""
    <h2>Your weekly Solsara summary</h2>
    <p>Here's what happened with your reviews this week:</p>
    <p>✅ <strong>{posted_count}</strong> reviews automatically responded to</p>
    {held_section}
    <p>Questions? Reply to this email.</p>
    """

    if not business.get("email"):
        return

    resend.Emails.send({
        "from": "summary@solsara.ai",
        "to": business["email"],
        "subject": f"Your weekly review summary — {posted_count} responses sent",
        "html": html
    })
