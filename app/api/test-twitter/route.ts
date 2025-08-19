import { NextResponse } from 'next/server';
import { validateTwitterCredentials } from '@/lib/twitter';

export async function GET() {
  try {
    // Test environment variables
    const hasApiKey = !!process.env.TWITTER_API_KEY;
    const hasApiSecret = !!process.env.TWITTER_API_SECRET;
    const hasAccessToken = !!process.env.TWITTER_ACCESS_TOKEN;
    const hasAccessSecret = !!process.env.TWITTER_ACCESS_TOKEN_SECRET;

    let twitterValid = false;
    let twitterError = null;

    try {
      twitterValid = await validateTwitterCredentials();
    } catch (error) {
      twitterError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      status: 'Twitter API Test',
      credentials: {
        hasApiKey,
        hasApiSecret, 
        hasAccessToken,
        hasAccessSecret,
      },
      twitterConnection: {
        valid: twitterValid,
        error: twitterError
      },
      message: twitterValid ? 'Twitter API connection successful!' : 'Twitter API connection failed'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to test Twitter API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}