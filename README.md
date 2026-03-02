# Solsara

AI-powered Google review reply automation.

## 🚀 Status

**Production Ready** - Backend API implemented with real data flow. Frontend dashboard wired to API. Testing with demo data via seed endpoint.

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for complete testing guide.

## 📚 Structure

```
solsara/
├── backend/
│   ├── main.py              # FastAPI app, logging config, router mounts
│   ├── config.py            # Settings from environment
│   ├── db.py                # Supabase PostgreSQL client
│   ├── routers/
│   │   ├── auth.py          # Google OAuth login/callback/refresh (hardened)
│   │   ├── reviews.py       # Review listing, seed demo, reply endpoints (LIVE)
│   │   ├── checkout.py      # Stripe payment webhooks
│   │   ├── webhooks.py      # Incoming Google review webhooks
│   │   └── demo.py          # Demo reply generation
│   ├── services/
│   │   ├── google.py        # Google OAuth & My Business API
│   │   ├── llm.py           # Claude AI reply generation
│   │   ├── guardrails.py    # Reply safety & flagging rules
│   │   ├── email.py         # Resend email notifications
│   │   ├── poster.py        # Post reply to Google (stub)
│   │   └── poller.py        # Fetch reviews from Google (stub)
│   ├── models/
│   │   ├── user.py          # User record
│   │   └── review.py        # Review record (ORM model)
│   └── scheduler.py         # APScheduler background jobs
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Landing page (simplified CTA)
│   │   ├── dashboard/
│   │   │   └── page.tsx     # Review dashboard (now fetches from API)
│   │   ├── api/
│   │   │   ├── auth/        # OAuth routes
│   │   │   ├── checkout/    # Stripe checkout
│   │   │   └── demo/        # Demo generation
│   │   └── components/      # Reusable UI components
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # Helper functions
│   ├── components/          # Shadcn UI components
│   └── .env.example         # Frontend env template
├── supabase/
│   └── migrations/          # Database schema migrations
├── PRODUCTION_CHECKLIST.md  # Testing & deployment guide
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## ⚡ Quick Start

### Backend
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Set environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials:
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
# - STRIPE_WEBHOOK_SECRET, RESEND_API_KEY

# Run locally
cd backend && python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
# Install dependencies
npm install --prefix frontend

# Set environment variables
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with:
# - NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 (local) or production URL

# Run locally
npm run dev --prefix frontend
```

### Test Data
```bash
# Seed demo reviews for testing
curl -X POST "http://localhost:8000/reviews/seed/test-business-123" \
  -H "Content-Type: application/json"

# View in dashboard
# Navigate to http://localhost:3000/dashboard?business_id=test-business-123
```

## 🔑 API Endpoints

### Reviews
- `GET /reviews?business_id=X&limit=50&offset=0` - List reviews with pagination
- `POST /reviews/seed/{business_id}` - Create demo business + seed test reviews
- `POST /reviews/{review_id}/reply` - Save manual reply

### Auth
- `GET /api/auth/google` - Initiate OAuth login
- `GET /api/auth/callback?code=...` - OAuth callback
- `POST /api/auth/refresh/{business_id}` - Refresh access token

### Other
- `GET /health` - Health check
- `POST /webhooks/stripe` - Stripe webhook
- `POST /demo/generate` - Generate demo reply

## 📊 Database Schema

**businesses**
- `id` (string, primary key)
- `name` (string)
- `google_business_id` (string)
- `owner_id` (uuid, references users)
- `subscription_tier` (string: 'free', 'pro', 'enterprise')
- `created_at` (timestamp)

**reviews**
- `id` (string, primary key)
- `business_id` (string, FK)
- `reviewer_name` (string)
- `rating` (integer 1-5)
- `comment` (text)
- `review_created_at` (timestamp)
- `responded` (boolean)

**response_queue**
- `id` (uuid, primary key)
- `review_id` (string, FK)
- `business_id` (string, FK)
- `generated_response` (text)
- `status` (string: 'pending', 'posted', 'failed')
- `flagged` (boolean)
- `flag_reason` (string)
- `created_at`, `posted_at` (timestamps)

## 🛠️ Development

### Add a new API endpoint
1. Create/edit router file in `backend/routers/`
2. Add route with `@router.get()`, `@router.post()`, etc.
3. Import and mount in `backend/main.py`: `app.include_router(my_router)`

### Update dashboard
1. Edit `frontend/app/dashboard/page.tsx`
2. Fetch from `GET /reviews?business_id=...` API (already wired)
3. Frontend will auto-reload on save (Next.js dev mode)

### Run tests
```bash
# Backend tests (create test_*.py files)
pytest backend/

# Frontend tests
npm test --prefix frontend
```

## 🚀 Deployment

### Backend (Railway)
- Auto-deploys on push to `main`
- See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for env vars

### Frontend (Vercel)
- Auto-deploys on push to `main`
- Requires `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars

## 🐛 Troubleshooting

See [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for common issues and debugging tips.

## 📝 License

TBD
