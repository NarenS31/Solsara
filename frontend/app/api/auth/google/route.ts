import { NextResponse } from "next/server";

/**
 * Redirects to backend Google OAuth flow.
 * Backend handles: Google login → callback → redirect to /dashboard (returning) or /onboarding (new).
 */
export async function GET() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8001";
  const authUrl = `${backendUrl}/auth/google`;
  return NextResponse.redirect(authUrl);
}
