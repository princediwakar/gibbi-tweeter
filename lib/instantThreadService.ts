import { TwitterApi } from 'twitter-api-v2';
import { Tweet } from './types';
import { saveTweet, getThreadTweet, Thread } from './db';

interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface ThreadPostResult {
  success: boolean;
  thread_id: string;
  tweets_posted: number;
  twitter_ids: string[];
  error?: string;
}

/**
 * Post complete thread instantly using twitter-api-v2 tweetThread method
 */
export async function postCompleteThread(
  threadId: string,
  accountId: string,
  totalTweets: number,
  credentials: TwitterCredentials,
  twitterHandle: string
): Promise<ThreadPostResult> {
  try {
    console.log(`🚀 Starting instant thread posting for thread ${threadId} (${totalTweets} tweets)`);
    
    // Initialize Twitter API client
    const client = new TwitterApi({
      appKey: credentials.apiKey,
      appSecret: credentials.apiSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessSecret,
    });

    // Get all tweets for the thread in sequence order
    const threadTweets: Tweet[] = [];
    for (let sequence = 1; sequence <= totalTweets; sequence++) {
      const tweet = await getThreadTweet(threadId, sequence);
      if (!tweet) {
        throw new Error(`Missing tweet ${sequence} in thread ${threadId}`);
      }
      threadTweets.push(tweet);
    }

    console.log(`✅ Retrieved ${threadTweets.length} tweets for thread ${threadId}`);

    // Prepare thread content with proper formatting
    const threadContent = threadTweets.map((tweet, index) => {
      // Add thread indicators and hashtags
      const sequenceNum = index + 1;
      const threadIndicator = `${sequenceNum}/${totalTweets} 🧵`;
      const content = `${tweet.content}\n\n${threadIndicator}`;
      
      // Add hashtags to the last tweet only to avoid repetition
      if (index === threadTweets.length - 1 && tweet.hashtags && tweet.hashtags.length > 0) {
        return `${content}\n\n${tweet.hashtags.map(tag => `#${tag}`).join(' ')}`;
      }
      
      return content;
    });

    console.log(`📝 Formatted ${threadContent.length} tweets for posting`);
    console.log(`📝 First tweet preview: ${threadContent[0].substring(0, 100)}...`);

    // Post the entire thread at once using tweetThread
    const results = await client.v2.tweetThread(threadContent);
    
    if (!results || results.length === 0) {
      throw new Error('Twitter API returned no results');
    }

    console.log(`✅ Posted ${results.length} tweets successfully`);

    // Update all tweet records with Twitter IDs and URLs
    const twitterIds: string[] = [];
    for (let i = 0; i < results.length && i < threadTweets.length; i++) {
      const result = results[i];
      const tweet = threadTweets[i];
      
      if (result.data?.id) {
        const twitterId = result.data.id;
        twitterIds.push(twitterId);
        
        // Update tweet with posted information
        const updatedTweet = {
          ...tweet,
          status: 'posted' as const,
          posted_at: new Date().toISOString(),
          twitter_id: twitterId,
          twitter_url: `https://x.com/${twitterHandle.replace('@', '')}/status/${twitterId}`,
          // For threading, the parent is the previous tweet (except for the first tweet)
          parent_twitter_id: i > 0 && results[i - 1]?.data?.id ? results[i - 1].data.id : null
        };
        
        await saveTweet(updatedTweet);
        console.log(`💾 Updated tweet ${tweet.id} with Twitter ID: ${twitterId}`);
      }
    }

    // Log thread URLs for easy access
    const threadUrl = `https://x.com/${twitterHandle.replace('@', '')}/status/${twitterIds[0]}`;
    console.log(`🔗 Thread posted successfully: ${threadUrl}`);
    
    return {
      success: true,
      thread_id: threadId,
      tweets_posted: twitterIds.length,
      twitter_ids: twitterIds
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to post complete thread ${threadId}:`, errorMsg);
    
    return {
      success: false,
      thread_id: threadId,
      tweets_posted: 0,
      twitter_ids: [],
      error: errorMsg
    };
  }
}

/**
 * Check if a thread is ready for instant posting
 */
export function isThreadReadyForInstantPosting(thread: Thread): boolean {
  return thread.status === 'ready' && thread.total_tweets > 0;
}

/**
 * Format thread preview for logging
 */
export function getThreadPreview(threadId: string, title: string, totalTweets: number): string {
  return `Thread "${title}" (${threadId}) - ${totalTweets} tweets`;
}

const instantThreadService = {
  postCompleteThread,
  isThreadReadyForInstantPosting,
  getThreadPreview
};

export default instantThreadService;