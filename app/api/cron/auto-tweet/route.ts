import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, getScheduledTweets, saveTweet, generateTweetId } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { postToTwitter } from '@/lib/twitter';
import { logIST, toIST } from '@/lib/timezone';

// Optimal posting times in IST (24-hour format)
const OPTIMAL_POSTING_TIMES = [
  { hour: 8, minute: 0 },   // 8:00 AM IST
  { hour: 9, minute: 30 },  // 9:30 AM IST
  { hour: 10, minute: 0 },  // 10:00 AM IST
  { hour: 11, minute: 30 }, // 11:30 AM IST
  { hour: 12, minute: 0 },  // 12:00 PM IST
  { hour: 13, minute: 30 }, // 1:30 PM IST
  { hour: 14, minute: 0 },  // 2:00 PM IST
  { hour: 15, minute: 0 },  // 3:00 PM IST
  { hour: 16, minute: 30 }, // 4:30 PM IST
  { hour: 17, minute: 0 },  // 5:00 PM IST
  { hour: 18, minute: 30 }, // 6:30 PM IST
  { hour: 19, minute: 0 },  // 7:00 PM IST
  { hour: 20, minute: 30 }, // 8:30 PM IST
  { hour: 21, minute: 0 },  // 9:00 PM IST
  { hour: 22, minute: 0 },  // 10:00 PM IST
];

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logIST('🚀 Starting comprehensive auto-tweet cron job...');
    
    const now = toIST(new Date());
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    logIST(`⏰ Current IST time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    const results = {
      phase: '',
      generated: 0,
      scheduled: 0,
      posted: 0,
      failed: 0,
      skipped: 0,
      tweets: [] as Array<{
        action: string;
        id: string;
        twitterId?: string;
        content?: string;
        persona?: string;
        scheduledFor?: string;
      }>
    };

    // PHASE 1: Check for tweets to post NOW
    logIST('📋 PHASE 1: Checking for tweets ready to post...');
    
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const scheduledTweets = await getScheduledTweets({
      status: 'scheduled',
      from: fiveMinutesAgo,
      to: fiveMinutesFromNow,
      limit: 5
    });

    logIST(`📅 Found ${scheduledTweets.length} tweets ready for posting`);

    for (const tweet of scheduledTweets) {
      try {
        if (!tweet.scheduledFor) {
          results.skipped++;
          continue;
        }

        const scheduledTime = toIST(new Date(tweet.scheduledFor));
        const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
        
        if (timeDiff > 5 * 60 * 1000) { // More than 5 minutes difference
          results.skipped++;
          continue;
        }

        logIST(`🐦 Posting tweet ${tweet.id} (scheduled for ${scheduledTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);

        const result = await postToTwitter(tweet.content, tweet.hashtags);

        const postedTweet = {
          ...tweet,
          status: 'posted' as const,
          postedAt: new Date(),
          twitterId: result.data?.id,
          twitterUrl: result.data?.id ? `https://x.com/user/status/${result.data.id}` : undefined,
        };

        await saveTweet(postedTweet);
        results.posted++;
        results.tweets.push({
          action: 'posted',
          id: tweet.id,
          twitterId: result.data?.id,
          content: tweet.content.substring(0, 50) + '...',
        });

        logIST(`✅ Tweet posted successfully! Twitter ID: ${result.data?.id}`);

        // Small delay between posts
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        logIST(`❌ Failed to post tweet ${tweet.id}:`, error instanceof Error ? error.message : String(error));
        
        const failedTweet = {
          ...tweet,
          status: 'failed' as const,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
        await saveTweet(failedTweet);
        results.failed++;
      }
    }

    // PHASE 2: Check if we need to generate new tweets (runs every 6 hours or if we have < 5 scheduled tweets)
    logIST('📋 PHASE 2: Checking if we need to generate new tweets...');
    
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status === 'scheduled' || t.status === 'draft');
    
    logIST(`📊 Current pending tweets: ${pendingTweets.length}`);
    
    const shouldGenerate = 
      pendingTweets.length < 5 || // Less than 5 tweets in pipeline
      currentHour === 1 || currentHour === 7 || currentHour === 13 || currentHour === 19; // Generate every 6 hours
    
    if (shouldGenerate) {
      logIST('🎯 Generating new batch of tweets...');
      
      const tweetsToGenerate = Math.min(15 - pendingTweets.length, 8); // Generate up to 8, max 15 total pending
      
      if (tweetsToGenerate > 0) {
        const availableSlots = OPTIMAL_POSTING_TIMES.filter(slot => {
          const slotTime = slot.hour * 60 + slot.minute;
          const currentTime = currentHour * 60 + currentMinute;
          return slotTime > currentTime; // Only future slots today
        });

        logIST(`📅 Generating ${tweetsToGenerate} tweets for available time slots...`);

        for (let i = 0; i < tweetsToGenerate; i++) {
          try {
            // Rotate through all personas for variety
            const personas = ['unhinged_satirist', 'vibe_coder', 'product_sage'] as const;
            const randomPersona = personas[i % personas.length];
            
            const options: TweetGenerationOptions = {
              persona: randomPersona,
              includeHashtags: Math.random() > 0.3, // 70% chance of hashtags
              useTrendingTopics: Math.random() > 0.4, // 60% chance of trending topics
            };

            logIST(`🎭 Generating tweet ${i + 1}/${tweetsToGenerate} with ${randomPersona} persona...`);

            const generatedTweet = await generateTweet(options, i);
            const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, randomPersona);

            // Schedule for next available optimal time
            let scheduledFor: Date;
            if (availableSlots.length > i) {
              // Use optimal slot for today
              const timeSlot = availableSlots[i];
              const istToday = toIST(new Date());
              const scheduledIST = new Date(istToday.getFullYear(), istToday.getMonth(), istToday.getDate(), 
                                          timeSlot.hour, timeSlot.minute, 0, 0);
              const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
              scheduledFor = new Date(utcTime);
            } else {
              // Schedule for tomorrow's first slot
              const tomorrow = toIST(new Date());
              tomorrow.setDate(tomorrow.getDate() + 1);
              const firstSlot = OPTIMAL_POSTING_TIMES[i % OPTIMAL_POSTING_TIMES.length];
              const scheduledIST = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(),
                                          firstSlot.hour, firstSlot.minute, 0, 0);
              const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
              scheduledFor = new Date(utcTime);
            }

            const tweet = {
              id: generateTweetId(),
              content: generatedTweet.content,
              hashtags: generatedTweet.hashtags,
              persona: randomPersona,
              scheduledFor,
              status: 'scheduled' as const,
              createdAt: new Date(),
              qualityScore,
            };

            await saveTweet(tweet);
            results.generated++;
            results.scheduled++;
            results.tweets.push({
              action: 'generated_and_scheduled',
              id: tweet.id,
              persona: randomPersona,
              scheduledFor: scheduledFor.toISOString(),
              content: tweet.content.substring(0, 50) + '...',
            });

            logIST(`✅ Tweet ${i + 1} generated and scheduled for ${scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);

            // Small delay between generations
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            logIST(`❌ Failed to generate tweet ${i + 1}:`, error instanceof Error ? error.message : String(error));
            results.failed++;
          }
        }
      }
    } else {
      logIST('⏭️ Skipping generation - sufficient tweets in pipeline');
      results.phase = 'skipped_generation';
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')} IST`,
      summary: `Posted: ${results.posted}, Generated: ${results.generated}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
      results,
      pendingTweets: pendingTweets.length,
      message: `Cron completed successfully. ${results.posted} tweets posted, ${results.generated} tweets generated and scheduled.`
    };

    logIST(`🎉 Auto-tweet cron completed! ${JSON.stringify(summary.summary)}`);

    return NextResponse.json(summary);

  } catch (error) {
    logIST('❌ Auto-tweet cron failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Auto-tweet cron failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}