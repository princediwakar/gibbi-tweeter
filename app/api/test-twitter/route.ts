import { NextResponse } from 'next/server';
import { validateTwitterCredentials, postTweet } from '@/lib/twitter';

export async function GET() {
  try {
    // Test environment variables
    const hasApiKey = !!process.env.TWITTER_API_KEY;
    const hasApiSecret = !!process.env.TWITTER_API_SECRET;
    const hasAccessToken = !!process.env.TWITTER_ACCESS_TOKEN;
    const hasAccessSecret = !!process.env.TWITTER_ACCESS_TOKEN_SECRET;

    let twitterValid = false;
    let twitterError = null;
    let userInfo = null;
    let permissionsTest = null;

    // Test basic credentials
    try {
      twitterValid = await validateTwitterCredentials();
    } catch (error) {
      twitterError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      status: 'Twitter API Diagnostics',
      timestamp: new Date().toISOString(),
      credentials: {
        hasApiKey,
        hasApiSecret, 
        hasAccessToken,
        hasAccessSecret,
      },
      connection: {
        valid: twitterValid,
        error: twitterError
      },
      environment: process.env.NODE_ENV || 'development',
      message: twitterValid ? 
        '✅ Twitter API connection successful! Ready for production.' : 
        '❌ Twitter API connection failed'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to test Twitter API',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, content } = body;

    if (action === 'test-post') {
      if (!content || content.length === 0) {
        return NextResponse.json({
          error: 'Content required for test post'
        }, { status: 400 });
      }

      try {
        const result = await postTweet(content);
        return NextResponse.json({
          success: true,
          message: '✅ Test tweet posted successfully!',
          tweetId: result.data.id,
          tweetUrl: `https://x.com/user/status/${result.data.id}`,
          content: content,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
          success: false,
          error: 'Failed to post test tweet',
          details: errorMessage,
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: 'Invalid action. Use "test-post" with content.'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process test request',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}