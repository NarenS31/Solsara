import { NextResponse } from "next/server";
import { google } from "googleapis";

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export async function GET() {
  const oauth2Client = createOAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/business.manage"],
    include_granted_scopes: true,
    prompt: "consent",
  });

  return NextResponse.redirect(authUrl);
}
