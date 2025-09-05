require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function migrateDatabase() {
  try {
    console.log('Starting database migration...');
    
    // Step 1: Create accounts table
    console.log('1. Creating accounts table...');
    await sql`
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
      )
    `;
    
    // Step 2: Add account_id column to tweets table if it doesn't exist
    console.log('2. Adding account_id column to tweets table...');
    await sql`
      ALTER TABLE tweets 
      ADD COLUMN IF NOT EXISTS account_id UUID
    `;
    
    // Step 3: Create a default account from environment variables
    console.log('3. Creating default account from environment variables...');
    const defaultAccount = await sql`
      INSERT INTO accounts (name, twitter_handle, twitter_api_key, twitter_api_secret, twitter_access_token, twitter_access_token_secret)
      VALUES ('Default Account', '@default', ${process.env.TWITTER_API_KEY}, ${process.env.TWITTER_API_SECRET}, ${process.env.TWITTER_ACCESS_TOKEN}, ${process.env.TWITTER_ACCESS_TOKEN_SECRET})
      ON CONFLICT (twitter_handle) DO UPDATE SET
        twitter_api_key = EXCLUDED.twitter_api_key,
        twitter_api_secret = EXCLUDED.twitter_api_secret,
        twitter_access_token = EXCLUDED.twitter_access_token,
        twitter_access_token_secret = EXCLUDED.twitter_access_token_secret,
        updated_at = NOW()
      RETURNING id
    `;
    
    const accountId = defaultAccount.rows[0].id;
    console.log('✅ Default account created/updated with ID:', accountId);
    
    // Step 4: Update existing tweets to use the default account
    console.log('4. Updating existing tweets to use default account...');
    const updateResult = await sql`
      UPDATE tweets 
      SET account_id = ${accountId}
      WHERE account_id IS NULL
    `;
    console.log(`✅ Updated ${updateResult.rowCount} tweets`);
    
    // Step 5: Add foreign key constraint and make account_id required
    console.log('5. Adding foreign key constraint...');
    await sql`
      ALTER TABLE tweets 
      ADD CONSTRAINT fk_tweets_account_id 
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    `;
    
    await sql`
      ALTER TABLE tweets 
      ALTER COLUMN account_id SET NOT NULL
    `;
    
    // Step 6: Create indexes
    console.log('6. Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_twitter_handle ON accounts(twitter_handle)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tweets_account_id ON tweets(account_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tweets_account_status_scheduled ON tweets(account_id, status, scheduled_for)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tweets_status ON tweets(status)`;
    
    // Step 7: Add constraints
    console.log('7. Adding table constraints...');
    await sql`
      ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_status_check;
      ALTER TABLE accounts ADD CONSTRAINT accounts_status_check 
      CHECK (status IN ('active', 'inactive'))
    `;
    
    await sql`
      ALTER TABLE tweets DROP CONSTRAINT IF EXISTS tweets_status_check;
      ALTER TABLE tweets ADD CONSTRAINT tweets_status_check 
      CHECK (status IN ('draft', 'scheduled', 'ready', 'posted', 'failed'))
    `;
    
    // Step 8: Create update trigger function and trigger
    console.log('8. Creating update trigger...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
      CREATE TRIGGER update_accounts_updated_at
        BEFORE UPDATE ON accounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;
    
    console.log('✅ Database migration completed successfully!');
    
    // Verify the final structure
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('accounts', 'tweets')
    `;
    
    console.log('✅ Final tables:', tables.rows.map(r => r.table_name));
    
    const accountCount = await sql`SELECT COUNT(*) as count FROM accounts`;
    const tweetCount = await sql`SELECT COUNT(*) as count FROM tweets`;
    
    console.log(`✅ Accounts: ${accountCount.rows[0].count}, Tweets: ${tweetCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateDatabase();