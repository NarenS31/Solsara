# Solsara Deployment Guide (Option A: FastAPI on Railway)

Follow these steps **in order** to deploy the backend to Railway and wire up OAuth, Stripe, and the frontend.

---

## 1. Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in.
2. **New project** → **Deploy from GitHub repo**
3. Select your Solsara repo.
4. **Root Directory**: Set to `backend` (so Railway builds from the backend folder).
5. Add all environment variables in **Variables** (see list below).
6. Deploy. Railway will give you a URL like:
   ```
   https://solsara-production.up.railway.app
   ```

### Railway environment variables

Copy these from your `.env` and adjust for production:

| Variable | Production value |
|----------|------------------|
| `APP_ENV` | `production` |
| `SECRET_KEY` | (same as local) |
| `FRONTEND_URL` | `https://solsara.ai` |
| `DEV_MODE` | `false` |
| `ALLOWED_ORIGINS` | `["https://solsara.ai","https://www.solsara.ai","https://solsara.vercel.app"]` |
| `SUPABASE_URL` | (same as local) |
| `SUPABASE_KEY` | (same as local) |
| `GOOGLE_CLIENT_ID` | (same as local) |
| `GOOGLE_CLIENT_SECRET` | (same as local) |
| `GOOGLE_REDIRECT_URI` | `https://solsara-production.up.railway.app/auth/callback` |
| `ANTHROPIC_API_KEY` | (same as local) |
| `OPENAI_API_KEY` | (same as local) |
| `STRIPE_SECRET_KEY` | (same as local) |
| `STRIPE_WEBHOOK_SECRET` | (same as local) |
| `STRIPE_PRICE_ID` | (same as local) |
| `RESEND_API_KEY` | (same as local, or leave empty) |
| `TWILIO_ACCOUNT_SID` | (same as local, if using Missed Call Net) |
| `TWILIO_AUTH_TOKEN` | (same as local, if using Missed Call Net) |
| `RAILWAY_URL` | `https://solsara-production.up.railway.app` |

---

## 2. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Open your OAuth 2.0 Client ID.
3. Under **Authorized redirect URIs**, add:
   ```
   https://solsara-production.up.railway.app/auth/callback
   ```
4. Save.

---

## 3. Railway environment variables (confirm)

Ensure these are set in Railway:

- `GOOGLE_REDIRECT_URI` = `https://solsara-production.up.railway.app/auth/callback`
- `FRONTEND_URL` = `https://solsara.ai`

---

## 4. Vercel environment variables

1. Go to [Vercel](https://vercel.com) → your Solsara project → **Settings** → **Environment Variables**
2. Add or update:
   - `BACKEND_URL` = `https://solsara-production.up.railway.app`

---

## 5. Stripe webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Add endpoint or edit existing:
   - **URL**: `https://solsara-production.up.railway.app/webhooks/stripe`
3. Select the events you need (e.g. `checkout.session.completed`, `customer.subscription.*`).
4. Copy the new **Signing secret** (`whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in Railway.

---

## Checklist

- [ ] Backend deployed to Railway with root directory `backend`
- [ ] All env vars set in Railway
- [ ] Google redirect URI added
- [ ] `GOOGLE_REDIRECT_URI` and `FRONTEND_URL` set in Railway
- [ ] `BACKEND_URL` set in Vercel
- [ ] Stripe webhook URL and signing secret updated

---

## Verify

- Backend health: `https://solsara-production.up.railway.app/health`
- OAuth: Click “Log in” on the frontend and complete Google sign-in
- Stripe: Run a test checkout and confirm webhook events in Stripe
