import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { logIST, toIST } from '@/lib/timezone';
import { OPTIMAL_POSTING_TIMES } from '@/lib/timing';

// Job tracking removed - using synchronous generation

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use proper IST calculation
    const serverUTC = new Date();
    const istTime = new Date(serverUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    logIST(`🎯 Async generation check...`);
    logIST(`🕐 Server UTC: ${serverUTC.toISOString()}`);
    logIST(`🕐 IST Time: ${istTime.toLocaleString('en-IN')} (${istTime.getHours()}:${istTime.getMinutes()})`);

    // Get current tweet pipeline
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status === 'scheduled' || t.status === 'draft');
    
    logIST(`📊 Current pipeline: ${pendingTweets.length} pending tweets`);

    // Only generate if pipeline is low (production-ready threshold)
    if (pendingTweets.length >= 15) {
      return NextResponse.json({
        success: true,
        message: `✅ Pipeline is healthy with ${pendingTweets.length} tweets. No generation needed.`,
        currentPipeline: pendingTweets.length,
        generated: 0,
        timestamp: serverUTC.toISOString()
      });
    }

    // Generate 1 tweet synchronously to stay within cron timeout limits
    const tweetsToGenerate = 1;
    logIST(`🚀 Starting synchronous generation of ${tweetsToGenerate} tweet...`);
    
    try {
      // Generate single tweet with timeout
      const persona = (['unhinged_satirist', 'vibe_coder', 'product_sage'] as const)[pendingTweets.length % 3];
      const options: TweetGenerationOptions = {
        persona,
        includeHashtags: Math.random() > 0.3,
        useTrendingTopics: Math.random() > 0.4,
      };

      logIST(`📝 Generating tweet with ${persona}...`);

      // Add timeout to prevent hanging (20s max for cron safety)
      const generatedTweet = await Promise.race([
        generateTweet(options, 0),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Generation timeout after 20s')), 20000))
      ]) as Awaited<ReturnType<typeof generateTweet>>;
      
      const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);

      // Schedule for next optimal IST time - proper timezone handling
      const currentTime = istTime.getHours() * 60 + istTime.getMinutes();
      logIST(`⏰ Current IST time: ${istTime.getHours()}:${istTime.getMinutes().toString().padStart(2, '0')} (${currentTime} minutes)`);
      
      const nextSlots = OPTIMAL_POSTING_TIMES.filter(slot => {
        const slotTime = slot.hour * 60 + slot.minute;
        const isAfter = slotTime > currentTime;
        logIST(`   Slot ${slot.hour}:${slot.minute.toString().padStart(2, '0')} (${slotTime}min) > current? ${isAfter}`);
        return isAfter;
      });

      let scheduledFor: Date;
      if (nextSlots.length > 0) {
        const timeSlot = nextSlots[0];
        logIST(`📅 Using next slot today: ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
        
        // Create IST time and convert to UTC for database storage
        const istSlotTime = new Date(istTime.getFullYear(), istTime.getMonth(), istTime.getDate(), 
                               timeSlot.hour, timeSlot.minute, 0, 0);
        scheduledFor = new Date(istSlotTime.getTime() - (5.5 * 60 * 60 * 1000)); // IST to UTC
        
        logIST(`   IST time: ${istSlotTime.toLocaleString('en-IN')}`);
        logIST(`   UTC time: ${scheduledFor.toISOString()}`);
      } else {
        // Schedule for tomorrow morning
        logIST(`📅 No slots left today, using tomorrow morning`);
        const tomorrow = new Date(istTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const firstSlot = OPTIMAL_POSTING_TIMES[0];
        
        const tomorrowIstTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(),
                               firstSlot.hour, firstSlot.minute, 0, 0);
        scheduledFor = new Date(tomorrowIstTime.getTime() - (5.5 * 60 * 60 * 1000)); // IST to UTC
        
        logIST(`   Tomorrow IST: ${tomorrowIstTime.toLocaleString('en-IN')}`);
        logIST(`   Tomorrow UTC: ${scheduledFor.toISOString()}`);
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
      const scheduledForIST = new Date(scheduledFor.getTime() + (5.5 * 60 * 60 * 1000));
      
      logIST(`✅ Generated tweet - ${tweet.content.substring(0, 50)}... (scheduled for ${scheduledForIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);

      return NextResponse.json({
        success: true,
        message: `✅ Generated 1 tweet successfully`,
        generated: 1,
        currentPipeline: pendingTweets.length + 1,
        scheduledFor: scheduledForIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        persona,
        timestamp: serverUTC.toISOString()
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logIST(`❌ Failed to generate tweet: ${errorMsg}`);
      
      return NextResponse.json({
        success: false,
        error: 'Tweet generation failed',
        details: errorMsg,
        currentPipeline: pendingTweets.length,
        timestamp: serverUTC.toISOString()
      });
    }

  } catch (error) {
    logIST('❌ Async generation check failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to start generation',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Removed background generation - now using synchronous generation

// POST endpoint removed - using synchronous generation only