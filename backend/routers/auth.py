from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from ..config import settings
from ..db import supabase
import os
import logging

router = APIRouter(prefix="/auth")
logger = logging.getLogger("solsara.auth")

# required for localhost HTTP only — not needed in production (HTTPS)
if settings.google_redirect_uri.startswith("http://"):
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# the permission we're requesting from Google
# business.manage lets us read reviews and post responses
# openid + email give us the user's Google ID (sub) for login/signup
SCOPES = [
    "https://www.googleapis.com/auth/business.manage",
    "openid",
    "email",
]


def create_flow():
    # builds the OAuth flow object using credentials from .env
    # from_client_config lets us pass credentials directly
    # instead of needing a client_secret.json file
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_redirect_uri],
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.google_redirect_uri
    )
    return flow


@router.get("/google")
def google_login():
    if not settings.google_client_id or not settings.google_client_secret:
        logger.error("google_login_missing_oauth_config")
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    flow = create_flow()

    # generates the Google login URL
    # access_type=offline gets us a refresh token
    # prompt=consent forces Google to always give us a refresh token
    # without prompt=consent returning users won't get a refresh token
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )

    logger.info("google_login_redirect", extra={"state": state})

    # redirects business owner to Google's login page
    return RedirectResponse(authorization_url)


def _get_google_user_id(credentials) -> str | None:
    """Extract Google user ID (sub) from id_token for login/signup lookup."""
    if not getattr(credentials, "id_token", None):
        return None
    try:
        idinfo = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
        return idinfo.get("sub")
    except Exception:
        return None


@router.get("/callback")
def google_callback(code: str, state: str = None):
    try:
        logger.info("google_callback_start", extra={"state": state})
        flow = create_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        google_user_id = _get_google_user_id(credentials)

        # Returning user: find existing business by google_user_id
        if google_user_id:
            existing = supabase.table("businesses").select("id, refresh_token").eq(
                "google_user_id", google_user_id
            ).execute()
            if existing.data and len(existing.data) > 0:
                business_id = existing.data[0]["id"]
                # Update tokens (keep existing refresh_token if Google didn't return a new one)
                update_data = {
                    "access_token": credentials.token,
                    "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                }
                if credentials.refresh_token:
                    update_data["refresh_token"] = credentials.refresh_token
                supabase.table("businesses").update(update_data).eq("id", business_id).execute()
                redirect_url = f"{settings.frontend_url}/dashboard?business_id={business_id}"
                logger.info("google_callback_existing_business", extra={"business_id": business_id})
                return RedirectResponse(url=redirect_url)

        # New user: create business with google_user_id
        insert_data = {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
            "is_active": False,
        }
        if google_user_id:
            insert_data["google_user_id"] = google_user_id

        result = supabase.table("businesses").insert(insert_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to save credentials")

        business_id = result.data[0]["id"]
        redirect_url = f"{settings.frontend_url}/onboarding?business_id={business_id}"
        logger.info("google_callback_new_business", extra={"business_id": business_id})
        return RedirectResponse(url=redirect_url)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("google_callback_failed")
        safe_redirect = f"{settings.frontend_url}/login?error=oauth_failed"
        return RedirectResponse(url=safe_redirect)


@router.get("/refresh/{business_id}")
def refresh_token(business_id: str):
    # gets the business from Supabase
    result = supabase.table("businesses").select(
        "*").eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")

    business = result.data[0]

    if not business.get("refresh_token"):
        logger.warning("refresh_missing_token", extra={"business_id": business_id})
        raise HTTPException(status_code=400, detail="No refresh token on file")

    # rebuilds credentials object from stored tokens
    from google.oauth2.credentials import Credentials
    credentials = Credentials(
        token=business["access_token"],
        refresh_token=business["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret
    )

    # refreshes the access token using the refresh token
    from google.auth.transport.requests import Request
    credentials.refresh(Request())

    # saves new access token and expiry back to Supabase
    supabase.table("businesses").update({
        "access_token": credentials.token,
        "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None
    }).eq("id", business_id).execute()

    logger.info("refresh_success", extra={"business_id": business_id})

    return {"message": "Token refreshed"}
