from base64 import urlsafe_b64encode, urlsafe_b64decode
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
import secrets

router = APIRouter(prefix="/auth")
logger = logging.getLogger("solsara.auth")

# required for localhost HTTP only — not needed in production (HTTPS)
if settings.google_redirect_uri.startswith("http://"):
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
# Google may return scopes in different order/format than requested; relax validation
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"

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


def _oauth_error_redirect(reason: str, detail: str = ""):
    safe_reason = quote(reason) if reason else "oauth_failed"
    safe_redirect = f"{settings.frontend_url}/login?error=oauth_failed&reason={safe_reason}"
    if detail:
        safe_redirect = f"{safe_redirect}&detail={quote(detail[:180])}"
    return RedirectResponse(url=safe_redirect)


def _best_effort_sync_reviews(business_id: str):
    """Try to kick off initial review sync after OAuth success."""
    try:
        from ..services.poller import poll_business
        row = supabase.table("businesses").select("*").eq("id", business_id).limit(1).execute()
        if row and row.data:
            poll_business(row.data[0])
            logger.info("oauth_post_connect_sync_done",
                        extra={"business_id": business_id})
    except Exception:
        # Non-fatal: OAuth success should not fail due to sync problems.
        logger.warning("oauth_post_connect_sync_failed",
                       extra={"business_id": business_id})


def _upsert_business_for_google_user(credentials, google_user_id: str):
    """Race-safe upsert by unique google_user_id for returning/new users."""
    upsert_data = {
        "google_user_id": str(google_user_id),
        "access_token": credentials.token,
        "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
        "is_active": False,
    }
    if credentials.refresh_token:
        upsert_data["refresh_token"] = credentials.refresh_token

    result = supabase.table("businesses").upsert(
        upsert_data, on_conflict="google_user_id"
    ).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to upsert business")
    return result.data[0]["id"]


def _pack_state(original_state: str | None) -> tuple[str, str]:
    """Pack code_verifier into state so we don't need cookies. Returns (packed_state, code_verifier)."""
    code_verifier = secrets.token_urlsafe(32)
    packed = f"pkce:{urlsafe_b64encode(code_verifier.encode()).decode()}"
    if original_state:
        packed += f":{original_state}"
    return packed, code_verifier


def _unpack_state(state: str | None) -> tuple[str | None, str | None]:
    """Extract code_verifier and original state. Returns (code_verifier, original_state)."""
    if not state or not state.startswith("pkce:"):
        return None, state
    parts = state.split(":", 2)
    if len(parts) < 2:
        return None, state
    try:
        raw = parts[1]
        pad = 4 - len(raw) % 4
        if pad != 4:
            raw += "=" * pad
        verifier = urlsafe_b64decode(raw).decode()
    except Exception:
        return None, state
    original = parts[2] if len(parts) > 2 else None
    return verifier, original


@router.get("/google")
def google_login(state: str = None):
    if not settings.google_client_id or not settings.google_client_secret:
        logger.error("google_login_missing_oauth_config")
        raise HTTPException(
            status_code=500, detail="Google OAuth is not configured")

    flow = create_flow()
    packed_state, code_verifier = _pack_state(state)
    flow.code_verifier = code_verifier

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        force_approval_prompt="true",
        state=packed_state,
        code_challenge_method="S256",
    )

    logger.info("google_login_redirect", extra={"state_len": len(packed_state)})

    return RedirectResponse(authorization_url)


