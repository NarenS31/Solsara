from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from ..db import supabase
from ..config import settings
from datetime import datetime, timezone


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

    # builds the Google My Business API client
    service = build("mybusiness", "v4", credentials=credentials)

    # gets the account first
    accounts = service.accounts().list().execute()
    if not accounts.get("accounts"):
        return []

    account_name = accounts["accounts"][0]["name"]

    # gets locations for this account
    locations = service.accounts().locations().list(
        parent=account_name
    ).execute()

    if not locations.get("locations"):
        return []

    location_name = locations["locations"][0]["name"]

    # saves location id to business record if not already there
    if not business.get("google_location_id"):
        supabase.table("businesses").update({
            "google_location_id": location_name
        }).eq("id", business["id"]).execute()

    # gets reviews for this location
    reviews_response = service.accounts().locations().reviews().list(
        parent=location_name
    ).execute()

    return reviews_response.get("reviews", [])


def post_review_response(business: dict, review_name: str, response_text: str) -> bool:
    # posts a response to a specific review
    try:
        credentials = get_credentials(business)
        service = build("mybusiness", "v4", credentials=credentials)

        service.accounts().locations().reviews().updateReply(
            name=review_name,
            body={"comment": response_text}
        ).execute()

        return True
    except Exception as e:
        print(f"Failed to post response: {e}")
        return False
