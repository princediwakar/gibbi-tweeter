import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/neon-db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { logIST } from '@/lib/timezone';
import { OPTIMAL_POSTING_TIMES } from '@/lib/timing';

// Job tracking removed - using synchronous generation

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use built-in timezone conversion for IST
    const serverUTC = new Date();
    const istTimeStr = serverUTC.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istTime = new Date(istTimeStr);
    
    logIST(`🎯 Async generation check...`);
    logIST(`🕐 Server UTC: ${serverUTC.toISOString()}`);
    logIST(`🕐 IST Time: ${istTime.getFullYear()}-${(istTime.getMonth()+1).toString().padStart(2,'0')}-${istTime.getDate().toString().padStart(2,'0')} ${istTime.getHours()}:${istTime.getMinutes().toString().padStart(2,'0')}`);

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

      // Find next available slot that's not already taken
      const currentTime = istTime.getHours() * 60 + istTime.getMinutes();
      logIST(`⏰ Current IST time: ${istTime.getHours()}:${istTime.getMinutes().toString().padStart(2, '0')} (${currentTime} minutes)`);
      
      // Get all existing scheduled times to avoid conflicts
      const existingSchedules = allTweets
        .filter(t => t.status === 'scheduled' && t.scheduled_for)
        .map(t => {
          const utcDate = new Date(t.scheduled_for!);
          const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
          return istDate.getHours() * 60 + istDate.getMinutes();
        });
      
      logIST(`📋 Existing scheduled slots (IST minutes): ${existingSchedules.join(', ')}`);
      
      // Filter available slots (future slots not already taken)
      const availableSlots = OPTIMAL_POSTING_TIMES.filter(slot => {
        const slotTime = slot.hour * 60 + slot.minute;
        const isAfterNow = slotTime > currentTime;
        const isNotTaken = !existingSchedules.includes(slotTime);
        logIST(`   Slot ${slot.hour}:${slot.minute.toString().padStart(2, '0')} (${slotTime}min) - future: ${isAfterNow}, available: ${isNotTaken}`);
        return isAfterNow && isNotTaken;
      });

      let scheduledFor: Date;
      if (availableSlots.length > 0) {
        const timeSlot = availableSlots[0];
        logIST(`📅 Using next available slot today: ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
        
        // Create proper UTC time from IST slot
        const istDateStr = `${istTime.getFullYear()}-${String(istTime.getMonth() + 1).padStart(2, '0')}-${String(istTime.getDate()).padStart(2, '0')}T${String(timeSlot.hour).padStart(2, '0')}:${String(timeSlot.minute).padStart(2, '0')}:00.000+05:30`;
        scheduledFor = new Date(istDateStr);
        
        logIST(`   IST slot: ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
        logIST(`   UTC stored: ${scheduledFor.toISOString()}`);
      } else {
        // Find first available slot tomorrow
        logIST(`📅 No slots left today, checking tomorrow...`);
        
        const tomorrowStart = new Date(istTime);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);
        
        // Check tomorrow's slots against existing schedules
        const tomorrowExistingSchedules = allTweets
          .filter(t => t.status === 'scheduled' && t.scheduled_for)
          .map(t => {
            const utcDate = new Date(t.scheduled_for!);
            const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            // Check if it's tomorrow
            if (istDate.getDate() === tomorrowStart.getDate() && istDate.getMonth() === tomorrowStart.getMonth()) {
              return istDate.getHours() * 60 + istDate.getMinutes();
            }
            return null;
          })
          .filter(time => time !== null);
        
        const availableTomorrowSlots = OPTIMAL_POSTING_TIMES.filter(slot => {
          const slotTime = slot.hour * 60 + slot.minute;
          return !tomorrowExistingSchedules.includes(slotTime);
        });
        
        const timeSlot = availableTomorrowSlots[0] || OPTIMAL_POSTING_TIMES[0];
        logIST(`📅 Using tomorrow slot: ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
        
        // Create proper UTC time for tomorrow IST slot
        const tomorrowIstStr = `${tomorrowStart.getFullYear()}-${String(tomorrowStart.getMonth() + 1).padStart(2, '0')}-${String(tomorrowStart.getDate()).padStart(2, '0')}T${String(timeSlot.hour).padStart(2, '0')}:${String(timeSlot.minute).padStart(2, '0')}:00.000+05:30`;
        scheduledFor = new Date(tomorrowIstStr);
        
        logIST(`   Tomorrow IST: ${timeSlot.hour}:${timeSlot.minute.toString().padStart(2, '0')}`);
        logIST(`   UTC stored: ${scheduledFor.toISOString()}`);
      }

      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona,
        scheduled_for: scheduledFor.toISOString(),
        status: 'scheduled' as const,
        created_at: new Date().toISOString(),
        quality_score: qualityScore,
      };

      await saveTweet(tweet);
      const scheduledForIST = new Date(scheduledFor.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const istDisplay = scheduledForIST.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      logIST(`✅ Generated tweet - ${tweet.content.substring(0, 50)}... (scheduled for ${istDisplay})`);

      return NextResponse.json({
        success: true,
        message: `✅ Generated 1 tweet successfully`,
        generated: 1,
        currentPipeline: pendingTweets.length + 1,
        scheduledFor: scheduledFor.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
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