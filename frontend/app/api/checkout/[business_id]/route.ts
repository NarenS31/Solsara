import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ business_id: string }> }
) {
  const { business_id } = await params;

  const { data, error } = await getSupabase()
    .from("businesses")
    .select("*")
    .eq("id", business_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", business: data });
}
