import { sql } from '@vercel/postgres';
// In-memory storage for testing when database is not available
const inMemoryAccounts: Account[] = [];
const inMemoryTweets: Tweet[] = [];
// Use real database connection
const USE_IN_MEMORY = false; // Use PostgreSQL database

// Account configuration for individual account preferences
interface AccountConfig {
  allowed_personas?: string[]; // Specific personas this account can use
  schedule_template?: 'highFrequency' | 'mediumFrequency' | 'lowFrequency' | 'custom';
  custom_schedule?: Record<string, unknown>; // Custom schedule configuration
  cta_settings?: {
    enabled: boolean;
    url?: string;
    frequency?: number; // 0.0 to 1.0
    message_templates?: string[];
  };
  timezone?: string;
  posting_enabled?: boolean;
}

// Account interface for multi-account support
export interface Account {
  id: string;
  name: string;
  twitter_handle: string;
  twitter_api_key: string;
  twitter_api_secret: string;
  twitter_access_token: string;
  twitter_access_token_secret: string;
  config?: AccountConfig; // Individual account configuration
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Updated Tweet interface with account_id
export interface Tweet {
  id: string;
  account_id: string;
  content: string;
  hashtags: string[];
  persona: string;
  posted_at?: string;
  twitter_id?: string;
  twitter_url?: string;
  error_message?: string;
  status: 'ready' | 'posted' | 'failed' | 'draft' | 'scheduled';
  created_at: string;
  quality_score?: unknown;
}

// Encryption utilities for Twitter credentials
// Encryption key for future use - currently using unencrypted storage
// const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-please-change-in-production';

function encrypt(text: string): string {
  try {
    // For development/testing, just use simple base64 encoding
    // In production, use proper encryption with IV
    const encoded = Buffer.from(text).toString('base64');
    return `enc_${encoded}`;
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback: return original text (not recommended for production)
    return text;
  }
}

function decrypt(encryptedText: string): string {
  try {
    if (encryptedText.startsWith('enc_')) {
      // Remove prefix and decode
      const encoded = encryptedText.substring(4);
      return Buffer.from(encoded, 'base64').toString('utf8');
    }
    // Fallback for unencrypted data
    return encryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    // Fallback: return original text
    return encryptedText;
  }
}

// Account management functions
export async function getAllAccounts(): Promise<Account[]> {
  if (USE_IN_MEMORY) {
    console.log('[Memory] Getting all accounts, count:', inMemoryAccounts.length);
    return [...inMemoryAccounts];
  }

  try {
    const result = await sql`
      SELECT * FROM accounts
      ORDER BY created_at DESC
    `;
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      twitter_handle: row.twitter_handle,
      twitter_api_key: decrypt(row.twitter_api_key),
      twitter_api_secret: decrypt(row.twitter_api_secret),
      twitter_access_token: decrypt(row.twitter_access_token),
      twitter_access_token_secret: decrypt(row.twitter_access_token_secret),
      config: row.config ? JSON.parse(row.config) : undefined,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  } catch (error) {
    console.error('[Neon] Error getting accounts:', error);
    return [];
  }
}

export async function getAccount(id: string): Promise<Account | null> {
  if (USE_IN_MEMORY) {
    const account = inMemoryAccounts.find(acc => acc.id === id);
    return account || null;
  }

  try {
    const result = await sql`
      SELECT * FROM accounts
      WHERE id = ${id}
    `;
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      twitter_handle: row.twitter_handle,
      twitter_api_key: decrypt(row.twitter_api_key),
      twitter_api_secret: decrypt(row.twitter_api_secret),
      twitter_access_token: decrypt(row.twitter_access_token),
      twitter_access_token_secret: decrypt(row.twitter_access_token_secret),
      config: row.config ? JSON.parse(row.config) : undefined,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } catch (error) {
    console.error('[Neon] Error getting account:', error);
    return null;
  }
}

export async function saveAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  if (USE_IN_MEMORY) {
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newAccount: Account = {
      ...account,
      id: accountId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    inMemoryAccounts.push(newAccount);
    console.log(`[Memory] Saved account ${accountId} - ${account.name}`);
    return accountId;
  }

  try {
    const result = await sql`
      INSERT INTO accounts (
        name, twitter_handle, twitter_api_key, twitter_api_secret,
        twitter_access_token, twitter_access_token_secret, config, status
      ) VALUES (
        ${account.name},
        ${account.twitter_handle},
        ${encrypt(account.twitter_api_key)},
        ${encrypt(account.twitter_api_secret)},
        ${encrypt(account.twitter_access_token)},
        ${encrypt(account.twitter_access_token_secret)},
        ${account.config ? JSON.stringify(account.config) : null},
        ${account.status}
      )
      RETURNING id
    `;
    
    const accountId = result.rows[0].id;
    console.log(`[Neon] Saved account ${accountId}`);
    return accountId;
  } catch (error) {
    console.error('[Neon] Error saving account:', error);
    throw error;
  }
}

export async function updateAccount(id: string, updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  try {
    const updateFields: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (updates.name) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.twitter_handle) {
      updateFields.push(`twitter_handle = $${paramIndex++}`);
      values.push(updates.twitter_handle);
    }
    if (updates.twitter_api_key) {
      updateFields.push(`twitter_api_key = $${paramIndex++}`);
      values.push(encrypt(updates.twitter_api_key));
    }
    if (updates.twitter_api_secret) {
      updateFields.push(`twitter_api_secret = $${paramIndex++}`);
      values.push(encrypt(updates.twitter_api_secret));
    }
    if (updates.twitter_access_token) {
      updateFields.push(`twitter_access_token = $${paramIndex++}`);
      values.push(encrypt(updates.twitter_access_token));
    }
    if (updates.twitter_access_token_secret) {
      updateFields.push(`twitter_access_token_secret = $${paramIndex++}`);
      values.push(encrypt(updates.twitter_access_token_secret));
    }
    if (updates.config !== undefined) {
      updateFields.push(`config = $${paramIndex++}`);
      values.push(updates.config ? JSON.stringify(updates.config) : 'null');
    }
    if (updates.status) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updateFields.length === 0) return;

