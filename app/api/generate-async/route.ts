import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/neon-db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { logWithTimezone, getCurrentTimeInET, getNextOptimalPostingTimeET } from '@/lib/datetime';

// Job tracking removed - using synchronous generation

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nowET = getCurrentTimeInET();
    
    logWithTimezone(`🎯 Async generation check...`);
    logWithTimezone(`🕐 Current ET Time: ${nowET.toISOString()}`);

    // Get current tweet pipeline
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status === 'scheduled' || t.status === 'draft');
    
    logWithTimezone(`📊 Current pipeline: ${pendingTweets.length} pending tweets`);

    // Only generate if pipeline is low (production-ready threshold)
    if (pendingTweets.length >= 15) {
      return NextResponse.json({
        success: true,
        message: `✅ Pipeline is healthy with ${pendingTweets.length} tweets. No generation needed.`,
        currentPipeline: pendingTweets.length,
        generated: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Generate 1 tweet synchronously to stay within cron timeout limits
    const tweetsToGenerate = 1;
    logWithTimezone(`🚀 Starting synchronous generation of ${tweetsToGenerate} tweet...`);
    
    try {
      // Use test prep personas from openai.ts
      const personas = [
        { id: "sat_coach", name: "SAT Coach" },
        { id: "gre_master", name: "GRE Master" },
        { id: "gmat_pro", name: "GMAT Pro" },
        { id: "test_prep_guru", name: "Test Prep Guru" },
      ];
      
      // Generate single tweet with timeout
      const persona = personas[pendingTweets.length % personas.length].id;
      const options: TweetGenerationOptions = {
        persona,
        includeHashtags: Math.random() > 0.3,
        useTrendingTopics: Math.random() > 0.4,
      };

      logWithTimezone(`📝 Generating tweet with ${persona}...`);

      // Add timeout to prevent hanging (20s max for cron safety)
      const generatedTweet = await Promise.race([
        generateTweet(options, 0),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Generation timeout after 20s')), 20000))
      ]) as Awaited<ReturnType<typeof generateTweet>>;
      
      const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);

      // Use clean ET-based scheduling logic
      const scheduledFor = getNextOptimalPostingTimeET();
      
      logWithTimezone(`📅 Scheduled tweet for optimal US student time`);

      // Tweet object creation moved outside the complex logic

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
      
      logWithTimezone(`✅ Generated tweet - ${tweet.content.substring(0, 50)}... (scheduled for ${scheduledFor.toISOString()})`);

      return NextResponse.json({
        success: true,
        message: `✅ Generated 1 tweet successfully`,
        generated: 1,
        currentPipeline: pendingTweets.length + 1,
        scheduledFor: scheduledFor.toISOString(),
        persona,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logWithTimezone(`❌ Failed to generate tweet: ${errorMsg}`);
      
      return NextResponse.json({
        success: false,
        error: 'Tweet generation failed',
        details: errorMsg,
        currentPipeline: pendingTweets.length,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logWithTimezone('❌ Async generation check failed:', error instanceof Error ? error.message : String(error));
    
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