def _is_duplicate_key_error(err: Exception) -> bool:
    """Detect PostgreSQL unique constraint violation (23505) from Supabase/PostgREST APIError."""
    err_str = str(err)
    if "23505" in err_str:
        return True
    code = getattr(err, "code", None)
    if code in ("23505", 23505):
        return True
    details = getattr(err, "details", None)
    if isinstance(details, dict) and details.get("code") in ("23505", 23505):
        return True
    return False


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
def google_callback(request: Request, code: str | None = None, state: str = None):
    try:
        if not code:
            return _oauth_error_redirect(
                reason="missing_code",
                detail="Google did not return an authorization code. Please sign in again.",
            )

        logger.info("google_callback_start", extra={"state_len": len(state or "")})
        code_verifier, original_state = _unpack_state(state)
        if not code_verifier:
            return _oauth_error_redirect(
                reason="invalid_state",
                detail="Please go to the login page and click Sign in with Google again.",
            )
        flow = create_flow()
        flow.code_verifier = code_verifier
        flow.fetch_token(code=code)
        credentials = flow.credentials
        google_user_id = _get_google_user_id(credentials)

        # Google must return refresh_token for us to fetch reviews; without it we can't refresh.
        if not credentials.refresh_token:
            logger.warning("google_callback_no_refresh_token", extra={
                "google_user_id": google_user_id,
                "has_token": bool(credentials.token),
            })
            return _oauth_error_redirect(
                reason="no_refresh_token",
                detail="Google did not grant offline access. Please go to myaccount.google.com/permissions, remove Solsara, then sign in again.",
            )

        # If a business_id was provided in OAuth state, attach tokens to it
        if original_state and original_state.startswith("bid:"):
            business_id = original_state.replace("bid:", "", 1)
            update_data = {
                "access_token": credentials.token,
                "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
            }
            if credentials.refresh_token:
                update_data["refresh_token"] = credentials.refresh_token
            if google_user_id:
                update_data["google_user_id"] = google_user_id

            try:
                updated = supabase.table("businesses").update(update_data).eq(
                    "id", business_id).execute()
                if updated.data:
                    _best_effort_sync_reviews(business_id)
                    redirect_url = f"{settings.frontend_url}/onboarding?business_id={business_id}&google=connected"
                    logger.info("google_callback_attached_business",
                                extra={"business_id": business_id})
                    resp = RedirectResponse(url=redirect_url)
                    return resp
            except Exception as update_err:
                # google_user_id already linked to another business: sign into that one instead
                if _is_duplicate_key_error(update_err) and google_user_id:
                    logger.info("google_callback_bid_dup_redirecting_to_existing")
                    existing = supabase.table("businesses").select("id").eq(
                        "google_user_id", str(google_user_id)
                    ).limit(1).execute()
                    if existing and existing.data:
                        existing_id = existing.data[0]["id"]
                        tok_update = {
                            "access_token": credentials.token,
                            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                        }
                        if credentials.refresh_token:
                            tok_update["refresh_token"] = credentials.refresh_token
                        supabase.table("businesses").update(tok_update).eq("id", existing_id).execute()
                        _best_effort_sync_reviews(existing_id)
                        return RedirectResponse(
                            url=f"{settings.frontend_url}/dashboard?business_id={existing_id}"
                        )
                raise

        # Returning user: find existing business by google_user_id
        if google_user_id:
            try:
                business_id = _upsert_business_for_google_user(
                    credentials, str(google_user_id))
                _best_effort_sync_reviews(business_id)
                redirect_url = f"{settings.frontend_url}/dashboard?business_id={business_id}"
                logger.info("google_callback_upsert_business",
                            extra={"business_id": business_id})
                return RedirectResponse(url=redirect_url)
            except Exception:
                # Column might not exist yet in some environments; continue with legacy create flow.
                logger.warning("google_callback_upsert_failed_falling_back")

        # New user: create business with google_user_id
        insert_data = {
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
            "is_active": False,
        }
        if google_user_id:
            insert_data["google_user_id"] = str(google_user_id)

        try:
            result = supabase.table("businesses").insert(insert_data).execute()
        except Exception as insert_err:
            # Duplicate google_user_id: treat as returning user, update existing row
            if _is_duplicate_key_error(insert_err) and google_user_id:
                logger.info("google_callback_duplicate_google_user_id_treating_as_returning")
                existing = supabase.table("businesses").select("id").eq(
                    "google_user_id", str(google_user_id)
                ).limit(1).execute()
                if existing and existing.data:
                    business_id = existing.data[0]["id"]
                    supabase.table("businesses").update({
                        "access_token": credentials.token,
                        "refresh_token": credentials.refresh_token,
                        "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                    }).eq("id", business_id).execute()
                    redirect_url = f"{settings.frontend_url}/dashboard?business_id={business_id}"
                    return RedirectResponse(url=redirect_url)
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
        _best_effort_sync_reviews(business_id)
        redirect_url = f"{settings.frontend_url}/onboarding?business_id={business_id}"
        logger.info("google_callback_new_business",
                    extra={"business_id": business_id})
        resp = RedirectResponse(url=redirect_url)
        return resp

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("google_callback_failed")
        reason = str(type(e).__name__) if e else "oauth_failed"
        detail = str(e) if str(e) else ""
        return _oauth_error_redirect(reason=reason, detail=detail)


@router.get("/refresh/{business_id}")
def refresh_token(business_id: str):
    try:
        # gets the business from Supabase
        result = supabase.table("businesses").select(
            "*").eq("id", business_id).execute()

        if not result.data:
            return _oauth_error_redirect(
                reason="business_not_found", detail="Business not found for token refresh."
            )

        business = result.data[0]

        if not business.get("refresh_token"):
            logger.warning("refresh_missing_token", extra={
                           "business_id": business_id})
            return _oauth_error_redirect(
                reason="no_refresh_token", detail="No refresh token on file. Please reconnect Google."
            )

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
        return RedirectResponse(url=f"{settings.frontend_url}/dashboard?business_id={business_id}")
    except Exception as e:
        logger.exception("refresh_failed", extra={"business_id": business_id})
        return _oauth_error_redirect(
            reason="refresh_failed",
            detail=str(e) if str(e) else "Failed to refresh Google token.",
        )
