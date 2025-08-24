import { NextResponse } from 'next/server';
import { getAllTweets, getPaginatedTweets, saveTweet, generateTweetId, deleteTweets, Tweet } from '@/lib/neon-db';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { getTrendingTopics } from '@/lib/trending';
import { getNextOptimalPostTime, getSpacedPostingSchedule } from '@/lib/timing';

// Import personas directly instead of making HTTP calls
const PERSONAS = [
  { id: "sat_coach", name: "SAT Coach" },
  { id: "gre_master", name: "GRE Master" },
  { id: "gmat_pro", name: "GMAT Pro" },
  { id: "test_prep_guru", name: "Test Prep Guru" },
];

// Helper function to get default persona
function getDefaultPersona(): string {
  return PERSONAS[0].id;
}

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
      const defaultPersona = getDefaultPersona();
      const persona = data.persona || defaultPersona;
      
      const options: TweetGenerationOptions = {
        persona,
        includeHashtags: data.includeHashtags,
        customPrompt: data.customPrompt,
        useTrendingTopics: data.useTrendingTopics,
      };

      const generatedTweet = await generateTweet(options);
      const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);
      
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona,
        status: 'draft' as const,
        created_at: new Date().toISOString(),
        quality_score: qualityScore,
      };

      await saveTweet(tweet);
      return NextResponse.json({ tweet });
    }

    if (action === 'schedule') {
      const defaultPersona = getDefaultPersona();
      const scheduledFor = new Date(data.scheduledFor);
      const tweet = {
        id: generateTweetId(),
        content: data.content,
        hashtags: data.hashtags || [],
        persona: data.persona || defaultPersona,
        scheduled_for: scheduledFor.toISOString(),
        status: 'scheduled' as const,
        created_at: new Date().toISOString(),
      };

      await saveTweet(tweet);
      return NextResponse.json({ tweet });
    }

    if (action === 'generate-and-schedule') {
      const defaultPersona = getDefaultPersona();
      const persona = data.persona || defaultPersona;
      
      const options: TweetGenerationOptions = {
        persona,
        includeHashtags: data.includeHashtags,
        customPrompt: data.customPrompt,
        useTrendingTopics: data.useTrendingTopics,
      };

      const generatedTweet = await generateTweet(options);
      const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);
      
      // Use optimal posting time if no scheduledFor provided
      const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : getNextOptimalPostTime();
      
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
      return NextResponse.json({ tweet });
    }

    if (action === 'bulk_generate') {
      const defaultPersona = getDefaultPersona();
      const persona = data.persona || defaultPersona;
      
      // Import timing to check optimal slot limits
      const { OPTIMAL_POSTING_TIMES } = await import('@/lib/timing');
      const maxOptimalSlots = OPTIMAL_POSTING_TIMES.length; // 15 slots per day
      const requestedCount = data.count || 5;
      const count = Math.min(requestedCount, maxOptimalSlots);
      
      if (count < requestedCount) {
        console.log(`⚠️ Requested ${requestedCount} tweets, limited to ${count} (max optimal slots: ${maxOptimalSlots})`);
      }
      
      console.log(`🎯 Starting real-time RSS-based bulk generation of ${count} tweets...`);
      
      // Step 1: Fetch fresh trending topics from RSS sources
      let trendingTopics;
      try {
        console.log(`📡 Fetching fresh trending topics from RSS sources for ${persona}...`);
        trendingTopics = await getTrendingTopics(persona);
        console.log(`✅ Retrieved ${trendingTopics.length} trending topics from RSS feeds for ${persona}`);
      } catch (error) {
        console.error('❌ Failed to fetch trending topics:', error);
        return NextResponse.json({ 
          error: 'Failed to fetch trending topics for bulk generation',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }

      if (trendingTopics.length < count) {
        console.warn(`⚠️ Only ${trendingTopics.length} trending topics available, needed ${count}`);
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

          console.log(`📝 Tweet ${i + 1}/${count} - RSS TOPIC: "${selectedTopic.title}":`, {
            source: selectedTopic.category || 'RSS Feed',
            traffic: selectedTopic.traffic,
            hashtags: includeHashtags,
            originalHashtags: selectedTopic.hashtags
          });

          const generatedTweet = await generateTweet(options, i);
          
          // Skip if we've seen this exact content before
          if (generatedTweets.some(t => t.content === generatedTweet.content)) {
            console.log(`⚠️ Duplicate content detected for tweet ${i + 1}, skipping...`);
            continue;
          }
          
          const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);
          
          const tweet = {
            id: generateTweetId(),
            content: generatedTweet.content,
            hashtags: generatedTweet.hashtags,
            persona,
            status: 'draft' as const,
            created_at: new Date().toISOString(),
            quality_score: qualityScore,
          };

          await saveTweet(tweet);
          generatedTweets.push(tweet);
          
          console.log(`✅ Generated tweet ${i + 1}: ${generatedTweet.content.substring(0, 60)}...`);
          console.log(`   📊 Based on RSS topic: ${selectedTopic.title} (${selectedTopic.traffic})`);
          
          // Add delay between generations for API variety
          if (i < count - 1) {
            const delay = Math.random() * 2000 + 1500; // 1.5-3.5 second random delay
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (error) {
          console.error(`❌ Error generating tweet ${i + 1}:`, error);
          // Continue with next tweet instead of failing entire batch
          continue;
        }
      }

      console.log(`🎉 RSS-based bulk generation completed! Generated ${generatedTweets.length}/${count} unique tweets from trending topics`);
      return NextResponse.json({ 
        tweets: generatedTweets,
        meta: {
          totalTrendingTopics: trendingTopics.length,
          uniqueTopicsUsed: usedTopics.size,
          rssSourcesUsed: [...new Set(trendingTopics.map(t => t.category))].length
        }
      });
    }

    if (action === 'schedule_selected') {
      const { tweetIds } = data;
      const tweets = await getAllTweets();
      const scheduledTweets = [];

      // Get optimal spaced posting schedule for all selected tweets
      const optimalTimes = getSpacedPostingSchedule(tweetIds.length, 45); // 45-minute minimum spacing

      let timeIndex = 0;
      for (const tweetId of tweetIds) {
        const tweet = tweets.find(t => t.id === tweetId);
        if (tweet && tweet.status === 'draft') {
          tweet.status = 'scheduled';
          tweet.scheduled_for = (optimalTimes[timeIndex] || getNextOptimalPostTime()).toISOString();
          await saveTweet(tweet);
          scheduledTweets.push(tweet);
          timeIndex++;
        }
      }

      return NextResponse.json({ tweets: scheduledTweets });
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
    console.error('Error in tweets API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}