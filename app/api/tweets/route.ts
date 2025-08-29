import { NextResponse } from 'next/server';
import { getPaginatedTweets, saveTweet, generateTweetId, deleteTweets, Tweet } from '@/lib/db';
import { generateViralTweet, generateBatchTweets, TweetGenerationConfig } from '@/lib/generation';
import { generateEnhancedTweet, generateBatchEnhancedTweets } from '@/lib/tweets';
import { logger } from '@/lib/logger';
import { getContentTypeForHour } from '@/lib/schedule';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const result = await getPaginatedTweets({ page, limit });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tweets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    if (action === 'generate') {
      const personaKey = data.persona || 'neet_biology'; // Default to most weighted persona
      const topic = data.topic; // Optional specific topic
      const useEnhanced = data.enhanced !== false; // Default to enhanced unless explicitly disabled
      
      const currentHour = new Date().getHours();
      const contentType = getContentTypeForHour(currentHour);
      
      const config: TweetGenerationConfig = {
        persona: personaKey,
        topic: topic,
        contentType: contentType as 'challenge' | 'trap' | 'quick_tip' | 'motivation' | 'question_reveal' | 'competitive'
      };

      const generatedTweet = useEnhanced 
        ? await generateEnhancedTweet(config)
        : await generateViralTweet(config);
      
      if (!generatedTweet) {
        return NextResponse.json({ error: 'Failed to generate tweet' }, { status: 500 });
      }
      
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
      return NextResponse.json({ 
        tweet,
        meta: {
          topic: 'topicDisplayName' in generatedTweet ? generatedTweet.topicDisplayName : generatedTweet.topic,
          hooks: 'viralHooks' in generatedTweet ? generatedTweet.viralHooks || [] : generatedTweet.engagementHooks || [],
          gibibiCTA: generatedTweet.gibibiCTA,
          contentType,
          enhanced: useEnhanced
        }
      });
    }



    if (action === 'bulk_generate') {
      const personaKey = data.persona; // Optional - will use weighted selection if not provided
      const useEnhanced = data.enhanced !== false; // Default to enhanced unless explicitly disabled
      
      const requestedCount = data.count || 5;
      const count = requestedCount;
      
      logger.info(`🎯 Starting ${useEnhanced ? 'enhanced' : 'viral'} NEET bulk generation of ${count} tweets with advanced persona system...`, 'tweets-api');
      
      const currentHour = new Date().getHours();
      const contentType = getContentTypeForHour(currentHour);
      
      const config: TweetGenerationConfig = {
        persona: personaKey,
        contentType: contentType as 'challenge' | 'trap' | 'quick_tip' | 'motivation' | 'question_reveal' | 'competitive'
      };

      try {
        const generatedTweets = useEnhanced 
          ? await generateBatchEnhancedTweets(count, config)
          : await generateBatchTweets(count, config);
        
        if (generatedTweets.length === 0) {
          return NextResponse.json({ error: 'Failed to generate any tweets' }, { status: 500 });
        }

        const savedTweets: Tweet[] = [];
        
        // Save all generated tweets to database
        for (const generatedTweet of generatedTweets) {
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
          savedTweets.push(tweet);
        }

        logger.info(`🎉 Viral bulk generation completed! Generated ${savedTweets.length}/${count} NEET tweets`, 'tweets-api');
        
        // Calculate persona distribution
        const personaStats = savedTweets.reduce((acc, tweet) => {
          acc[tweet.persona] = (acc[tweet.persona] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Calculate topic diversity
        const topicStats = generatedTweets.reduce((acc, tweet) => {
          const topicName = 'topicDisplayName' in tweet ? tweet.topicDisplayName : tweet.topic;
          if (topicName) {
            acc[topicName] = (acc[topicName] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);
        
        return NextResponse.json({ 
          tweets: savedTweets,
          meta: {
            contentType,
            personaDistribution: personaStats,
            topicDiversity: Object.keys(topicStats).length,
            engagementElements: generatedTweets.flatMap(t => 'viralHooks' in t ? t.viralHooks || [] : t.engagementHooks || []).length,
            gibibiCTAs: generatedTweets.filter(t => t.gibibiCTA).length,
            enhanced: useEnhanced
          }
        });
        
      } catch (error) {
        logger.error('Bulk generation failed:', 'tweets-api', error as Error);
        return NextResponse.json({ 
          error: 'Bulk generation failed',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    }


    if (action === 'bulk_delete') {
      const { tweetIds } = data;
      
      if (!tweetIds || !Array.isArray(tweetIds) || tweetIds.length === 0) {
        return NextResponse.json({ error: 'No tweet IDs provided for deletion' }, { status: 400 });
      }

      await deleteTweets(tweetIds);
      return NextResponse.json({ 
        success: true, 
        deletedCount: tweetIds.length,
        deletedIds: tweetIds 
      });
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error) {
    logger.error('Error in tweets API:', 'tweets-api', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}