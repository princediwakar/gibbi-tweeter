import { NextRequest, NextResponse } from 'next/server';
import { getScheduledTweets, saveTweet } from '@/lib/db';
import { postToTwitter } from '@/lib/twitter';
import { logIST, toIST } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logIST('🚀 Starting scheduled tweet posting...');

    const now = toIST(new Date());
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    // Get tweets scheduled for posting within the last 5 minutes to now + 5 minutes
    const scheduledTweets = await getScheduledTweets({
      status: 'scheduled',
      from: fiveMinutesAgo,
      to: fiveMinutesFromNow,
      limit: 10 // Process max 10 tweets per run
    });

    logIST(`📅 Found ${scheduledTweets.length} tweets ready for posting`);

    const results = {
      posted: 0,
      failed: 0,
      skipped: 0,
      tweets: [] as Array<{
        id: string;
        twitterId?: string;
        content: string;
        postedAt: Date;
      }>
    };

    for (const tweet of scheduledTweets) {
      try {
        // Check if tweet has a scheduled time
        if (!tweet.scheduledFor) {
          logIST(`⚠️ Tweet ${tweet.id} has no scheduled time, skipping`);
          results.skipped++;
          continue;
        }

        // Check if it's time to post (within 5 minutes of scheduled time)
        const scheduledTime = toIST(new Date(tweet.scheduledFor));
        const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
        const fiveMinutes = 5 * 60 * 1000;

        if (timeDiff > fiveMinutes) {
          logIST(`⏰ Tweet ${tweet.id} not ready yet (scheduled for ${scheduledTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
          results.skipped++;
          continue;
        }

        logIST(`🐦 Posting tweet ${tweet.id} (scheduled for ${scheduledTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);

        // Post to Twitter
        const result = await postToTwitter(tweet.content, tweet.hashtags);

        // Update tweet status to posted
        const postedTweet = {
          ...tweet,
          status: 'posted' as const,
          postedAt: new Date(),
          twitterId: result.data?.id,
          twitterUrl: result.data?.id ? `https://x.com/user/status/${result.data.id}` : undefined,
        };

        await saveTweet(postedTweet);
        results.posted++;

        logIST(`✅ Tweet posted successfully! ID: ${result.data?.id}`);
        results.tweets.push({
          id: tweet.id,
          twitterId: result.data?.id,
          content: tweet.content.substring(0, 50) + '...',
          postedAt: postedTweet.postedAt
        });

        // Small delay between posts to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        logIST(`❌ Failed to post tweet ${tweet.id}:`, error instanceof Error ? error.message : String(error));
        
        // Mark tweet as failed
        const failedTweet = {
          ...tweet,
          status: 'failed' as const,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
        await saveTweet(failedTweet);
        results.failed++;
      }
    }

    logIST(`🎉 Tweet posting completed! Posted: ${results.posted}, Failed: ${results.failed}, Skipped: ${results.skipped}`);

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledTweets.length} scheduled tweets`,
      results,
      timestamp: now.toISOString()
    });

  } catch (error) {
    logIST('❌ Scheduled tweet posting failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to post scheduled tweets',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
