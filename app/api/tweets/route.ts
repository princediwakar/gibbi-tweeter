import { NextResponse } from 'next/server';
import { getAllTweets, getPaginatedTweets, saveTweet, generateTweetId } from '@/lib/db';
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tweets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

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
      const scheduledFor = new Date(data.scheduledFor);
      
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
      const options: TweetGenerationOptions = {
        persona: data.persona,
        includeHashtags: data.includeHashtags,
        customPrompt: data.customPrompt,
        useTrendingTopics: data.useTrendingTopics,
      };

      const generatedTweets = [];
      for (let i = 0; i < count; i++) {
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
        generatedTweets.push(tweet);
      }

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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in tweets API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}