import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await getSupabase().from("businesses").select("id").limit(1);
  return NextResponse.json({ status: "ok", db_connected: !error });
}
