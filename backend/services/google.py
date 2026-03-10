from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request, AuthorizedSession
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


def _get_json(session: AuthorizedSession, url: str, params: dict | None = None) -> dict:
    response = session.get(url, params=params)
    if response.status_code >= 400:
        print(f"Google API error {response.status_code}: {response.text}")
        return {}
    return response.json() or {}


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

    accounts = _get_json(session, f"{base_url}/accounts").get("accounts", [])
    if not accounts:
        return []

    account_name = accounts[0]["name"]

    locations = _get_json(
        session, f"{base_url}/{account_name}/locations").get("locations", [])
    if not locations:
        return []

    location_name = locations[0]["name"]

    # saves location id to business record if not already there
    if not business.get("google_location_id"):
        supabase.table("businesses").update({
            "google_location_id": location_name
        }).eq("id", business["id"]).execute()

    # gets reviews for this location
    reviews_response = _get_json(
        session, f"{base_url}/{location_name}/reviews")

    return reviews_response.get("reviews", [])


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
