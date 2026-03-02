import { NextResponse } from "next/server";

/**
 * Redirects to backend Google OAuth flow.
 * Backend handles: Google login → callback → redirect to /dashboard (returning) or /onboarding (new).
 */
export async function GET() {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    throw new Error("BACKEND_URL environment variable is not set");
  }
  const authUrl = `${backendUrl}/auth/google`;
  return NextResponse.redirect(authUrl);
}
