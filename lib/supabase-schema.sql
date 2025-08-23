-- Create tweets table in Supabase
CREATE TABLE tweets (
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

-- Create index for performance
CREATE INDEX idx_tweets_status_scheduled ON tweets(status, scheduled_for);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations" ON tweets FOR ALL USING (true);