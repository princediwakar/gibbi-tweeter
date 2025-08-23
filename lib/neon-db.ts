import { sql } from '@vercel/postgres';

export interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  persona: string;
  scheduled_for?: string;
  posted_at?: string;
  twitter_id?: string;
  twitter_url?: string;
  error_message?: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  created_at: string;
  quality_score?: unknown;
}

export async function getAllTweets(): Promise<Tweet[]> {
  try {
    const result = await sql`
      SELECT * FROM tweets
      ORDER BY created_at DESC
    `;
    
    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      scheduled_for: row.scheduled_for,
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      status: row.status,
      created_at: row.created_at,
      quality_score: row.quality_score
    }));
  } catch (error) {
    console.error('[Neon] Error getting tweets:', error);
    return [];
  }
}

export async function saveTweet(tweet: Omit<Tweet, 'created_at'> & { createdAt?: string }): Promise<void> {
  try {
    await sql`
      INSERT INTO tweets (
        id, content, hashtags, persona, scheduled_for, posted_at, 
        twitter_id, twitter_url, error_message, status, created_at, quality_score
      ) VALUES (
        ${tweet.id},
        ${tweet.content},
        ${JSON.stringify(tweet.hashtags)},
        ${tweet.persona},
        ${tweet.scheduled_for || null},
        ${tweet.posted_at || null},
        ${tweet.twitter_id || null},
        ${tweet.twitter_url || null},
        ${tweet.error_message || null},
        ${tweet.status},
        ${tweet.createdAt || new Date().toISOString()},
        ${tweet.quality_score ? JSON.stringify(tweet.quality_score) : null}
      )
      ON CONFLICT (id) 
      DO UPDATE SET
        content = EXCLUDED.content,
        hashtags = EXCLUDED.hashtags,
        persona = EXCLUDED.persona,
        scheduled_for = EXCLUDED.scheduled_for,
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

export async function getScheduledTweets(options: {
  status?: string;
  from?: Date;
  to?: Date;
  limit?: number;
} = {}): Promise<Tweet[]> {
  try {
    let query = 'SELECT * FROM tweets WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;
    
    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }
    
    if (options.from) {
      query += ` AND scheduled_for >= $${paramIndex}`;
      params.push(options.from.toISOString());
      paramIndex++;
    }
    
    if (options.to) {
      query += ` AND scheduled_for <= $${paramIndex}`;
      params.push(options.to.toISOString());
      paramIndex++;
    }
    
    query += ' ORDER BY scheduled_for ASC';
    
    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
    }
    
    const result = await sql.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      scheduled_for: row.scheduled_for,
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      status: row.status,
      created_at: row.created_at,
      quality_score: row.quality_score
    }));
  } catch (error) {
    console.error('[Neon] Error getting scheduled tweets:', error);
    return [];
  }
}

export async function getPaginatedTweets(params: { page: number; limit: number }): Promise<{
  data: Tweet[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  try {
    const offset = (params.page - 1) * params.limit;
    
    // Get total count
    const countResult = await sql`SELECT COUNT(*) as count FROM tweets`;
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated data
    const result = await sql`
      SELECT * FROM tweets
      ORDER BY created_at DESC
      LIMIT ${params.limit} OFFSET ${offset}
    `;
    
    const tweets = result.rows.map(row => ({
      id: row.id,
      content: row.content,
      hashtags: row.hashtags || [],
      persona: row.persona,
      scheduled_for: row.scheduled_for,
      posted_at: row.posted_at,
      twitter_id: row.twitter_id,
      twitter_url: row.twitter_url,
      error_message: row.error_message,
      status: row.status,
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