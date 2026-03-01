# Solsara

AI-powered Google review reply automation.

## Structure

```
solsara/
├── backend/
│   ├── main.py          # FastAPI app entry point
│   ├── config.py        # Settings from .env
│   ├── db.py            # SQLAlchemy async engine & session
│   ├── routers/
│   │   ├── auth.py      # Google OAuth login/callback
│   │   ├── reviews.py   # Review listing & reply endpoints
│   │   └── webhooks.py  # Incoming Google review webhooks
│   ├── services/
│   │   ├── google.py    # Google OAuth & API calls
│   │   ├── llm.py       # Claude reply generation
│   │   ├── guardrails.py# Reply safety checks
│   │   └── poster.py    # Post reply to Google My Business
│   └── models/
│       ├── user.py      # User ORM model
│       └── review.py    # Review ORM model
├── frontend/            # Next.js app (TBD)
├── .env                 # Environment variables
└── README.md
```

## Setup

1. Copy `.env` and fill in your credentials.
2. Install backend dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy asyncpg pydantic-settings httpx anthropic
   ```
3. Run the backend:
   ```bash
   uvicorn backend.main:app --reload
   ```
4. Set up the frontend (Next.js) in `frontend/`.
