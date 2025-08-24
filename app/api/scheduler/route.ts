import { NextResponse } from 'next/server';
import { startScheduler, stopScheduler, generateAndScheduleTweet } from '@/lib/scheduler';
import { getScheduledTweets, saveTweet } from '@/lib/neon-db';
import { postTweet } from '@/lib/twitter';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        startScheduler();
        return NextResponse.json({ message: 'Scheduler started' });
      
      case 'stop':
        stopScheduler();
        return NextResponse.json({ message: 'Scheduler stopped' });
      
      case 'generate':
        const tweet = await generateAndScheduleTweet();
        return NextResponse.json(tweet);
      
      case 'process':
        const scheduledTweets = await getScheduledTweets();
        console.log(`Found ${scheduledTweets.length} tweets ready to post`);
        const results = [];

        for (const tweet of scheduledTweets) {
          try {
            console.log(`Posting tweet: ${tweet.content.substring(0, 50)}...`);
            const result = await postTweet(tweet.content);
            
            tweet.status = 'posted';
            tweet.posted_at = new Date().toISOString();
            tweet.twitter_id = result.data.id;
            await saveTweet(tweet);
            
            results.push({ id: tweet.id, status: 'posted', twitterId: result.data.id });
            console.log(`Successfully posted tweet ${tweet.id}`);
          } catch (error) {
            console.error(`Failed to post tweet ${tweet.id}:`, error);
            tweet.status = 'failed';
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            tweet.error_message = errorMessage;
            await saveTweet(tweet);
            results.push({ id: tweet.id, status: 'failed', error: errorMessage });
          }
        }
        
        return NextResponse.json({ 
          message: `Processed ${scheduledTweets.length} scheduled tweets`, 
          results 
        });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in scheduler API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}