-- Basic account fields for email/password signup
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS password_hash text;
