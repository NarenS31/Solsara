-- Subscriptions table for Stripe
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text UNIQUE NOT NULL,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  status text,
  current_period_end bigint,
  cancel_at_period_end boolean,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(stripe_customer_id);
