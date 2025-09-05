require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

class TempAccountService {
  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
    this.algorithm = 'aes-256-gcm';
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
}

async function migrateToEncrypted() {
  try {
    console.log('🔄 Starting migration to encrypted credentials...');
    
    const accountService = new TempAccountService();
    
    // Step 1: Add encrypted columns
    console.log('1. Adding encrypted credential columns...');
    await sql`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS twitter_api_key_encrypted TEXT,
      ADD COLUMN IF NOT EXISTS twitter_api_secret_encrypted TEXT,
      ADD COLUMN IF NOT EXISTS twitter_access_token_encrypted TEXT,
      ADD COLUMN IF NOT EXISTS twitter_access_token_secret_encrypted TEXT,
      ADD COLUMN IF NOT EXISTS personas TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'
    `;
    
    // Step 2: Migrate existing data to encrypted format
    console.log('2. Encrypting existing credentials...');
    const existingAccounts = await sql`
      SELECT id, twitter_api_key, twitter_api_secret, twitter_access_token, twitter_access_token_secret
      FROM accounts
      WHERE twitter_api_key_encrypted IS NULL
    `;
    
    for (const account of existingAccounts.rows) {
      console.log(`   Encrypting credentials for account ${account.id}...`);
      
      const encryptedApiKey = accountService.encrypt(account.twitter_api_key);
      const encryptedApiSecret = accountService.encrypt(account.twitter_api_secret);
      const encryptedAccessToken = accountService.encrypt(account.twitter_access_token);
      const encryptedAccessTokenSecret = accountService.encrypt(account.twitter_access_token_secret);
      
      await sql`
        UPDATE accounts 
        SET 
          twitter_api_key_encrypted = ${encryptedApiKey},
          twitter_api_secret_encrypted = ${encryptedApiSecret},
          twitter_access_token_encrypted = ${encryptedAccessToken},
          twitter_access_token_secret_encrypted = ${encryptedAccessTokenSecret}
        WHERE id = ${account.id}
      `;
    }
    
    // Step 3: Update account records with default personas and branding
    console.log('3. Setting default personas and branding...');
    
    // Set personas and branding for Gibbi account
    await sql`
      UPDATE accounts 
      SET 
        personas = '{"vocabularyBuilder", "grammarMaster", "communicationExpert"}',
        branding = '{"theme": "educational", "audience": "english_learners", "tone": "helpful", "cta_frequency": 0.15, "cta_message": "Learn more at Gibbi.ai"}'
      WHERE twitter_handle = '@gibbiai'
    `;
    
    // Set personas and branding for Prince account
    await sql`
      UPDATE accounts 
      SET 
        personas = '{"productInsights", "startupContent", "techCommentary"}',
        branding = '{"theme": "professional", "audience": "entrepreneurs", "tone": "authentic", "cta_frequency": 0.1}'
      WHERE twitter_handle = '@princediwakar25'
    `;
    
    // Set default for any other accounts
    await sql`
      UPDATE accounts 
      SET 
        personas = '{"general"}',
        branding = '{"theme": "general", "audience": "general", "tone": "friendly"}'
      WHERE personas = '{}'
    `;
    
    // Step 4: Drop old unencrypted columns (commented out for safety)
    console.log('4. Old unencrypted columns left intact for rollback safety');
    /*
    await sql`
      ALTER TABLE accounts 
      DROP COLUMN IF EXISTS twitter_api_key,
      DROP COLUMN IF EXISTS twitter_api_secret,
      DROP COLUMN IF EXISTS twitter_access_token,
      DROP COLUMN IF EXISTS twitter_access_token_secret
    `;
    */
    
    // Step 5: Verify migration
    console.log('5. Verifying migration...');
    const verifyAccounts = await sql`
      SELECT id, name, twitter_handle, 
             twitter_api_key_encrypted IS NOT NULL as has_encrypted_key,
             personas,
             branding
      FROM accounts
    `;
    
    console.log('✅ Migration completed! Account status:');
    verifyAccounts.rows.forEach(account => {
      console.log(`   ${account.name} (${account.twitter_handle}): encrypted=${account.has_encrypted_key}, personas=${account.personas?.length || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

migrateToEncrypted();