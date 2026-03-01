import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabase } from "@/lib/supabase";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key);
}

async function safeUpdate(
  table: string,
  matchCol: string,
  matchVal: string,
  data: Record<string, unknown>
) {
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
  );
  if (Object.keys(filtered).length > 0) {
    await getSupabase().from(table).update(filtered).eq(matchCol, matchVal);
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Cast through unknown to access fields across different event object shapes
  const obj = event.data.object as unknown as Record<string, unknown>;
  const customer = obj.customer;
  const customerId = typeof customer === "string" ? customer : (customer as Stripe.Customer | null)?.id;

  if (!customerId) return NextResponse.json({ status: "ok" });

  const { data: subData } = await getSupabase()
    .from("subscriptions")
    .select("business_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!subData) return NextResponse.json({ status: "ok" });

  const businessId = subData.business_id;

  if (event.type === "customer.subscription.created") {
    await getSupabase()
      .from("businesses")
      .update({ is_active: true })
      .eq("id", businessId);
    await safeUpdate("subscriptions", "stripe_customer_id", customerId, {
      stripe_subscription_id: obj.id,
      status: (obj.status as string) ?? "active",
      current_period_end: obj.current_period_end,
      cancel_at_period_end: obj.cancel_at_period_end,
    });
  } else if (event.type === "invoice.payment_failed") {
    await getSupabase()
      .from("businesses")
      .update({ is_active: false })
      .eq("id", businessId);
    await safeUpdate("subscriptions", "stripe_customer_id", customerId, {
      status: "past_due",
    });
  } else if (event.type === "customer.subscription.deleted") {
    await getSupabase()
      .from("businesses")
      .update({ is_active: false })
      .eq("id", businessId);
    await safeUpdate("subscriptions", "stripe_customer_id", customerId, {
      status: "cancelled",
    });
  }

  return NextResponse.json({ status: "ok" });
}
