-- Create tweets table in Neon PostgreSQL Database
CREATE TABLE IF NOT EXISTS tweets (
  id TEXT PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_tweets_status_scheduled ON tweets(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tweets_status ON tweets(status);

-- Add a constraint to ensure status values are valid
ALTER TABLE tweets ADD CONSTRAINT IF NOT EXISTS tweets_status_check 
CHECK (status IN ('draft', 'scheduled', 'posted', 'failed'));