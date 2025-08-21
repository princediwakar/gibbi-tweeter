import { NextResponse } from 'next/server';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/db';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';

export async function GET() {
  try {
    const tweets = await getAllTweets();
    return NextResponse.json(tweets);
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
      };

      const generatedTweet = await generateTweet(options);
      
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona: data.persona || 'unhinged_satirist',
        status: 'draft' as const,
        createdAt: new Date(),
      };

      await saveTweet(tweet);
      return NextResponse.json(tweet);
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
      return NextResponse.json(tweet);
    }

    if (action === 'generate-and-schedule') {
      const options: TweetGenerationOptions = {
        persona: data.persona,
        includeHashtags: data.includeHashtags,
        customPrompt: data.customPrompt,
      };

      const generatedTweet = await generateTweet(options);
      const scheduledFor = new Date(data.scheduledFor);
      
      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona: data.persona || 'unhinged_satirist',
        scheduledFor,
        status: 'scheduled' as const,
        createdAt: new Date(),
      };

      await saveTweet(tweet);
      return NextResponse.json(tweet);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in tweets API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}