    values.push(id);
    const query = `UPDATE accounts SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    
    await sql.query(query, values);
    console.log(`[Neon] Updated account ${id}`);
  } catch (error) {
    console.error('[Neon] Error updating account:', error);
    throw error;
  }
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    await sql`DELETE FROM accounts WHERE id = ${id}`;
    console.log(`[Neon] Deleted account ${id}`);
  } catch (error) {
    console.error('[Neon] Error deleting account:', error);
    throw error;
  }
}

export async function getActiveAccounts(): Promise<Account[]> {
  if (USE_IN_MEMORY) {
    return inMemoryAccounts.filter(acc => acc.status === 'active');
  }

  try {
    const result = await sql`
      SELECT * FROM accounts
      WHERE status = 'active'
      ORDER BY created_at ASC
    `;
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      twitter_handle: row.twitter_handle,
      twitter_api_key: decrypt(row.twitter_api_key),
      twitter_api_secret: decrypt(row.twitter_api_secret),
      twitter_access_token: decrypt(row.twitter_access_token),
      twitter_access_token_secret: decrypt(row.twitter_access_token_secret),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  } catch (error) {
    console.error('[Neon] Error getting active accounts:', error);
    return [];
  }
}

// Updated tweet functions to support account filtering
export async function getAllTweets(): Promise<Tweet[]> {
  try {
    const result = await sql`
      SELECT * FROM tweets
      ORDER BY created_at DESC
    `;
    
    return result.rows.map(row => ({
      id: row.id,
      account_id: row.account_id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
      twitterId: row.twitter_id,
      twitterUrl: row.twitter_url,
      errorMessage: row.error_message,
      status: row.status,
      createdAt: new Date(row.created_at),
      qualityScore: row.quality_score,
      // Keep snake_case for backward compatibility
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      created_at: row.created_at,
      quality_score: row.quality_score
    }));
  } catch (error) {
    console.error('[Neon] Error getting tweets:', error);
    return [];
  }
}

export async function getTweetsByAccount(accountId: string): Promise<Tweet[]> {
  try {
    const result = await sql`
      SELECT * FROM tweets
      WHERE account_id = ${accountId}
      ORDER BY created_at DESC
    `;
    
    return result.rows.map(row => ({
      id: row.id,
      account_id: row.account_id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
      twitterId: row.twitter_id,
      twitterUrl: row.twitter_url,
      errorMessage: row.error_message,
      status: row.status,
      createdAt: new Date(row.created_at),
      qualityScore: row.quality_score,
      // Keep snake_case for backward compatibility
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      created_at: row.created_at,
      quality_score: row.quality_score
    }));
  } catch (error) {
    console.error('[Neon] Error getting tweets by account:', error);
    return [];
  }
}

// Helper function to get property value with fallback for camelCase/snake_case
function getProperty(obj: Record<string, unknown>, snakeCase: string, camelCase: string): string | undefined {
  const value = obj[snakeCase] ?? obj[camelCase];
  return typeof value === 'string' ? value : undefined;
}

export async function saveTweet(tweet: Omit<Tweet, 'created_at'> & { createdAt?: string }): Promise<void> {
  if (USE_IN_MEMORY) {
    const tweetObj = tweet as Record<string, unknown>;
    const newTweet: Tweet = {
      id: tweet.id,
      account_id: tweet.account_id,
      content: tweet.content,
      hashtags: tweet.hashtags,
      persona: tweet.persona,
      status: tweet.status,
      created_at: tweet.createdAt || getProperty(tweetObj, 'created_at', 'createdAt') || new Date().toISOString(),
      posted_at: getProperty(tweetObj, 'posted_at', 'postedAt'),
      twitter_id: getProperty(tweetObj, 'twitter_id', 'twitterId'),
      twitter_url: getProperty(tweetObj, 'twitter_url', 'twitterUrl'),
      error_message: getProperty(tweetObj, 'error_message', 'errorMessage'),
      quality_score: tweetObj.quality_score ? JSON.stringify(tweetObj.quality_score) : (tweetObj.qualityScore ? JSON.stringify(tweetObj.qualityScore) : undefined)
    };

    // Find existing tweet and update or add new
    const existingIndex = inMemoryTweets.findIndex(t => t.id === tweet.id);
    if (existingIndex >= 0) {
      inMemoryTweets[existingIndex] = newTweet;
      console.log(`[Memory] Updated tweet ${tweet.id}`);
    } else {
      inMemoryTweets.push(newTweet);
      console.log(`[Memory] Saved new tweet ${tweet.id}`);
    }
    return;
  }

  try {
    const tweetObj = tweet as Record<string, unknown>;
    
    await sql`
      INSERT INTO tweets (
        id, account_id, content, hashtags, persona, posted_at, 
        twitter_id, twitter_url, error_message, status, created_at, quality_score
      ) VALUES (
        ${tweet.id},
        ${tweet.account_id},
        ${tweet.content},
        ${JSON.stringify(tweet.hashtags)},
        ${tweet.persona},
        ${getProperty(tweetObj, 'posted_at', 'postedAt')},
        ${getProperty(tweetObj, 'twitter_id', 'twitterId')},
        ${getProperty(tweetObj, 'twitter_url', 'twitterUrl')},
        ${getProperty(tweetObj, 'error_message', 'errorMessage')},
        ${tweet.status},
        ${tweet.createdAt || getProperty(tweetObj, 'created_at', 'createdAt') || new Date().toISOString()},
        ${tweetObj.quality_score ? JSON.stringify(tweetObj.quality_score) : (tweetObj.qualityScore ? JSON.stringify(tweetObj.qualityScore) : null)}
      )
      ON CONFLICT (id) 
      DO UPDATE SET
        account_id = EXCLUDED.account_id,
        content = EXCLUDED.content,
        hashtags = EXCLUDED.hashtags,
        persona = EXCLUDED.persona,
        posted_at = EXCLUDED.posted_at,
        twitter_id = EXCLUDED.twitter_id,
        twitter_url = EXCLUDED.twitter_url,
        error_message = EXCLUDED.error_message,
        status = EXCLUDED.status,
        quality_score = EXCLUDED.quality_score
    `;
    
    console.log(`[Neon] Saved tweet ${tweet.id}`);
  } catch (error) {
    console.error('[Neon] Error saving tweet:', error);
    throw error;
  }
}

export async function getReadyTweets(): Promise<Tweet[]> {
  try {
    const result = await sql`
      SELECT * FROM tweets
      WHERE status = 'ready'
      ORDER BY created_at ASC
    `;
    
    return result.rows.map(row => ({
      id: row.id,
      account_id: row.account_id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
      twitterId: row.twitter_id,
      twitterUrl: row.twitter_url,
      errorMessage: row.error_message,
      status: row.status,
      createdAt: new Date(row.created_at),
      qualityScore: row.quality_score,
      // Keep snake_case for backward compatibility
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      created_at: row.created_at,
      quality_score: row.quality_score
    }));
  } catch (error) {
    console.error('[Neon] Error getting ready tweets:', error);
    return [];
  }
}

export async function getReadyTweetsByAccount(accountId: string): Promise<Tweet[]> {
  try {
    const result = await sql`
      SELECT * FROM tweets
      WHERE status = 'ready' AND account_id = ${accountId}
      ORDER BY created_at ASC
    `;
    
    return result.rows.map(row => ({
      id: row.id,
      account_id: row.account_id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
      twitterId: row.twitter_id,
      twitterUrl: row.twitter_url,
      errorMessage: row.error_message,
      status: row.status,
      createdAt: new Date(row.created_at),
      qualityScore: row.quality_score,
      // Keep snake_case for backward compatibility
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      created_at: row.created_at,
      quality_score: row.quality_score
    }));
  } catch (error) {
    console.error('[Neon] Error getting ready tweets by account:', error);
    return [];
  }
}

export async function getPaginatedTweets(params: { page: number; limit: number; accountId?: string }): Promise<{
  data: Tweet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  if (USE_IN_MEMORY) {
    const filteredTweets = params.accountId 
      ? inMemoryTweets.filter(t => t.account_id === params.accountId)
      : inMemoryTweets;
    
    const total = filteredTweets.length;
    const offset = (params.page - 1) * params.limit;
    const tweets = filteredTweets
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + params.limit);
    
    const totalPages = Math.ceil(total / params.limit);
    
    return {
      data: tweets,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  }

  try {
    const offset = (params.page - 1) * params.limit;
    
    // Get total count with optional account filtering
    const countResult = params.accountId 
      ? await sql`SELECT COUNT(*) as count FROM tweets WHERE account_id = ${params.accountId}`
      : await sql`SELECT COUNT(*) as count FROM tweets`;
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data with optional account filtering
    const result = params.accountId 
      ? await sql`
          SELECT * FROM tweets
          WHERE account_id = ${params.accountId}
          ORDER BY created_at DESC
          LIMIT ${params.limit} OFFSET ${offset}
        `
      : await sql`
          SELECT * FROM tweets
          ORDER BY created_at DESC
          LIMIT ${params.limit} OFFSET ${offset}
        `;
    
    const tweets = result.rows.map(row => ({
      id: row.id,
      account_id: row.account_id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      postedAt: row.posted_at ? new Date(row.posted_at) : undefined,
      twitterId: row.twitter_id,
      twitterUrl: row.twitter_url,
      errorMessage: row.error_message,
      status: row.status,
      createdAt: new Date(row.created_at),
      qualityScore: row.quality_score,
      // Keep snake_case for backward compatibility
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      created_at: row.created_at,
      quality_score: row.quality_score
    }));
    
    const totalPages = Math.ceil(total / params.limit);
    
    return {
      data: tweets,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  } catch (error) {
    console.error('[Neon] Error getting paginated tweets:', error);
    return {
      data: [],
      total: 0,
      page: params.page,
      limit: params.limit,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
  }
}

export async function deleteTweet(id: string): Promise<void> {
  try {
    await sql`DELETE FROM tweets WHERE id = ${id}`;
    console.log(`[Neon] Deleted tweet ${id}`);
  } catch (error) {
    console.error('[Neon] Error deleting tweet:', error);
    throw error;
  }
}

export async function deleteTweets(ids: string[]): Promise<void> {
  try {
    if (ids.length === 0) return;
    
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
    const query = `DELETE FROM tweets WHERE id IN (${placeholders})`;
    
    await sql.query(query, ids);
    console.log(`[Neon] Deleted ${ids.length} tweets`);
  } catch (error) {
    console.error('[Neon] Error deleting tweets:', error);
    throw error;
  }
}

export function generateTweetId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}