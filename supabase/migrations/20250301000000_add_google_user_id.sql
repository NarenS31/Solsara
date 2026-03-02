-- Add google_user_id to businesses table for login/signup flow
-- When a user logs in with Google, we look up by this ID to find their business
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS google_user_id text UNIQUE;

-- Create index for fast lookup on login
CREATE INDEX IF NOT EXISTS idx_businesses_google_user_id ON businesses(google_user_id);
