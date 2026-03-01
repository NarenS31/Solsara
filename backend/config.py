from pydantic_settings import BaseSettings
from typing import List


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

    # LLM
    openai_api_key: str = ""

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str

    # Email
    resend_api_key: str = ""

    # Dev
    dev_mode: bool = True
    allowed_origins: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = "/Users/narensara11/Documents/solsara/.env"


settings = Settings()
