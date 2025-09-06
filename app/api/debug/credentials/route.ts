import { NextRequest, NextResponse } from 'next/server';
import { getAccount } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('account_id');
  
  if (!accountId) {
    return NextResponse.json({ error: 'account_id required' }, { status: 400 });
  }
  
  try {
    const account = await getAccount(accountId);
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Check if credentials exist and are properly decrypted
    const credentials = {
      apiKey: account.twitter_api_key,
      apiSecret: account.twitter_api_secret,
      accessToken: account.twitter_access_token,
      accessSecret: account.twitter_access_token_secret,
    };
    
    const credentialStatus = {
      apiKey: credentials.apiKey ? 'PRESENT' : 'NULL',
      apiSecret: credentials.apiSecret ? 'PRESENT' : 'NULL', 
      accessToken: credentials.accessToken ? 'PRESENT' : 'NULL',
      accessSecret: credentials.accessSecret ? 'PRESENT' : 'NULL',
    };
    
    return NextResponse.json({
      success: true,
      accountId,
      accountName: account.name,
      twitterHandle: account.twitter_handle,
      credentialStatus,
      credentials: {
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret, 
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessSecret,
      },
      // Also check if they start with expected formats
      validation: {
        apiKeyFormat: credentials.apiKey ? (credentials.apiKey.length > 20 ? 'OK' : 'SHORT') : 'NULL',
        apiSecretFormat: credentials.apiSecret ? (credentials.apiSecret.length > 40 ? 'OK' : 'SHORT') : 'NULL',
        accessTokenFormat: credentials.accessToken ? (credentials.accessToken.includes('-') ? 'OK' : 'INVALID') : 'NULL',
        accessSecretFormat: credentials.accessSecret ? (credentials.accessSecret.length > 40 ? 'OK' : 'SHORT') : 'NULL',
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      accountId
    }, { status: 500 });
  }
}