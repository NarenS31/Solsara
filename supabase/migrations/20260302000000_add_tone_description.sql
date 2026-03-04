-- Add tone_description to businesses for LLM voice settings
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS tone_description text;
