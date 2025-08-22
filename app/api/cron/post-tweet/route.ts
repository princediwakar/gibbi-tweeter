import { NextRequest, NextResponse } from 'next/server';
import { generateHighQualityTweets, selectBestTweetsForPosting } from '@/lib/auto-generator';
import { saveTweet, generateTweetId } from '@/lib/db';
import { postToTwitter } from '@/lib/twitter';

// Vercel Cron Job endpoint for automated tweet posting
// Runs at scheduled times defined in vercel.json
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('❌ Unauthorized cron request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🕐 Vercel Cron: Starting automated tweet generation...');
  
  try {
    // Get current time in IST for logging
    const istNow = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
    console.log(`🌏 IST Time: ${istNow}`);

    // Add randomization - 15% chance to skip for natural variation
    if (Math.random() > 0.85) {
      console.log('🎲 Randomly skipping this cron slot for natural variation');
      return NextResponse.json({ 
        success: true, 
        message: 'Skipped for variation',
        timestamp: istNow
      });
    }

    // Generate 3-6 high-quality tweets for selection
    const targetCount = Math.floor(Math.random() * 4) + 3; // 3-6 tweets
    console.log(`🎯 Generating ${targetCount} tweets for quality selection...`);

    const generatedTweets = await generateHighQualityTweets({
      count: targetCount,
      minQualityScore: 75, // High quality threshold
      maxAttempts: targetCount * 3, // Allow multiple attempts for quality
    });

    if (generatedTweets.length === 0) {
      console.log('❌ No high-quality tweets generated, skipping posting');
      return NextResponse.json({ 
        success: false, 
        message: 'No quality tweets generated',
        timestamp: istNow
      });
    }

    // Select the best tweet for posting
    const bestTweets = await selectBestTweetsForPosting(generatedTweets, 1);

    if (bestTweets.length === 0) {
      console.log('❌ No tweets selected for posting');
      return NextResponse.json({ 
        success: false, 
        message: 'No tweets selected',
        timestamp: istNow
      });
    }

    const selectedTweet = bestTweets[0];

    // Randomize content for posting (remove sources, vary hashtags, etc.)
    const finalContent = randomizeContent(selectedTweet.content);
    const finalHashtags = randomizeHashtags(selectedTweet.hashtags);

    // Save the tweet
    const tweetToPost = {
      ...selectedTweet,
      content: finalContent,
      hashtags: finalHashtags,
      id: generateTweetId(),
      scheduledFor: new Date(), // Post immediately
      status: 'scheduled' as const,
    };

    await saveTweet(tweetToPost);

    // Post to Twitter
    try {
      console.log(`📝 Posting: ${finalContent}`);
      console.log(`#️⃣ Hashtags: ${finalHashtags.length > 0 ? finalHashtags.join(' ') : 'None'}`);
      
      const result = await postToTwitter(finalContent, finalHashtags);
      
      // Update tweet with posting result
      const postedTweet = {
        ...tweetToPost,
        status: 'posted' as const,
        postedAt: new Date(),
        twitterId: result.data?.id,
        twitterUrl: result.data?.id ? `https://x.com/user/status/${result.data.id}` : undefined,
      };

      await saveTweet(postedTweet);

      console.log(`✅ Tweet posted successfully via Vercel Cron!`);
      console.log(`📊 Quality: ${selectedTweet.qualityScore.overall}/100 (${selectedTweet.qualityScore.grade})`);
      console.log(`🐦 Twitter ID: ${result.data?.id}`);

      return NextResponse.json({ 
        success: true, 
        message: 'Tweet posted successfully',
        tweetId: result.data?.id,
        quality: selectedTweet.qualityScore.overall,
        timestamp: istNow
      });

    } catch (postError) {
      console.error('❌ Failed to post tweet to Twitter:', postError);
      
      // Mark tweet as failed
      const failedTweet = {
        ...tweetToPost,
        status: 'failed' as const,
        errorMessage: postError instanceof Error ? postError.message : 'Unknown error',
      };
      await saveTweet(failedTweet);

      return NextResponse.json({ 
        success: false, 
        message: 'Failed to post to Twitter',
        error: postError instanceof Error ? postError.message : 'Unknown error',
        timestamp: istNow
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Cron job failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})
    }, { status: 500 });
  }
}

// Helper functions for content randomization
function randomizeContent(content: string): string {
  let finalContent = content;
  
  // 40% chance to remove source mentions
  if (Math.random() < 0.4) {
    finalContent = finalContent
      .replace(/via @\w+/gi, '')
      .replace(/from r\/\w+/gi, '')
      .replace(/\(source: [^)]+\)/gi, '')
      .replace(/- @\w+/gi, '')
      .replace(/h\/t @\w+/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  return finalContent;
}

function randomizeHashtags(hashtags: string[]): string[] {
  // 70% chance to include hashtags
  if (Math.random() > 0.7) {
    return [];
  }
  
  // Sometimes use only 1-2 hashtags instead of all
  if (hashtags.length > 2 && Math.random() < 0.5) {
    const limit = Math.random() < 0.5 ? 1 : 2;
    return hashtags
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }
  
  return hashtags;
}