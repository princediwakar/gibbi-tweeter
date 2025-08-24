import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { logIST, toIST } from '@/lib/timezone';
import { OPTIMAL_POSTING_TIMES } from '@/lib/timing';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = toIST(new Date());
    logIST(`🎯 Starting batch generation check...`);

    // Get current tweet pipeline
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status === 'scheduled' || t.status === 'draft');
    
    logIST(`📊 Current pipeline: ${pendingTweets.length} pending tweets`);

    // Only generate if pipeline is low (less than 4 tweets for 30s cron)
    if (pendingTweets.length >= 4) {
      return NextResponse.json({
        success: true,
        message: `✅ Pipeline is healthy with ${pendingTweets.length} tweets. No generation needed.`,
        currentPipeline: pendingTweets.length,
        generated: 0,
        timestamp: now.toISOString()
      });
    }

    // Generate 2-3 tweets to refill pipeline (reduced for 30s cron limit)
    const tweetsToGenerate = Math.min(3, 6 - pendingTweets.length);
    logIST(`🤖 Generating ${tweetsToGenerate} tweets to refill pipeline...`);

    const generatedTweets = [];
    const errors: string[] = [];

    for (let i = 0; i < tweetsToGenerate; i++) {
      try {
        // Use personas directly instead of API calls
        const personas = [
          { id: "unhinged_satirist", name: "Unhinged Satirist" },
          { id: "product_sage", name: "Product Sage" },
        ];
        
        const persona = personas[i % personas.length].id;
        
        const options: TweetGenerationOptions = {
          persona,
          includeHashtags: Math.random() > 0.3,
          useTrendingTopics: Math.random() > 0.4,
        };

        logIST(`📝 Generating tweet ${i + 1}/${tweetsToGenerate} with ${persona}...`);

        // Add timeout for 30s cron limit (10s per generation)
        const generatedTweet = await Promise.race([
          generateTweet(options, i),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Generation timeout (30s cron limit)')), 10000))
        ]) as Awaited<ReturnType<typeof generateTweet>>;
        const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);

        // Find next available optimal time slot
        const currentTime = now.getHours() * 60 + now.getMinutes();
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
          // Convert IST to UTC using proper timezone conversion
          const utcOffset = scheduledIST.getTimezoneOffset() * 60000; // Get local timezone offset
          const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
          scheduledFor = new Date(scheduledIST.getTime() - utcOffset - istOffset);
        } else {
          // Schedule for tomorrow
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const timeSlot = OPTIMAL_POSTING_TIMES[i % OPTIMAL_POSTING_TIMES.length];
          const scheduledIST = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(),
                                       timeSlot.hour, timeSlot.minute, 0, 0);
          // Convert IST to UTC using proper timezone conversion
          const utcOffset = scheduledIST.getTimezoneOffset() * 60000; // Get local timezone offset
          const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
          scheduledFor = new Date(scheduledIST.getTime() - utcOffset - istOffset);
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
        generatedTweets.push(tweet);

        logIST(`✅ Generated tweet ${i + 1}: ${tweet.content.substring(0, 50)}... (scheduled for ${scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logIST(`❌ Failed to generate tweet ${i + 1}: ${errorMsg}`);
        errors.push(`Tweet ${i + 1}: ${errorMsg}`);
      }
    }

    const response = {
      success: true,
      timestamp: now.toISOString(),
      currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} IST`,
      previousPipeline: pendingTweets.length,
      generated: generatedTweets.length,
      newPipeline: pendingTweets.length + generatedTweets.length,
      errors: errors.length,
      errorDetails: errors,
      tweets: generatedTweets.map(t => ({
        id: t.id,
        persona: t.persona,
        preview: t.content.substring(0, 80) + '...',
        scheduledFor: t.scheduledFor
      })),
      message: `🚀 Generated ${generatedTweets.length} tweets. Pipeline: ${pendingTweets.length} → ${pendingTweets.length + generatedTweets.length}`,
    };

    logIST(`📊 Generation summary: ${generatedTweets.length}/${tweetsToGenerate} generated, ${errors.length} errors`);
    
    return NextResponse.json(response);

  } catch (error) {
    logIST('❌ Batch generation failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate tweet batch',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}