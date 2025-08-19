import { promises as fs } from 'fs';
import { join } from 'path';

export interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  topic: string;
  persona: string;
  scheduledFor?: Date;
  postedAt?: Date;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  createdAt: Date;
}

const DB_PATH = join(process.cwd(), 'data', 'tweets.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
  } catch (error) {
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
  } catch (error) {
    return [];
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