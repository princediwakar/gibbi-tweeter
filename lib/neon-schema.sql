-- Create accounts table for multi-account support
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  twitter_handle TEXT NOT NULL UNIQUE,
  twitter_api_key TEXT NOT NULL,
  twitter_api_secret TEXT NOT NULL,
  twitter_access_token TEXT NOT NULL,
  twitter_access_token_secret TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tweets table in Neon PostgreSQL Database
CREATE TABLE IF NOT EXISTS tweets (
  id TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags JSONB DEFAULT '[]',
  persona TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  twitter_id TEXT,
  twitter_url TEXT,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quality_score JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_twitter_handle ON accounts(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_tweets_account_id ON tweets(account_id);
CREATE INDEX IF NOT EXISTS idx_tweets_account_status_scheduled ON tweets(account_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tweets_status ON tweets(status);

-- Add constraints to ensure status values are valid  
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_status_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_status_check 
CHECK (status IN ('active', 'inactive'));

ALTER TABLE tweets DROP CONSTRAINT IF EXISTS tweets_status_check;
ALTER TABLE tweets ADD CONSTRAINT tweets_status_check 
CHECK (status IN ('draft', 'scheduled', 'ready', 'posted', 'failed'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on accounts table
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();