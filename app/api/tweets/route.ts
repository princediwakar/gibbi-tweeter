import { NextResponse } from 'next/server';
import { getPaginatedTweets, saveTweet, generateTweetId, deleteTweets, Tweet } from '@/lib/db';
// Removed old viral generation - using only teacher-style enhanced generation
import { generateEnhancedTweet, generateBatchEnhancedTweets } from '@/lib/generationService';
import { TweetGenerationConfig } from '@/lib/types';
import { logger } from '@/lib/logger';
// Removed import of getContentTypeForHour - using inline content type generation

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const accountId = searchParams.get('account_id'); // Multi-account support
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const result = await getPaginatedTweets({ 
      page, 
      limit, 
      accountId: accountId || undefined 
    });
    
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
      const personaKey = data.persona || 'english_vocab_builder'; // Default to educational persona
      const topic = data.topic; // Optional specific topic
      const accountId = data.account_id; // Optional for backward compatibility
      
      // Allow fallback to environment variables if no account_id provided (for development/testing)
      if (!accountId) {
        console.warn('No account_id provided, using environment variable fallback for development');
      }
      
      const currentHour = new Date().getHours();
      // Simple content type based on hour
      const contentTypes = ['explanation', 'concept_clarification', 'memory_aid', 'practical_application', 'common_mistake', 'analogy'];
      const contentType = contentTypes[currentHour % contentTypes.length];
      
      const config: TweetGenerationConfig = {
        account_id: accountId || 'fallback',
        persona: personaKey,
        topic: topic,
        contentType: contentType as 'explanation' | 'concept_clarification' | 'memory_aid' | 'practical_application' | 'common_mistake' | 'analogy'
      };

      // Generate tweet with account context
      const generatedTweet = await generateEnhancedTweet(config);
      
      if (!generatedTweet) {
        return NextResponse.json({ error: 'Failed to generate tweet' }, { status: 500 });
      }
      
      const tweet = {
        id: generateTweetId(),
        account_id: accountId || 'fallback',
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
          topic: generatedTweet.topic,
          hooks: generatedTweet.engagementHooks || [],
          gibbiCTA: generatedTweet.gibbiCTA,
          contentType,
          enhanced: true
        }
      });
    }



    if (action === 'bulk_generate') {
      const personaKey = data.persona; // Optional - will use weighted selection if not provided
      const accountId = data.account_id; // Optional for backward compatibility
      
      // Allow fallback to environment variables if no account_id provided (for development/testing)
      if (!accountId) {
        console.warn('No account_id provided for bulk generation, using environment variable fallback for development');
      }
      
      const requestedCount = data.count || 5;
      const count = requestedCount;
      
      logger.info(`🎯 Starting bulk generation of ${count} tweets for account ${accountId}...`, 'tweets-api');
      
      const currentHour = new Date().getHours();
      // Simple content type based on hour
      const contentTypes = ['explanation', 'concept_clarification', 'memory_aid', 'practical_application', 'common_mistake', 'analogy'];
      const contentType = contentTypes[currentHour % contentTypes.length];
      
      const config: TweetGenerationConfig = {
        account_id: accountId || 'fallback',
        persona: personaKey,
        contentType: contentType as 'explanation' | 'concept_clarification' | 'memory_aid' | 'practical_application' | 'common_mistake' | 'analogy'
      };

      try {
        // Always use enhanced teacher-style generation now
        const generatedTweets = await generateBatchEnhancedTweets(count, config);
        
        if (generatedTweets.length === 0) {
          return NextResponse.json({ error: 'Failed to generate any tweets' }, { status: 500 });
        }

        const savedTweets: Tweet[] = [];
        
        // Save all generated tweets to database
        for (const generatedTweet of generatedTweets) {
          const tweet = {
            id: generateTweetId(),
            account_id: accountId || 'fallback',
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
          const topicName = tweet.topic;
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
            gibbiCTAs: generatedTweets.filter(t => t.gibbiCTA).length,
            enhanced: true
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