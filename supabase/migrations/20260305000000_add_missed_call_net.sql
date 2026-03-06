-- Missed Call Net tables and columns
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS twilio_number text,
ADD COLUMN IF NOT EXISTS real_number text,
ADD COLUMN IF NOT EXISTS missed_call_message text,
ADD COLUMN IF NOT EXISTS missed_call_paused boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS missed_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  caller_number text,
  twilio_number text,
  called_at timestamptz DEFAULT now(),
  sms_sent boolean DEFAULT false,
  sms_sent_at timestamptz,
  caller_replied boolean DEFAULT false,
  reply_text text
);

CREATE INDEX IF NOT EXISTS idx_missed_calls_business_id ON missed_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_missed_calls_called_at ON missed_calls(called_at);
