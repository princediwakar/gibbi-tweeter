import { NextResponse } from 'next/server';
import { validateTwitterCredentials, postTweet } from '@/lib/twitter';
import { getAccount } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json({
        error: 'account_id parameter required',
        message: 'Please provide account_id to test specific account credentials',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get account credentials from database
    const account = await getAccount(accountId);
    if (!account) {
      return NextResponse.json({
        error: 'Account not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const credentials = {
      apiKey: account.twitter_api_key,
      apiSecret: account.twitter_api_secret,
      accessToken: account.twitter_access_token,
      accessSecret: account.twitter_access_token_secret
    };

    let validationResult: { valid: boolean; userInfo?: { username: string; name: string; id: string } } = { valid: false };
    let twitterError = null;

    // Test Twitter API connection with account credentials
    try {
      validationResult = await validateTwitterCredentials(credentials);
    } catch (error) {
      twitterError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      status: 'Twitter API Diagnostics',
      timestamp: new Date().toISOString(),
      account: {
        id: account.id,
        name: account.name,
        handle: account.twitter_handle,
        status: account.status
      },
      connection: {
        valid: validationResult.valid,
        userInfo: validationResult.userInfo,
        error: twitterError
      },
      environment: process.env.NODE_ENV || 'development',
      message: validationResult.valid ? 
        '✅ Twitter API connection successful! Account ready for production.' : 
        '❌ Twitter API connection failed for this account'
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
    const { action, content, account_id } = body;

    if (action === 'test-post') {
      if (!content || content.length === 0) {
        return NextResponse.json({
          error: 'Content required for test post'
        }, { status: 400 });
      }

      if (!account_id) {
        return NextResponse.json({
          error: 'account_id required for test post'
        }, { status: 400 });
      }

      // Get account credentials from database
      const account = await getAccount(account_id);
      if (!account) {
        return NextResponse.json({
          error: 'Account not found'
        }, { status: 404 });
      }

      const credentials = {
        apiKey: account.twitter_api_key,
        apiSecret: account.twitter_api_secret,
        accessToken: account.twitter_access_token,
        accessSecret: account.twitter_access_token_secret
      };

      try {
        const result = await postTweet(content, credentials);
        return NextResponse.json({
          success: true,
          message: '✅ Test tweet posted successfully!',
          account: account.name,
          handle: account.twitter_handle,
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
      error: 'Invalid action. Use "test-post" with content and account_id.'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process test request',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}