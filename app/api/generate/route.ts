import { NextRequest, NextResponse } from 'next/server';
import { generateEnhancedTweet } from '@/lib/tweets';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/db';
import { getCurrentTimeInIST } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { getGenerationPersonasForHour, getContentTypeForHour } from '@/lib/schedule';
import { TweetGenerationConfig } from '@/lib/tweets/types';

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
    
    logger.info(`🎯 Async generation check at ${currentHourIST}:00 IST`, 'generate');

    // Check which personas are scheduled for generation at current hour using new viral schedule
    const scheduledPersonaKeys = getGenerationPersonasForHour(currentHourIST);
    
    if (scheduledPersonaKeys.length === 0) {
      return NextResponse.json({
        success: true,
        message: `⏳ No personas scheduled for viral generation at ${currentHourIST}:00 IST`,
        scheduledPersonas: [],
        currentHour: currentHourIST,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`📋 Scheduled personas: ${scheduledPersonaKeys.join(', ')}`, 'generate');

    // Get current tweet pipeline
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status !== 'posted' && t.status !== 'failed');
    
    logger.info(`📊 Current pipeline: ${pendingTweets.length} pending tweets`, 'generate');

    // Only generate if pipeline is low (production-ready threshold)
    if (pendingTweets.length >= 15) {
      return NextResponse.json({
        success: true,
        message: `✅ Pipeline is healthy with ${pendingTweets.length} tweets. No generation needed.`,
        currentPipeline: pendingTweets.length,
        scheduledPersonas: scheduledPersonaKeys,
        generated: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Select persona (round robin among scheduled ones) 
    const selectedPersonaKey = scheduledPersonaKeys[pendingTweets.length % scheduledPersonaKeys.length];
    const contentType = getContentTypeForHour(currentHourIST);
    
    logger.info(`👨‍🏫 Selected persona: ${selectedPersonaKey} with content type: ${contentType}`, 'generate');
    
    try {
      // Generate viral tweet with new system
      const config: TweetGenerationConfig = {
        persona: selectedPersonaKey,
        contentType: contentType as 'challenge' | 'trap' | 'quick_tip' | 'motivation' | 'question_reveal' | 'competitive'
      };

      logger.info(`📝 Generating enhanced NEET tweet with ${selectedPersonaKey}...`, 'generate');

      // Use enhanced generation with timeout to prevent hanging (20s max for cron safety)
      const generatedTweet = await Promise.race([
        generateEnhancedTweet(config),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Generation timeout after 20s')), 20000))
      ]) as Awaited<ReturnType<typeof generateEnhancedTweet>>;
      
      if (!generatedTweet) {
        throw new Error('Failed to generate tweet - null response');
      }

      // Create tweet ready for posting
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona: generatedTweet.persona,
        status: 'ready' as const,
        created_at: new Date().toISOString(),
        quality_score: 1,
      };

      await saveTweet(tweet);
      
      logger.info(`✅ Generated enhanced tweet - ${tweet.content.substring(0, 50)}... (ready for posting)`, 'generate');
      logger.info(`   📊 Topic: ${generatedTweet.topic} | Hooks: ${generatedTweet.engagementHooks?.length || 0}`, 'generate');

      return NextResponse.json({
        success: true,
        message: `✅ Generated 1 enhanced NEET tweet with ${selectedPersonaKey}`,
        generated: 1,
        currentPipeline: pendingTweets.length + 1,
        persona: selectedPersonaKey,
        topic: generatedTweet.topic,
        contentType,
        engagementHooks: generatedTweet.engagementHooks || [],
        gibibiCTA: generatedTweet.gibibiCTA,
        enhanced: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to generate tweet: ${errorMsg}`, 'generate', error as Error);
      
      return NextResponse.json({
        success: false,
        error: 'Tweet generation failed',
        details: errorMsg,
        currentPipeline: pendingTweets.length,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('Async generation check failed', 'generate', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to start generation',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

