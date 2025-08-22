import { NextResponse } from 'next/server';
import { getAllTweets, saveTweet, deleteTweet } from '@/lib/db';
import { postTweet } from '@/lib/twitter';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tweets = await getAllTweets();
    const tweet = tweets.find(t => t.id === id);

    if (!tweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    }

    return NextResponse.json(tweet);
  } catch (error) {
    console.error('Error fetching tweet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;
    const tweets = await getAllTweets();
    const tweet = tweets.find(t => t.id === id);

    if (!tweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    }

    if (action === 'post') {
      try {
        const result = await postTweet(tweet.content);
        tweet.status = 'posted';
        tweet.postedAt = new Date();
        tweet.twitterId = result.data.id; // Store the Twitter tweet ID
        await saveTweet(tweet);
        return NextResponse.json({ 
          ...tweet, 
          twitterUrl: `https://x.com/user/status/${result.data.id}`
        });
      } catch (error) {
        tweet.status = 'failed';
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        tweet.errorMessage = errorMessage;
        await saveTweet(tweet);
        
        // Return detailed error for better user experience
        return NextResponse.json({ 
          error: 'Failed to post tweet',
          details: errorMessage,
          tweet: tweet
        }, { status: 400 });
      }
    }

    if (action === 'update') {
      Object.assign(tweet, data);
      await saveTweet(tweet);
      return NextResponse.json(tweet);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in tweet API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteTweet(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    return NextResponse.json({ error: 'Failed to delete tweet' }, { status: 500 });
  }
}