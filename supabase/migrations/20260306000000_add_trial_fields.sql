-- Trial fields for deferred Stripe checkout
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
