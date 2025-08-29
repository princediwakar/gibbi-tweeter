import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/neon-db';
import { getCurrentTimeInIST } from '@/lib/datetime';
import { logger } from '@/lib/logger';
import { getAvailablePersonasForGeneration } from '@/lib/personas';

// Job tracking removed - using synchronous generation

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nowIST = getCurrentTimeInIST();
    const currentHourIST = nowIST.getHours();
    
    logger.info(`🎯 Async generation check at ${currentHourIST}:00 IST`, 'generate-async');

    // Check which personas are available for generation at current hour
    const availablePersonas = getAvailablePersonasForGeneration(currentHourIST);
    
    if (availablePersonas.length === 0) {
      return NextResponse.json({
        success: true,
        message: `⏳ No personas scheduled for generation at ${currentHourIST}:00 IST`,
        availablePersonas: [],
        currentHour: currentHourIST,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`📋 Available personas: ${availablePersonas.map(p => p.name).join(', ')}`, 'generate-async');

    // Get current tweet pipeline
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status !== 'posted' && t.status !== 'failed');
    
    logger.info(`📊 Current pipeline: ${pendingTweets.length} pending tweets`, 'generate-async');

    // Only generate if pipeline is low (production-ready threshold)
    if (pendingTweets.length >= 15) {
      return NextResponse.json({
        success: true,
        message: `✅ Pipeline is healthy with ${pendingTweets.length} tweets. No generation needed.`,
        currentPipeline: pendingTweets.length,
        availablePersonas: availablePersonas.map(p => p.name),
        generated: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Select persona (round robin among available ones)
    const selectedPersona = availablePersonas[pendingTweets.length % availablePersonas.length];
    logger.info(`👨‍🏫 Selected persona: ${selectedPersona.name} (${selectedPersona.emoji})`, 'generate-async');
    
    try {
      // Generate single tweet with timeout using selected persona
      const options: TweetGenerationOptions = {
        persona: selectedPersona.id,
        includeHashtags: Math.random() > 0.3,
        useTrendingTopics: Math.random() > 0.4,
      };

      logger.info(`📝 Generating tweet with ${selectedPersona.name}...`, 'generate-async');

      // Add timeout to prevent hanging (20s max for cron safety)
      const generatedTweet = await Promise.race([
        generateTweet(options, 0),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Generation timeout after 20s')), 20000))
      ]) as Awaited<ReturnType<typeof generateTweet>>;
      

      // Create tweet ready for posting (no scheduling needed)
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona: selectedPersona.id,
        status: 'ready' as const,
        created_at: new Date().toISOString(),
        quality_score: 1,
      };

      await saveTweet(tweet);
      
      logger.info(`✅ Generated tweet - ${tweet.content.substring(0, 50)}... (ready for posting)`, 'generate-async');

      return NextResponse.json({
        success: true,
        message: `✅ Generated 1 tweet successfully with ${selectedPersona.name}`,
        generated: 1,
        currentPipeline: pendingTweets.length + 1,
        persona: selectedPersona.name,
        personaEmoji: selectedPersona.emoji,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to generate tweet: ${errorMsg}`, 'generate-async', error as Error);
      
      return NextResponse.json({
        success: false,
        error: 'Tweet generation failed',
        details: errorMsg,
        currentPipeline: pendingTweets.length,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Async generation check failed', 'generate-async', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to start generation',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

