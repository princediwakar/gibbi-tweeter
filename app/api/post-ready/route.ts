import { NextRequest, NextResponse } from 'next/server';
import { getAllTweets, saveTweet } from '@/lib/neon-db';
import { postToTwitter } from '@/lib/twitter';
import { logger } from '@/lib/logger';
import { getCurrentTimeInIST } from '@/lib/datetime';
import { getAvailablePersonasForPosting, isPersonaAvailableForPosting } from '@/lib/personas';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nowIST = getCurrentTimeInIST();
    const currentHourIST = nowIST.getHours();
    
    logger.info(`🔍 Checking for tweets ready to post at ${currentHourIST}:00 IST`, 'post-ready');

    // Check which personas are available for posting at current hour
    const availablePersonas = getAvailablePersonasForPosting(currentHourIST);
    
    if (availablePersonas.length === 0) {
      return NextResponse.json({
        success: true,
        message: `⏳ No personas scheduled for posting at ${currentHourIST}:00 IST`,
        availablePersonas: [],
        currentHour: currentHourIST,
        found: 0,
        posted: 0,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`📋 Available personas for posting: ${availablePersonas.map(p => p.name).join(', ')}`, 'post-ready');

    // Get all tweets
    const allTweets = await getAllTweets();
    
    // Find tweets ready to post - must not be posted yet and persona must be available for posting
    const readyTweets = allTweets.filter(tweet => {
      // Skip already posted or failed tweets
      if (tweet.status === 'posted' || tweet.status === 'failed') return false;
      
      // Check if tweet's persona is available for posting at current hour
      return isPersonaAvailableForPosting(tweet.persona, currentHourIST);
    });

    logger.info(`📝 Found ${readyTweets.length} tweets ready to post from available personas`, 'post-ready');

    let postedCount = 0;
    const errors: string[] = [];

    // Post each ready tweet
    for (const tweet of readyTweets) {
      try {
        logger.info(`📤 Posting tweet: ${tweet.content.substring(0, 50)}...`, 'post-ready');
        
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
        
        logger.info(`✅ Successfully posted tweet ${tweet.id} - Twitter ID: ${result.data.id}`, 'post-ready');
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to post tweet ${tweet.id}: ${errorMsg}`, 'post-ready', error as Error);
        
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
      availablePersonas: availablePersonas.map(p => p.name),
      found: readyTweets.length,
      posted: postedCount,
      errors: errors.length,
      errorDetails: errors,
      message: postedCount > 0 
        ? `🚀 Posted ${postedCount} tweets successfully from available personas!`
        : availablePersonas.length > 0 
          ? '⏳ No tweets ready to post from available personas at this time'
          : `⏳ No personas scheduled for posting at ${currentHourIST}:00 IST`,
    };

    logger.info(`📊 Posting summary: ${postedCount}/${readyTweets.length} posted, ${errors.length} errors`, 'post-ready');
    
    return NextResponse.json(response);

  } catch (error) {
    logger.error('Post-ready check failed', 'post-ready', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check/post ready tweets',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}