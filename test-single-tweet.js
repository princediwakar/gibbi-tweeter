#!/usr/bin/env node

/**
 * Test single tweet posting to isolate Twitter API issues
 */

const { TwitterApi } = require('twitter-api-v2');

const BASE_URL = 'http://localhost:3000';

async function testSingleTweet() {
  console.log('🐦 Testing single tweet posting\n');
  
  try {
    // Get credentials from debug endpoint
    const credResponse = await fetch(`${BASE_URL}/api/debug/credentials?account_id=550e8400-e29b-41d4-a716-446655440001`);
    const credData = await credResponse.json();
    
    if (!credData.success) {
      console.error('❌ Failed to get credentials:', credData.error);
      return;
    }
    
    console.log('✅ Retrieved credentials for:', credData.accountName);
    console.log('📱 Twitter handle:', credData.twitterHandle);
    console.log('🔑 Credential validation:', JSON.stringify(credData.validation, null, 2));
    console.log();
    
    // Initialize Twitter API client
    const client = new TwitterApi({
      appKey: credData.credentials.apiKey,
      appSecret: credData.credentials.apiSecret,
      accessToken: credData.credentials.accessToken,
      accessSecret: credData.credentials.accessSecret,
    });
    
    console.log('📡 Twitter API client initialized');
    
    // First, try to verify credentials
    console.log('🔍 Verifying credentials with Twitter API...');
    
    try {
      const me = await client.v2.me();
      console.log('✅ Twitter API authentication successful!');
      console.log('👤 Authenticated as:', me.data.username);
      console.log('📊 Account ID:', me.data.id);
      console.log();
    } catch (verifyError) {
      console.error('❌ Twitter API authentication failed:', verifyError.message);
      
      if (verifyError.code) {
        console.error('🚨 Twitter API error code:', verifyError.code);
      }
      
      if (verifyError.data) {
        console.error('📄 Twitter API error data:', JSON.stringify(verifyError.data, null, 2));
      }
      
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check Twitter Developer Portal app permissions (must be Read & Write)');
      console.log('2. Verify OAuth 1.0a is enabled');
      console.log('3. Regenerate API keys if needed');
      console.log('4. Check if account is suspended or restricted');
      return;
    }
    
    // Try posting a simple test tweet
    const testTweetContent = `🧪 Twitter API test - ${new Date().toISOString()}`;
    
    console.log('📝 Attempting to post test tweet...');
    console.log('📄 Content:', testTweetContent);
    console.log();
    
    try {
      const result = await client.v2.tweet(testTweetContent);
      
      console.log('🎉 Tweet posted successfully!');
      console.log('🆔 Tweet ID:', result.data.id);
      console.log('🔗 Tweet URL:', `https://twitter.com/${credData.twitterHandle.replace('@', '')}/status/${result.data.id}`);
      
    } catch (tweetError) {
      console.error('❌ Failed to post tweet:', tweetError.message);
      
      if (tweetError.code) {
        console.error('🚨 Twitter API error code:', tweetError.code);
      }
      
      if (tweetError.data) {
        console.error('📄 Twitter API error details:', JSON.stringify(tweetError.data, null, 2));
      }
      
      // Specific guidance based on error codes
      if (tweetError.code === 403) {
        console.log('\n🔧 Error 403 troubleshooting:');
        console.log('1. App permissions: Must be "Read and Write" in Twitter Developer Portal');
        console.log('2. Account status: Check if account is suspended or restricted');
        console.log('3. API access: Ensure you have Essential or Basic access level');
        console.log('4. Authentication: Verify OAuth 1.0a credentials are correct');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSingleTweet();