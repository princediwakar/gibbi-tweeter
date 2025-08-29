import { NextRequest, NextResponse } from 'next/server';
import { getAllTweets, saveTweet } from '@/lib/db';
import { postToTwitter } from '@/lib/twitter';
import { logger } from '@/lib/logger';
import { getCurrentTimeInIST } from '@/lib/utils';
import { getPostingPersonasForHour } from '@/lib/schedule';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nowIST = getCurrentTimeInIST();
    const currentHourIST = nowIST.getHours();
    
    logger.info(`🔍 Checking for tweets ready to post at ${currentHourIST}:00 IST`, 'auto-post');

    // Check which personas are scheduled for posting at current hour
    const scheduledPersonaKeys = getPostingPersonasForHour(currentHourIST);
    
    if (scheduledPersonaKeys.length === 0) {
      return NextResponse.json({
        success: true,
        message: `⏳ No personas scheduled for posting at ${currentHourIST}:00 IST`,
        scheduledPersonas: [],
        currentHour: currentHourIST,
        found: 0,
        posted: 0,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`📋 Scheduled personas for posting: ${scheduledPersonaKeys.join(', ')}`, 'auto-post');

    // Get all tweets
    const allTweets = await getAllTweets();
    
    // Find tweets ready to post - must not be posted yet and persona must be scheduled for posting
    const readyTweets = allTweets.filter(tweet => {
      // Skip already posted or failed tweets
      if (tweet.status === 'posted' || tweet.status === 'failed') return false;
      
      // Check if tweet's persona is scheduled for posting at current hour
      return scheduledPersonaKeys.includes(tweet.persona);
    });

    logger.info(`📝 Found ${readyTweets.length} tweets ready to post from available personas`, 'auto-post');

    let postedCount = 0;
    const errors: string[] = [];

    // Post each ready tweet
    for (const tweet of readyTweets) {
      try {
        logger.info(`📤 Posting tweet: ${tweet.content.substring(0, 50)}...`, 'auto-post');
        
        const result = await postToTwitter(tweet.content, tweet.hashtags);
        
        // Update tweet status
        const updatedTweet = {
          ...tweet,
          status: 'posted' as const,
          postedAt: new Date().toISOString(),
          twitterId: result.data.id,
          twitterUrl: `https://x.com/user/status/${result.data.id}`
        };
        
        await saveTweet(updatedTweet);
        postedCount++;
        
        logger.info(`✅ Successfully posted tweet ${tweet.id} - Twitter ID: ${result.data.id}`, 'auto-post');
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to post tweet ${tweet.id}: ${errorMsg}`, 'auto-post', error as Error);
        
        // Mark tweet as failed
        const failedTweet = {
          ...tweet,
          status: 'failed' as const,
          errorMessage: errorMsg
        };
        await saveTweet(failedTweet);
        
        errors.push(`Tweet ${tweet.id}: ${errorMsg}`);
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      currentTime: `${nowIST.getHours()}:${nowIST.getMinutes().toString().padStart(2, '0')} IST`,
      scheduledPersonas: scheduledPersonaKeys,
      found: readyTweets.length,
      posted: postedCount,
      errors: errors.length,
      errorDetails: errors,
      message: postedCount > 0 
        ? `🚀 Posted ${postedCount} tweets successfully from scheduled personas!`
        : scheduledPersonaKeys.length > 0 
          ? '⏳ No tweets ready to post from scheduled personas at this time'
          : `⏳ No personas scheduled for posting at ${currentHourIST}:00 IST`,
    };

    logger.info(`📊 Posting summary: ${postedCount}/${readyTweets.length} posted, ${errors.length} errors`, 'auto-post');
    
    return NextResponse.json(response);

  } catch (error) {
    logger.error('Post-ready check failed', 'auto-post', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check/post ready tweets',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}