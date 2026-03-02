from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from ..config import settings
from ..db import supabase
import os
import logging
from urllib.parse import quote

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
    "https://www.googleapis.com/auth/userinfo.email",
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
        raise HTTPException(
            status_code=500, detail="Google OAuth is not configured")

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
    response = RedirectResponse(authorization_url)
    # persist PKCE code_verifier for token exchange in callback
    code_verifier = getattr(flow, "code_verifier", None)
    if code_verifier:
        secure_cookie = not settings.google_redirect_uri.startswith("http://")
        response.set_cookie(
            "oauth_code_verifier",
            code_verifier,
            httponly=True,
            secure=secure_cookie,
            samesite="lax",
            max_age=10 * 60,
        )
    return response


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
def google_callback(code: str, request: Request, state: str = None):
    try:
        logger.info("google_callback_start", extra={"state": state})
        flow = create_flow()
        # restore PKCE code_verifier from cookie if present
        code_verifier = request.cookies.get("oauth_code_verifier")
        if code_verifier:
            flow.code_verifier = code_verifier
        flow.fetch_token(code=code)
        credentials = flow.credentials
        google_user_id = _get_google_user_id(credentials)

        # Returning user: find existing business by google_user_id
        if google_user_id:
            try:
                existing = supabase.table("businesses").select("id, refresh_token").eq(
                    "google_user_id", google_user_id
                ).execute()
            except Exception:
                # Column might not exist yet in some environments; continue with create flow.
                logger.warning("google_callback_lookup_google_user_id_failed")
                existing = None
            if existing and existing.data and len(existing.data) > 0:
                business_id = existing.data[0]["id"]
                # Update tokens (keep existing refresh_token if Google didn't return a new one)
                update_data = {
                    "access_token": credentials.token,
                    "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                }
                if credentials.refresh_token:
                    update_data["refresh_token"] = credentials.refresh_token
                supabase.table("businesses").update(
                    update_data).eq("id", business_id).execute()
                redirect_url = f"{settings.frontend_url}/dashboard?business_id={business_id}"
                logger.info("google_callback_existing_business",
                            extra={"business_id": business_id})
                resp = RedirectResponse(url=redirect_url)
                resp.delete_cookie("oauth_code_verifier")
                return resp

        # New user: create business with google_user_id
        insert_data = {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
            "is_active": False,
        }
        if google_user_id:
            insert_data["google_user_id"] = google_user_id

        try:
            result = supabase.table("businesses").insert(insert_data).execute()
        except Exception:
            # Fallback for older schema (missing google_user_id or required name field)
            logger.warning(
                "google_callback_insert_with_google_user_id_failed_retrying")
            fallback_insert = {
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                "is_active": False,
                "name": "New Business",
            }
            result = supabase.table("businesses").insert(
                fallback_insert).execute()

        if not result.data:
            raise HTTPException(
                status_code=500, detail="Failed to save credentials")

        business_id = result.data[0]["id"]
        redirect_url = f"{settings.frontend_url}/onboarding?business_id={business_id}"
        logger.info("google_callback_new_business",
                    extra={"business_id": business_id})
        resp = RedirectResponse(url=redirect_url)
        resp.delete_cookie("oauth_code_verifier")
        return resp

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("google_callback_failed")
        reason = str(type(e).__name__)
        detail = str(e) if str(e) else ""
        safe_detail = quote(detail[:180]) if detail else ""
        safe_redirect = f"{settings.frontend_url}/login?error=oauth_failed&reason={reason}"
        if safe_detail:
            safe_redirect = f"{safe_redirect}&detail={safe_detail}"
        resp = RedirectResponse(url=safe_redirect)
        resp.delete_cookie("oauth_code_verifier")
        return resp


@router.get("/refresh/{business_id}")
def refresh_token(business_id: str):
    # gets the business from Supabase
    result = supabase.table("businesses").select(
        "*").eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")

    business = result.data[0]

    if not business.get("refresh_token"):
        logger.warning("refresh_missing_token", extra={
                       "business_id": business_id})
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
