import logging
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request, AuthorizedSession
from ..db import supabase
from ..config import settings
from datetime import datetime, timezone

logger = logging.getLogger("solsara.google")


def get_credentials(business: dict) -> Credentials:
    # rebuilds a Google credentials object from stored tokens
    credentials = Credentials(
        token=business["access_token"],
        refresh_token=business["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret
    )

    # checks if token is expired or about to expire in next 5 minutes
    if credentials.expiry:
        expiry = credentials.expiry
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        is_expired = (expiry - now).total_seconds() < 300

        if is_expired:
            # refreshes automatically without bothering the user
            credentials.refresh(Request())

            # saves new token back to Supabase
            supabase.table("businesses").update({
                "access_token": credentials.token,
                "token_expiry": credentials.expiry.isoformat()
            }).eq("id", business["id"]).execute()

    return credentials


def _get_json(session: AuthorizedSession, url: str, params: dict | None = None) -> dict:
    response = session.get(url, params=params)
    if response.status_code >= 400:
        logger.warning("google_api_error", extra={
            "status": response.status_code,
            "url": url,
            "body": response.text[:500] if response.text else "",
        })
        return {}
    return response.json() or {}


def _fetch_location_title(session: AuthorizedSession, location_name: str) -> str | None:
    """Fetch business title from Business Information API (location display name)."""
    # v4 returns "accounts/X/locations/Y"; Business Info API expects "locations/Y"
    if "/locations/" in location_name:
        location_name = "locations/" + location_name.split("/locations/")[-1]
    url = f"https://mybusinessbusinessinformation.googleapis.com/v1/{location_name}"
    data = _get_json(session, url, params={"readMask": "title"})
    return (data.get("title") or "").strip() or None


def get_reviews(business: dict) -> list:
    # returns empty list in dev mode — reads from fake_reviews.json instead
    from ..config import settings
    if settings.dev_mode:
        import json
        import os
        fake_path = os.path.join(os.path.dirname(
            __file__), "..", "fake_reviews.json")
        with open(fake_path) as f:
            return json.load(f).get("reviews", [])

    # gets valid credentials — refreshes if needed
    credentials = get_credentials(business)
    session = AuthorizedSession(credentials)
    base_url = "https://mybusiness.googleapis.com/v4"

    accounts_resp = _get_json(session, f"{base_url}/accounts")
    accounts = accounts_resp.get("accounts", [])
    if not accounts:
        logger.warning("get_reviews_no_accounts", extra={
            "business_id": business.get("id"),
            "api_response_keys": list(accounts_resp.keys()) if accounts_resp else [],
        })
        return []

    account_name = accounts[0]["name"]
    logger.info("get_reviews_account_found", extra={"account": account_name})

    locations_resp = _get_json(
        session, f"{base_url}/{account_name}/locations")
    locations = locations_resp.get("locations", [])
    if not locations:
        logger.warning("get_reviews_no_locations", extra={
            "business_id": business.get("id"),
            "account": account_name,
        })
        return []

    location_name = locations[0]["name"]
    logger.info("get_reviews_location_found", extra={"location": location_name})

    # save location id and sync business name from Google when missing
    update_fields = {}
    if not business.get("google_location_id"):
        update_fields["google_location_id"] = location_name
    if not (business.get("name") or "").strip():
        title = _fetch_location_title(session, location_name)
        if title:
            update_fields["name"] = title
    if update_fields:
        supabase.table("businesses").update(update_fields).eq(
            "id", business["id"]
        ).execute()

    # gets reviews for this location
    reviews_response = _get_json(
        session, f"{base_url}/{location_name}/reviews")

    reviews = reviews_response.get("reviews", [])
    total = reviews_response.get("totalReviewCount", len(reviews))
    logger.info("get_reviews_done", extra={
        "business_id": business.get("id"),
        "reviews_returned": len(reviews),
        "total_review_count": total,
    })
    return reviews


def post_review_response(business: dict, review_name: str, response_text: str) -> bool:
    # posts a response to a specific review
    try:
        credentials = get_credentials(business)
        session = AuthorizedSession(credentials)
        base_url = "https://mybusiness.googleapis.com/v4"
        response = session.put(
            f"{base_url}/{review_name}/reply",
            json={"comment": response_text}
        )
        if response.status_code >= 400:
            print(
                f"Failed to post response: {response.status_code} {response.text}")
            return False
        return True
    except Exception as e:
        print(f"Failed to post response: {e}")
        return False
