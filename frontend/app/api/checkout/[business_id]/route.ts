import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(
  _req: NextRequest,
  { params }: { params: { business_id: string } }
) {
  const { business_id } = params;

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", business_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", business: data });
}
