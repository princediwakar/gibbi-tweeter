import { NextResponse } from 'next/server';
import { getPaginatedTweets, saveTweet, generateTweetId, deleteTweets, Tweet } from '@/lib/neon-db';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getTrendingTopics } from '@/lib/trending';
import { logger } from '@/lib/logger';
// Import centralized persona configuration
import { PHYSICS_MASTER } from '@/lib/personas';

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
      const persona = data.persona || PHYSICS_MASTER.id;
      
      const options: TweetGenerationOptions = {
        persona,
        includeHashtags: data.includeHashtags,
        customPrompt: data.customPrompt,
        useTrendingTopics: data.useTrendingTopics,
      };

      const generatedTweet = await generateTweet(options);
      
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona,
        status: 'ready' as const,
        created_at: new Date().toISOString(),
        quality_score: 1,
      };

      await saveTweet(tweet);
      return NextResponse.json({ tweet });
    }



    if (action === 'bulk_generate') {
      const persona = data.persona || PHYSICS_MASTER.id;
      
      
      const requestedCount = data.count || 5;
      const count = requestedCount;
      
      logger.info(`🎯 Starting real-time RSS-based bulk generation of ${count} tweets...`, 'tweets-api');
      
      // Step 1: Fetch fresh trending topics from RSS sources
      let trendingTopics;
      try {
        logger.info(`📡 Fetching fresh trending topics from RSS sources for ${persona}...`, 'tweets-api');
        trendingTopics = await getTrendingTopics(persona);
        logger.info(`✅ Retrieved ${trendingTopics.length} trending topics from RSS feeds for ${persona}`, 'tweets-api');
      } catch (error) {
        logger.error('Failed to fetch trending topics:', 'tweets-api', error as Error);
        return NextResponse.json({ 
          error: 'Failed to fetch trending topics for bulk generation',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }

      if (trendingTopics.length === 0) {
        logger.warn('No trending topics found. Using fallback topic.', 'tweets-api');
        trendingTopics = [{ title: 'NEET Preparation Strategy', traffic: 'N/A', category: 'Fallback', hashtags: [] }];
      }

      const generatedTweets: Tweet[] = [];
      const usedTopics = new Set<string>(); // Track used topics to ensure no repetition
      
      // Step 2: Generate tweets using different trending topics
      for (let i = 0; i < count; i++) {
        try {
          // Select a different trending topic for each tweet
          let selectedTopic = null;
          let attempts = 0;
          const maxAttempts = Math.min(trendingTopics.length * 2, 20);

          // Find an unused topic (with fallback to allow reuse if needed)
          while (attempts < maxAttempts && !selectedTopic) {
            const randomIndex = Math.floor(Math.random() * trendingTopics.length);
            const candidateTopic = trendingTopics[randomIndex];
            
            // If we haven't used this topic yet, select it
            if (!usedTopics.has(candidateTopic.title) || usedTopics.size >= trendingTopics.length) {
              selectedTopic = candidateTopic;
              usedTopics.add(candidateTopic.title);
              break;
            }
            attempts++;
          }

          // Fallback if no topic found (shouldn't happen)
          if (!selectedTopic) {
            selectedTopic = trendingTopics[i % trendingTopics.length];
          }

          // Create custom prompt based on the trending topic
          const customPrompt = `Create a witty satirical tweet about: "${selectedTopic.title}". Make it relatable to Indian context and add sharp social commentary with humor.`;

          // Vary hashtag inclusion for each tweet
          const includeHashtags = i % 2 === 0; // Alternate hashtags

          const options: TweetGenerationOptions = {
            persona: data.persona,
            includeHashtags: includeHashtags,
            customPrompt: customPrompt,
            useTrendingTopics: false, // We're manually providing the trending context
          };

          logger.info(`📝 Tweet ${i + 1}/${count} - RSS TOPIC: "${selectedTopic.title}":`, 'tweets-api', {
            source: selectedTopic.category || 'RSS Feed',
            traffic: selectedTopic.traffic,
            hashtags: includeHashtags,
            originalHashtags: selectedTopic.hashtags
          });

          const generatedTweet = await generateTweet(options, i);
          
          // Skip if we've seen this exact content before
          if (generatedTweets.some(t => t.content === generatedTweet.content)) {
            logger.warn(`Duplicate content detected for tweet ${i + 1}, skipping...`, 'tweets-api');
            continue;
          }
          
          
          const tweet = {
            id: generateTweetId(),
            content: generatedTweet.content,
            hashtags: generatedTweet.hashtags,
            persona: persona,
            status: 'ready' as const,
            created_at: new Date().toISOString(),
            quality_score: 1,
          };

          await saveTweet(tweet);
          generatedTweets.push(tweet);
          
          logger.info(`✅ Generated tweet ${i + 1}: ${generatedTweet.content.substring(0, 60)}...`, 'tweets-api');
          logger.info(`   📊 Based on RSS topic: ${selectedTopic.title} (${selectedTopic.traffic})`, 'tweets-api');
          
          // Add delay between generations for API variety
          if (i < count - 1) {
            const delay = Math.random() * 2000 + 1500; // 1.5-3.5 second random delay
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (error) {
          logger.error(`Error generating tweet ${i + 1}:`, 'tweets-api', error as Error);
          // Continue with next tweet instead of failing entire batch
          continue;
        }
      }

      logger.info(`🎉 RSS-based bulk generation completed! Generated ${generatedTweets.length}/${count} unique tweets from trending topics`, 'tweets-api');
      return NextResponse.json({ 
        tweets: generatedTweets,
        meta: {
          totalTrendingTopics: trendingTopics.length,
          uniqueTopicsUsed: usedTopics.size,
          rssSourcesUsed: [...new Set(trendingTopics.map(t => t.category))].length
        }
      });
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