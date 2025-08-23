import { NextRequest, NextResponse } from 'next/server';
import { getAllTweets, saveTweet } from '@/lib/db';
import { postToTwitter } from '@/lib/twitter';
import { logIST, toIST } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = toIST(new Date());
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    logIST(`🔍 Checking for tweets ready to post at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} IST`);

    // Get all tweets
    const allTweets = await getAllTweets();
    
    // Find tweets ready to post (scheduled within 15-minute window)
    const readyTweets = allTweets.filter(tweet => {
      if (tweet.status !== 'scheduled' || !tweet.scheduledFor) return false;
      
      const scheduledTime = toIST(new Date(tweet.scheduledFor));
      const scheduledMinutes = scheduledTime.getHours() * 60 + scheduledTime.getMinutes();
      
      // Check if tweet is scheduled for within ±7 minutes of current time
      const timeDiff = Math.abs(currentTime - scheduledMinutes);
      return timeDiff <= 7; // 15-minute window (±7 minutes)
    });

    logIST(`📝 Found ${readyTweets.length} tweets ready to post`);

    let postedCount = 0;
    const errors: string[] = [];

    // Post each ready tweet
    for (const tweet of readyTweets) {
      try {
        logIST(`📤 Posting tweet: ${tweet.content.substring(0, 50)}...`);
        
        const result = await postToTwitter(tweet.content, tweet.hashtags);
        
        // Update tweet status
        tweet.status = 'posted';
        tweet.postedAt = new Date();
        tweet.twitterId = result.data.id;
        tweet.twitterUrl = `https://x.com/user/status/${result.data.id}`;
        
        await saveTweet(tweet);
        postedCount++;
        
        logIST(`✅ Successfully posted tweet ${tweet.id} - Twitter ID: ${result.data.id}`);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logIST(`❌ Failed to post tweet ${tweet.id}: ${errorMsg}`);
        
        // Mark tweet as failed
        tweet.status = 'failed';
        tweet.errorMessage = errorMsg;
        await saveTweet(tweet);
        
        errors.push(`Tweet ${tweet.id}: ${errorMsg}`);
      }
    }

    const response = {
      success: true,
      timestamp: now.toISOString(),
      currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} IST`,
      found: readyTweets.length,
      posted: postedCount,
      errors: errors.length,
      errorDetails: errors,
      message: postedCount > 0 
        ? `🚀 Posted ${postedCount} tweets successfully!`
        : '⏳ No tweets ready to post at this time',
    };

    logIST(`📊 Posting summary: ${postedCount}/${readyTweets.length} posted, ${errors.length} errors`);
    
    return NextResponse.json(response);

  } catch (error) {
    logIST('❌ Post-ready check failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check/post ready tweets',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}