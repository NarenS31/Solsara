-- Idempotency ledger for Twilio webhooks
CREATE TABLE IF NOT EXISTS twilio_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_sid text NOT NULL,
  event_type text NOT NULL,
  business_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_sid, event_type)
);

CREATE INDEX IF NOT EXISTS idx_twilio_webhook_events_business_id
  ON twilio_webhook_events(business_id);

CREATE INDEX IF NOT EXISTS idx_twilio_webhook_events_created_at
  ON twilio_webhook_events(created_at DESC);
