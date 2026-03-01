import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ business_id: string }> }
) {
  const { business_id } = await params;

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", business_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  await supabase
    .from("businesses")
    .update({
      access_token: credentials.access_token,
      token_expiry: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null,
    })
    .eq("id", business_id);

  return NextResponse.json({ message: "Token refreshed" });
}
