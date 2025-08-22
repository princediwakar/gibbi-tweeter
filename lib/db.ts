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

const DB_PATH = join(process.cwd(), 'data', 'tweets.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
  } catch (_error) {
    // Directory might already exist
  }
}

export async function getAllTweets(): Promise<Tweet[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_PATH, 'utf8');
    const tweets = JSON.parse(data);
    return tweets.map((tweet: Tweet & { createdAt: string; scheduledFor?: string; postedAt?: string }) => ({
      ...tweet,
      createdAt: new Date(tweet.createdAt),
      scheduledFor: tweet.scheduledFor ? new Date(tweet.scheduledFor) : undefined,
      postedAt: tweet.postedAt ? new Date(tweet.postedAt) : undefined,
    }));
  } catch (_error) {
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
  } catch (_error) {
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
  const tweets = await getAllTweets();
  const filteredTweets = tweets.filter(t => t.id !== id);
  await fs.writeFile(DB_PATH, JSON.stringify(filteredTweets, null, 2));
}

export async function deleteTweets(ids: string[]): Promise<void> {
  const tweets = await getAllTweets();
  const filteredTweets = tweets.filter(t => !ids.includes(t.id));
  await fs.writeFile(DB_PATH, JSON.stringify(filteredTweets, null, 2));
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