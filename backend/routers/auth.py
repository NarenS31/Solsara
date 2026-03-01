from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from ..config import settings
from ..db import supabase
import os

router = APIRouter(prefix="/auth")

# required for localhost — remove in production
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# the permission we're requesting from Google
# business.manage lets us read reviews and post responses
SCOPES = ["https://www.googleapis.com/auth/business.manage"]


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

    # redirects business owner to Google's login page
    return RedirectResponse(authorization_url)


@router.get("/callback")
def google_callback(code: str, state: str = None):
    try:
        flow = create_flow()
        flow.fetch_token(code=code)
        credentials = flow.credentials
        print("Credentials:", credentials.token, credentials.refresh_token)

        result = supabase.table("businesses").insert({
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_expiry": credentials.expiry.isoformat() if credentials.expiry else None,
            "is_active": False
        }).execute()

        print("Supabase result:", result.data)

        if not result.data:
            raise HTTPException(
                status_code=500, detail="Failed to save credentials")

        business_id = result.data[0]["id"]
        return {"message": "Google connected", "business_id": business_id}

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/refresh/{business_id}")
def refresh_token(business_id: str):
    # gets the business from Supabase
    result = supabase.table("businesses").select(
        "*").eq("id", business_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")

    business = result.data[0]

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

    return {"message": "Token refreshed"}
