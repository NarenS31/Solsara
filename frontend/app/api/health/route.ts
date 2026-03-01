import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET() {
  const { error } = await supabase.from("businesses").select("id").limit(1);
  return NextResponse.json({ status: "ok", db_connected: !error });
}
