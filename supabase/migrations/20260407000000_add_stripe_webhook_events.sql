-- Idempotency ledger for Stripe webhook events
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  customer_id text,
  business_id text,
  processed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type
  ON stripe_webhook_events(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_customer_id
  ON stripe_webhook_events(customer_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_business_id
  ON stripe_webhook_events(business_id);
