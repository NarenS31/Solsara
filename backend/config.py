from pathlib import Path

from pydantic_settings import BaseSettings
from typing import List

# .env at repo root (for local dev); Railway uses env vars, no file needed
_env_path = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    secret_key: str

    # Supabase
    supabase_url: str
    supabase_key: str

    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    frontend_url: str = "http://localhost:3000"

    # LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str

    # Email
    resend_api_key: str = ""

    # Dev
    dev_mode: bool = True
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "https://solsara.vercel.app",
    ]

    class Config:
        env_file = str(_env_path) if _env_path.exists() else None
        extra = "ignore"


settings = Settings()
