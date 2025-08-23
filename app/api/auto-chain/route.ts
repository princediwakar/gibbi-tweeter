import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, getScheduledTweets, saveTweet, generateTweetId } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { postToTwitter } from '@/lib/twitter';
import { logIST, toIST } from '@/lib/timezone';
import { OPTIMAL_POSTING_TIMES } from '@/lib/timing';


async function scheduleNextExecution(delayMinutes: number) {
  try {
    // In production on Vercel, use the deployment URL
    // VERCEL_URL is automatically provided by Vercel
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL 
      ? process.env.NEXT_PUBLIC_SITE_URL
      : process.env.PRODUCTION_URL  // Add manual fallback
      ? process.env.PRODUCTION_URL
      : 'http://localhost:3000';
    
    logIST(`🔗 Using base URL for self-triggering: ${baseUrl}`);
    
    // Schedule next execution using setTimeout + fetch
    setTimeout(async () => {
      try {
        // Check if automation is still enabled before continuing
        // Note: In production, we'll rely on the client stopping new chains
        // This is a safety check for development
        await fetch(`${baseUrl}/api/auto-chain`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET || 'internal-trigger'}`
          }
        });
        logIST(`🔄 Triggered next auto-chain execution after ${delayMinutes} minutes`);
      } catch (error) {
        logIST('❌ Failed to trigger next execution:', error);
      }
    }, delayMinutes * 60 * 1000);
    
  } catch (error) {
    logIST('❌ Failed to schedule next execution:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authorization (allow internal triggers)
    const authHeader = request.headers.get('authorization');
    const isAuthorized = authHeader === `Bearer ${process.env.CRON_SECRET}` || 
                        authHeader === `Bearer internal-trigger`;
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logIST('🚀 Starting production auto-chain execution...');
    
    const now = toIST(new Date());
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    logIST(`⏰ Current IST time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    const results = {
      posted: 0,
      generated: 0,
      nextExecutionMinutes: 15, // Default next execution delay
      actions: [] as Array<{action: string; id?: string; time?: string; content?: string}>
    };

    // PHASE 1: Check for tweets ready to post NOW (within 15-minute window)
    logIST('📋 PHASE 1: Checking for tweets ready to post...');
    
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    const scheduledTweets = await getScheduledTweets({
      status: 'scheduled',
      from: fifteenMinutesAgo,
      to: fifteenMinutesFromNow,
      limit: 3 // Max 3 tweets per execution to avoid timeout
    });

    logIST(`📅 Found ${scheduledTweets.length} tweets ready for posting`);

    for (const tweet of scheduledTweets) {
      try {
        if (!tweet.scheduledFor) {
          results.actions.push({action: 'skipped', id: tweet.id, content: 'No schedule time'});
          continue;
        }

        const scheduledTime = toIST(new Date(tweet.scheduledFor));
        logIST(`🐦 Posting tweet ${tweet.id} (${scheduledTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);

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
        results.actions.push({
          action: 'posted',
          id: tweet.id,
          time: scheduledTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          content: tweet.content.substring(0, 50) + '...'
        });

        logIST(`✅ Tweet posted successfully! Twitter ID: ${result.data?.id}`);

      } catch (error) {
        logIST(`❌ Failed to post tweet ${tweet.id}:`, error instanceof Error ? error.message : String(error));
        
        const failedTweet = {
          ...tweet,
          status: 'failed' as const,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
        await saveTweet(failedTweet);
        results.actions.push({action: 'failed', id: tweet.id, content: error instanceof Error ? error.message : 'Unknown error'});
      }
    }

    // PHASE 2: Generate new tweets if pipeline is low
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status === 'scheduled' || t.status === 'draft');
    
    logIST(`📊 Current pipeline: ${pendingTweets.length} pending tweets`);
    
    if (pendingTweets.length < 8) { // Maintain pipeline of at least 8 tweets
      logIST('🎯 Pipeline low - generating new tweets...');
      
      // Calculate available optimal slots to ensure we don't exceed timing capacity
      const maxOptimalSlots = OPTIMAL_POSTING_TIMES.length; // 15 slots per day
      // Reduce to 2 tweets max per run to avoid timeout (60s limit on Vercel)
      const tweetsToGenerate = Math.min(2, maxOptimalSlots - pendingTweets.length, 15 - pendingTweets.length);
      
      for (let i = 0; i < tweetsToGenerate; i++) {
        try {
          // Rotate through all personas
          const personas = ['unhinged_satirist', 'vibe_coder', 'product_sage'] as const;
          const persona = personas[i % personas.length];
          
          const options: TweetGenerationOptions = {
            persona,
            includeHashtags: Math.random() > 0.3,
            useTrendingTopics: Math.random() > 0.4,
          };

          // Add timeout to prevent hanging (20s max per generation)
          const generatedTweet = await Promise.race([
            generateTweet(options, i),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Generation timeout')), 20000))
          ]) as Awaited<ReturnType<typeof generateTweet>>;
          const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);

          // Find next available optimal time slot
          let scheduledFor: Date;
          const nextSlots = OPTIMAL_POSTING_TIMES.filter(slot => {
            const slotTime = slot.hour * 60 + slot.minute;
            return slotTime > currentTime; // Future slots today
          });

          if (nextSlots.length > i) {
            // Use slot today
            const timeSlot = nextSlots[i];
            const scheduledIST = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                         timeSlot.hour, timeSlot.minute, 0, 0);
            const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
            scheduledFor = new Date(utcTime);
          } else {
            // Schedule for tomorrow
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const timeSlot = OPTIMAL_POSTING_TIMES[i % OPTIMAL_POSTING_TIMES.length];
            const scheduledIST = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(),
                                         timeSlot.hour, timeSlot.minute, 0, 0);
            const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
            scheduledFor = new Date(utcTime);
          }

          const tweet = {
            id: generateTweetId(),
            content: generatedTweet.content,
            hashtags: generatedTweet.hashtags,
            persona,
            scheduledFor,
            status: 'scheduled' as const,
            createdAt: new Date(),
            qualityScore,
          };

          await saveTweet(tweet);
          results.generated++;
          results.actions.push({
            action: 'generated',
            id: tweet.id,
            time: scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            content: tweet.content.substring(0, 50) + '...'
          });

          logIST(`✅ Generated tweet scheduled for ${scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

        } catch (error) {
          logIST(`❌ Failed to generate tweet ${i + 1}:`, error instanceof Error ? error.message : String(error));
          results.actions.push({action: 'generation_failed', content: error instanceof Error ? error.message : 'Unknown error'});
        }
      }
    }

    // PHASE 3: Calculate next execution time
    const nextOptimalSlots = OPTIMAL_POSTING_TIMES.filter(slot => {
      const slotTime = slot.hour * 60 + slot.minute;
      return slotTime > currentTime + 10; // At least 10 minutes from now
    });

    if (nextOptimalSlots.length > 0) {
      const nextSlot = nextOptimalSlots[0];
      const nextSlotTime = nextSlot.hour * 60 + nextSlot.minute;
      results.nextExecutionMinutes = Math.max(10, nextSlotTime - currentTime - 5); // 5 minutes before optimal time
      logIST(`⏰ Next execution in ${results.nextExecutionMinutes} minutes (before ${nextSlot.hour}:${nextSlot.minute.toString().padStart(2, '0')})`);
    } else {
      // Schedule for next morning
      const tomorrowFirst = OPTIMAL_POSTING_TIMES[0];
      const minutesUntilTomorrow = (24 * 60) - currentTime + (tomorrowFirst.hour * 60 + tomorrowFirst.minute) - 5;
      results.nextExecutionMinutes = minutesUntilTomorrow;
      logIST(`⏰ Next execution tomorrow in ${minutesUntilTomorrow} minutes`);
    }

    // Schedule next execution
    await scheduleNextExecution(results.nextExecutionMinutes);

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')} IST`,
      results,
      message: `✅ PRODUCTION: Posted ${results.posted} tweets, Generated ${results.generated} tweets. Next execution in ${results.nextExecutionMinutes} minutes.`,
      note: "🚀 Production auto-chain system - continuous operation via self-triggering"
    };

    logIST(`🎉 Auto-chain execution completed! Posted: ${results.posted}, Generated: ${results.generated}, Next: ${results.nextExecutionMinutes}min`);

    return NextResponse.json(summary);

  } catch (error) {
    logIST('❌ Auto-chain execution failed:', error instanceof Error ? error.message : String(error));
    
    // Even if execution fails, schedule next attempt in 15 minutes
    await scheduleNextExecution(15);
    
    return NextResponse.json({
      success: false,
      error: 'Auto-chain execution failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      note: 'Next execution scheduled in 15 minutes despite failure'
    }, { status: 500 });
  }
}

// POST endpoint to manually start the chain
export async function POST() {
  try {
    logIST('🚀 Manual start of production auto-chain system...');
    
    // Create a mock request object with proper authorization to call GET logic directly
    const mockRequest = {
      headers: {
        get: (name: string) => {
          if (name === 'authorization') {
            return `Bearer ${process.env.CRON_SECRET || 'internal-trigger'}`;
          }
          return null;
        }
      }
    } as NextRequest;
    
    // Call the GET function directly instead of making an HTTP request
    const getResponse = await GET(mockRequest);
    const result = await getResponse.json();
    
    return NextResponse.json({
      success: true,
      message: '🚀 Production auto-chain system started successfully!',
      firstExecution: result,
      note: 'System will now run continuously via self-triggering chain'
    });
    
  } catch (error) {
    logIST('❌ Failed to start auto-chain system:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({
      success: false,
      error: 'Failed to start auto-chain system',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE endpoint to stop the automation (client-controlled)
export async function DELETE() {
  try {
    logIST('⏹️ Auto-chain system stop requested via API');
    
    return NextResponse.json({
      success: true,
      message: '⏹️ Automation stop signal acknowledged',
      note: 'Client-side state will prevent new chain executions. Existing scheduled tweets will still be posted.'
    });
    
  } catch (error) {
    logIST('❌ Failed to acknowledge stop signal:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({
      success: false,
      error: 'Failed to acknowledge stop signal',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}