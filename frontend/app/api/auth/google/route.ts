import { NextResponse } from "next/server";

/**
 * Redirects to backend Google OAuth flow.
 * Backend handles: Google login → callback → redirect to /dashboard (returning) or /onboarding (new).
 */
export async function GET(req: Request) {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL environment variable is not set");
  }
  const url = new URL(req.url);
  const businessId = url.searchParams.get("business_id");
  const authUrl = businessId
    ? `${backendUrl}/auth/google?state=bid:${businessId}`
    : `${backendUrl}/auth/google`;
  return NextResponse.redirect(authUrl);
}
