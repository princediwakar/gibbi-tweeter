import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  quality_score?: any;
}

export async function getAllTweets(): Promise<Tweet[]> {
  try {
    const { data, error } = await supabase
      .from('tweets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Supabase] Error getting tweets:', error);
    return [];
  }
}

export async function saveTweet(tweet: Omit<Tweet, 'created_at'> & { createdAt?: string }): Promise<void> {
  try {
    const supabaseTweet = {
      id: tweet.id,
      content: tweet.content,
      hashtags: tweet.hashtags,
      persona: tweet.persona,
      scheduled_for: tweet.scheduledFor,
      posted_at: tweet.postedAt,
      twitter_id: tweet.twitterId,
      twitter_url: tweet.twitterUrl,
      error_message: tweet.errorMessage,
      status: tweet.status,
      created_at: tweet.createdAt || new Date().toISOString(),
      quality_score: tweet.qualityScore
    };

    const { error } = await supabase
      .from('tweets')
      .upsert(supabaseTweet, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`[Supabase] Saved tweet ${tweet.id}`);
  } catch (error) {
    console.error('[Supabase] Error saving tweet:', error);
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
    let query = supabase.from('tweets').select('*');
    
    if (options.status) {
      query = query.eq('status', options.status);
    }
    
    if (options.from) {
      query = query.gte('scheduled_for', options.from.toISOString());
    }
    
    if (options.to) {
      query = query.lte('scheduled_for', options.to.toISOString());
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query.order('scheduled_for', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Supabase] Error getting scheduled tweets:', error);
    return [];
  }
}

export function generateTweetId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}