# Solsara Production Ready Checklist

## ✅ Backend Implementation (COMPLETE)

### Reviews API
- [x] `GET /reviews?business_id=X&limit=50&offset=0` - Fetch paginated reviews with stats
- [x] `POST /reviews/seed/{business_id}` - Auto-create demo business and seed test reviews
- [x] `POST /reviews/{review_id}/reply` - Save manual reply to response queue
- [x] Response format normalized to frontend expectations
- [x] Error handling with proper HTTP status codes
- [x] Structured logging with business_id context

### OAuth & Auth
- [x] Google OAuth callback with safe error redirect (no 500 hangs)
- [x] Config validation (check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET exist)
- [x] Refresh token validation before attempting refresh
- [x] Detailed logging for all auth operations
- [x] Token storage in Supabase

### Infrastructure
- [x] Logging configured at module level
- [x] CORS middleware enabled
- [x] Health check endpoint at `GET /health`
- [x] All routers mounted and accessible

---

## ✅ Frontend Implementation (COMPLETE)

### Dashboard
- [x] Wired to fetch from `GET /reviews?business_id=...` API
- [x] Loading state with spinner
- [x] Error state with helpful debug message
- [x] Empty state with seed endpoint instructions
- [x] No business ID state with OAuth prompt
- [x] Stats cards (Avg Rating, Auto-Posted, Needs Review, Response Rate)
- [x] Flagged reviews section (amber cards)
- [x] Recent activity section (posted reviews)
- [x] Inline reply editing for flagged items
- [x] Animations optimized (removed expensive layout animations)

### Landing Page
- [x] Simplified CTA ("Join Now" → OAuth)
- [x] Dashboard link in navbar
- [x] "v1" badge removed
- [x] Sky color updated to #CDEBF7

### Environment Setup
- [x] `.env.example` created with NEXT_PUBLIC_BACKEND_URL
- [x] Backend URL configurable (defaults to production)
- [x] Fallback to mock data on API error (dev mode)

---

## 🧪 Testing Checklist

### Local Development
```bash
# 1. Set up environment variables
cp frontend/.env.example frontend/.env.local
# Edit .env.local with your NEXT_PUBLIC_BACKEND_URL

# 2. Start frontend
cd frontend && npm run dev
# Opens http://localhost:3000

# 3. Start backend
cd backend && python -m uvicorn main:app --reload --port 8000

# 4. Seed test data
curl -X POST "http://localhost:8000/reviews/seed/test-business-123" \
  -H "Content-Type: application/json"

# 5. View in dashboard
# Navigate to http://localhost:3000/dashboard?business_id=test-business-123
```

### Production Testing
```bash
# 1. Verify backend is live
curl https://solsara-production.up.railway.app/health

# 2. Seed test reviews for demo business
curl -X POST "https://solsara-production.up.railway.app/reviews/seed/my-test-biz" \
  -H "Content-Type: application/json"

# 3. Fetch reviews from dashboard
curl "https://solsara-production.up.railway.app/reviews?business_id=my-test-biz"

# 4. View in browser
# Visit https://solsara.vercel.app/dashboard?business_id=my-test-biz
```

---

## 🚀 Environment Variables

### Vercel (Frontend)
```
NEXT_PUBLIC_BACKEND_URL=https://solsara-production.up.railway.app
```

### Railway (Backend)
```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
SUPABASE_URL=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase settings>
STRIPE_WEBHOOK_SECRET=<from Stripe dashboard>
RESEND_API_KEY=<from Resend dashboard>
OPENAI_API_KEY=<from OpenAI dashboard>
JWT_SECRET=<random string>
```

---

## 📋 Pre-Launch Validation

### Backend Health
- [ ] Health endpoint responds: `GET /health` → 200 OK
- [ ] Reviews API responds: `GET /reviews?business_id=test` → valid JSON
- [ ] Seed endpoint works: `POST /reviews/seed/test` → creates demo data
- [ ] OAuth callback doesn't 500 on error
- [ ] Logs are structured and contain business_id context

### Frontend Health
- [ ] Landing page loads: https://solsara.vercel.app
- [ ] "Join Now" button links to OAuth
- [ ] Dashboard loads with no business ID (shows prompt)
- [ ] Dashboard with business_id parameter fetches reviews
- [ ] Loading spinner displays while fetching
- [ ] Error state displays if backend unreachable
- [ ] Empty state displays if no reviews
- [ ] Stats cards calculate correctly from API response

### OAuth Flow
- [ ] Google login button works on landing page
- [ ] Callback redirects to dashboard with business_id
- [ ] Refresh token is stored in Supabase
- [ ] Session persists on page reload

---

## 🐛 Debugging

### Backend Logs
```bash
# SSH into Railway
railway shell

# Check logs
tail -f /var/log/app.log

# Test endpoint
curl http://localhost:8000/health
```

### Frontend Errors
- Open browser DevTools Console (F12)
- Check Network tab for failed API calls
- Verify NEXT_PUBLIC_BACKEND_URL env var is set
- Check that backend is accessible from Vercel region

### Common Issues

**Dashboard shows "No business selected":**
- Verify `?business_id=...` URL parameter is set
- Check that business exists in database (seed endpoint creates it)

**Dashboard shows API error:**
- Verify backend is running: `curl https://solsara-production.up.railway.app/health`
- Check NEXT_PUBLIC_BACKEND_URL in Vercel env vars
- Verify CORS is enabled on backend (check `main.py` for middleware)

**Seed endpoint fails:**
- Check business_id is valid (alphanumeric, no special chars except hyphens)
- Verify Supabase credentials are set on Railway
- Check logs: `railway logs` on Railway dashboard

**OAuth returns 500:**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set on Railway
- Check Google Cloud Console OAuth credentials are configured
- Ensure redirect URI is registered: `https://solsara-production.up.railway.app/auth/callback`

---

## 📊 Next Steps

### Phase 2: Real Google Integration
1. Verify test Google Business Profile email verification (pending)
2. Test full OAuth → dashboard → real reviews flow
3. Implement poller to fetch real Google reviews (currently stubbed)
4. Add email notifications for flagged reviews

### Phase 3: Monitoring & Observability
1. Set up error alerting (Sentry or Railway alerts)
2. Add request tracing for slow endpoints
3. Monitor token refresh failures
4. Track review fetch latency

### Phase 4: Full Feature Release
1. Implement auto-response generation (LLM service ready)
2. Add response scheduling
3. Implement review flagging rules in guardrails
4. Add team management (multiple users per business)

---

## 📞 Quick Commands

```bash
# View backend logs
railway logs -f

# Redeploy backend
git push origin main  # Auto-deploys on Railway

# Redeploy frontend
git push origin main  # Auto-deploys on Vercel

# Test API locally
curl http://localhost:8000/reviews?business_id=test

# Create test data
curl -X POST http://localhost:8000/reviews/seed/my-business

# Check Supabase data
# Visit https://app.supabase.com → businesses table
```
