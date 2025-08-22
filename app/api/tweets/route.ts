import { NextResponse } from 'next/server';
import { getAllTweets, getPaginatedTweets, saveTweet, generateTweetId, deleteTweets, Tweet } from '@/lib/db';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { calculateQualityScore } from '@/lib/quality-scorer';

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
      const options: TweetGenerationOptions = {
        persona: data.persona,
        includeHashtags: data.includeHashtags,
        customPrompt: data.customPrompt,
        useTrendingTopics: data.useTrendingTopics,
      };

      const generatedTweet = await generateTweet(options);
      const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, data.persona || 'unhinged_satirist');
      
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona: data.persona || 'unhinged_satirist',
        status: 'draft' as const,
        createdAt: new Date(),
        qualityScore,
      };

      await saveTweet(tweet);
      return NextResponse.json({ tweet });
    }

    if (action === 'schedule') {
      const scheduledFor = new Date(data.scheduledFor);
      const tweet = {
        id: generateTweetId(),
        content: data.content,
        hashtags: data.hashtags || [],
        persona: data.persona || 'unhinged_satirist',
        scheduledFor,
        status: 'scheduled' as const,
        createdAt: new Date(),
      };

      await saveTweet(tweet);
      return NextResponse.json({ tweet });
    }

    if (action === 'generate-and-schedule') {
      const options: TweetGenerationOptions = {
        persona: data.persona,
        includeHashtags: data.includeHashtags,
        customPrompt: data.customPrompt,
        useTrendingTopics: data.useTrendingTopics,
      };

      const generatedTweet = await generateTweet(options);
      const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, data.persona || 'unhinged_satirist');
      
      // Default to 2 hours from now if no scheduledFor provided
      const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona: data.persona || 'unhinged_satirist',
        scheduledFor,
        status: 'scheduled' as const,
        createdAt: new Date(),
        qualityScore,
      };

      await saveTweet(tweet);
      return NextResponse.json({ tweet });
    }

    if (action === 'bulk_generate') {
      const count = data.count || 5;
      
      // Enhanced bulk generation with variation techniques
      const generatedTweets: Tweet[] = [];
      // const usedTopics = new Set<string>(); // Track used topics to avoid repetition - removed unused variable
      
      console.log(`🎯 Starting bulk generation of ${count} tweets with enhanced variety...`);
      
      for (let i = 0; i < count; i++) {
        try {
          // Add variety through different approaches for each tweet
          const variations = [
            { includeHashtags: true, useTrendingTopics: true },
            { includeHashtags: false, useTrendingTopics: true },
            { includeHashtags: true, useTrendingTopics: false },
            { includeHashtags: Math.random() > 0.3, useTrendingTopics: true },
            { includeHashtags: true, useTrendingTopics: Math.random() > 0.2 }
          ];
          
          const variation = variations[i % variations.length];
          
          // GUARANTEED different topic categories for each tweet
          const topicCategories = data.customPrompt ? [data.customPrompt] : [
            "Create a witty observation about modern Indian lifestyle and daily routines",
            "Make a clever comment about technology, AI, and social media in India", 
            "Share a humorous take on Indian politics, governance, or bureaucracy",
            "Comment satirically on Indian business, startup culture, or economy",
            "Create a funny observation about Indian education system or academic life",
            "Make a witty comment about Indian social dynamics, relationships, or culture",
            "Generate satirical content about Indian infrastructure, transport, or urban life",
            "Create humor about Indian food culture, regional differences, or dining experiences",
            "Make a witty observation about Indian entertainment, Bollywood, or media",
            "Comment humorously on Indian festivals, traditions, or family dynamics"
          ];
          
          // Force different topics by using modulo to cycle through categories
          const selectedPrompt = topicCategories[i % topicCategories.length];
          
          const options: TweetGenerationOptions = {
            persona: data.persona,
            includeHashtags: variation.includeHashtags,
            customPrompt: selectedPrompt,
            useTrendingTopics: false, // Always use custom prompts for guaranteed topic diversity
          };

          const topicName = [
            "Lifestyle", "Technology", "Politics", "Business", "Education", 
            "Social", "Infrastructure", "Food", "Entertainment", "Traditions"
          ][i % topicCategories.length] || "General";
          
          console.log(`📝 Generating tweet ${i + 1}/${count} - TOPIC: ${topicName}:`, {
            hashtags: variation.includeHashtags,
            topicCategory: topicName,
            prompt: selectedPrompt.substring(0, 50) + '...'
          });

          const generatedTweet = await generateTweet(options, i);
          
          // Skip if we've seen this exact content before (rare but possible)
          if (generatedTweets.some(t => t.content === generatedTweet.content)) {
            console.log(`⚠️ Duplicate content detected for tweet ${i + 1}, skipping...`);
            continue;
          }
          
          const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, data.persona || 'unhinged_satirist');
          
          const tweet = {
            id: generateTweetId(),
            content: generatedTweet.content,
            hashtags: generatedTweet.hashtags,
            persona: data.persona || 'unhinged_satirist',
            status: 'draft' as const,
            createdAt: new Date(),
            qualityScore,
          };

          await saveTweet(tweet);
          generatedTweets.push(tweet);
          
          console.log(`✅ Generated tweet ${i + 1}: ${generatedTweet.content.substring(0, 50)}...`);
          
          // Add delay between generations to allow for more variation
          if (i < count - 1) {
            const delay = Math.random() * 2000 + 1000; // 1-3 second random delay
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (error) {
          console.error(`❌ Error generating tweet ${i + 1}:`, error);
          // Continue with next tweet instead of failing entire batch
          continue;
        }
      }

      console.log(`🎉 Bulk generation completed! Generated ${generatedTweets.length}/${count} unique tweets`);
      return NextResponse.json({ tweets: generatedTweets });
    }

    if (action === 'schedule_selected') {
      const { tweetIds } = data;
      const tweets = await getAllTweets();
      const scheduledTweets = [];

      for (const tweetId of tweetIds) {
        const tweet = tweets.find(t => t.id === tweetId);
        if (tweet && tweet.status === 'draft') {
          tweet.status = 'scheduled';
          tweet.scheduledFor = new Date(Date.now() + 2 * 60 * 60 * 1000); // Schedule for 2 hours from now
          await saveTweet(tweet);
          scheduledTweets.push(tweet);
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