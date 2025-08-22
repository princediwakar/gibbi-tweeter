import { promises as fs } from 'fs';
import { join } from 'path';

export interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  persona: string;
  qualityScore?: {
    overall: number;
    metrics: {
      engagement: number;
      readability: number;
      uniqueness: number;
      personaAlignment: number;
      viralPotential: number;
      trendRelevance: number;
    };
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    feedback: string[];
  };
  scheduledFor?: Date;
  postedAt?: Date;
  twitterId?: string; // Twitter/X tweet ID
  twitterUrl?: string; // Direct link to tweet
  errorMessage?: string; // Error message for failed tweets
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  createdAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Use /tmp directory in production (Vercel serverless), local data directory in development
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/tmp/tweets.json'  
  : join(process.cwd(), 'data', 'tweets.json');

async function ensureDataDir() {
  try {
    if (process.env.NODE_ENV === 'production') {
      // In production, /tmp directory should already exist
      // Just ensure we can write to it
      await fs.access('/tmp', fs.constants.W_OK);
    } else {
      // In development, create the data directory
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
    }
  } catch (error) {
    console.error('[DB] Error ensuring data directory:', error);
    // Directory might already exist or we might not have permissions
  }
}

export async function getAllTweets(): Promise<Tweet[]> {
  try {
    await ensureDataDir();
    console.log(`[DB] Reading from: ${DB_PATH}`);
    
    // Try to read from the file
    let data: string;
    try {
      data = await fs.readFile(DB_PATH, 'utf8');
    } catch {
      console.log(`[DB] Could not read ${DB_PATH}, initializing with empty array`);
      // If file doesn't exist, initialize with empty array
      const emptyData = JSON.stringify([], null, 2);
      await fs.writeFile(DB_PATH, emptyData);
      return [];
    }
    
    if (!data.trim()) {
      console.log(`[DB] File is empty, returning empty array`);
      return [];
    }
    
    const tweets = JSON.parse(data);
    console.log(`[DB] Successfully loaded ${tweets.length} tweets`);
    
    return tweets.map((tweet: Tweet & { createdAt: string; scheduledFor?: string; postedAt?: string }) => ({
      ...tweet,
      createdAt: new Date(tweet.createdAt),
      scheduledFor: tweet.scheduledFor ? new Date(tweet.scheduledFor) : undefined,
      postedAt: tweet.postedAt ? new Date(tweet.postedAt) : undefined,
    }));
  } catch (error) {
    console.error('[DB] Error in getAllTweets:', error);
    return [];
  }
}

export async function getPaginatedTweets(params: PaginationParams): Promise<PaginatedResult<Tweet>> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf8');
    const allTweets = JSON.parse(data);
    
    // Convert dates
    const tweets = allTweets.map((tweet: Tweet & { createdAt: string; scheduledFor?: string; postedAt?: string }) => ({
      ...tweet,
      createdAt: new Date(tweet.createdAt),
      scheduledFor: tweet.scheduledFor ? new Date(tweet.scheduledFor) : undefined,
      postedAt: tweet.postedAt ? new Date(tweet.postedAt) : undefined,
    }));

    // Sort by creation date (newest first)
    const sortedTweets = tweets.sort((a: Tweet, b: Tweet) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const total = sortedTweets.length;
    const totalPages = Math.ceil(total / params.limit);
    const startIndex = (params.page - 1) * params.limit;
    const endIndex = startIndex + params.limit;
    const paginatedTweets = sortedTweets.slice(startIndex, endIndex);

    return {
      data: paginatedTweets,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  } catch {
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

export async function saveTweet(tweet: Tweet): Promise<void> {
  const tweets = await getAllTweets();
  const existingIndex = tweets.findIndex(t => t.id === tweet.id);
  
  if (existingIndex >= 0) {
    tweets[existingIndex] = tweet;
  } else {
    tweets.push(tweet);
  }
  
  await ensureDataDir();
  await fs.writeFile(DB_PATH, JSON.stringify(tweets, null, 2));
}

export async function deleteTweet(id: string): Promise<void> {
  try {
    console.log(`[DB] Starting deletion for tweet ID: ${id}`);
    console.log(`[DB] Database path: ${DB_PATH}`);
    
    const tweets = await getAllTweets();
    console.log(`[DB] Total tweets before deletion: ${tweets.length}`);
    
    const initialCount = tweets.length;
    const filteredTweets = tweets.filter(t => t.id !== id);
    console.log(`[DB] Tweets after filtering: ${filteredTweets.length}`);
    
    if (initialCount === filteredTweets.length) {
      console.log(`[DB] Warning: No tweet with ID ${id} was found to delete`);
    }
    
    await ensureDataDir();
    console.log(`[DB] Writing to database...`);
    await fs.writeFile(DB_PATH, JSON.stringify(filteredTweets, null, 2));
    console.log(`[DB] Tweet ${id} deleted successfully from database`);
  } catch (error) {
    console.error(`[DB] Error in deleteTweet:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DB] Error details:`, errorMessage);
    throw new Error(`Database deletion failed: ${errorMessage}`);
  }
}

export async function deleteTweets(ids: string[]): Promise<void> {
  try {
    console.log(`[DB] Starting bulk deletion for tweet IDs:`, ids);
    console.log(`[DB] Database path: ${DB_PATH}`);
    
    const tweets = await getAllTweets();
    console.log(`[DB] Total tweets before bulk deletion: ${tweets.length}`);
    
    const initialCount = tweets.length;
    const filteredTweets = tweets.filter(t => !ids.includes(t.id));
    console.log(`[DB] Tweets after bulk filtering: ${filteredTweets.length}`);
    console.log(`[DB] Deleted ${initialCount - filteredTweets.length} tweets`);
    
    await ensureDataDir();
    console.log(`[DB] Writing to database...`);
    await fs.writeFile(DB_PATH, JSON.stringify(filteredTweets, null, 2));
    console.log(`[DB] Bulk deletion completed successfully`);
  } catch (error) {
    console.error(`[DB] Error in deleteTweets:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DB] Error details:`, errorMessage);
    throw new Error(`Database bulk deletion failed: ${errorMessage}`);
  }
}

export async function getScheduledTweets(): Promise<Tweet[]> {
  const tweets = await getAllTweets();
  const now = new Date();
  return tweets.filter(tweet => 
    tweet.status === 'scheduled' && 
    tweet.scheduledFor && 
    tweet.scheduledFor <= now
  );
}

export function generateTweetId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}