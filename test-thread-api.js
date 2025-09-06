#!/usr/bin/env node

/**
 * Test Twitter API tweetThread method specifically
 */

const { TwitterApi } = require('twitter-api-v2');

const BASE_URL = 'http://localhost:3001';

async function testThreadAPI() {
  console.log('🧵 Testing Twitter API tweetThread method\n');
  
  try {
    // Get credentials
    const credResponse = await fetch(`${BASE_URL}/api/debug/credentials?account_id=550e8400-e29b-41d4-a716-446655440001`);
    const credData = await credResponse.json();
    
    if (!credData.success) {
      console.error('❌ Failed to get credentials');
      return;
    }
    
    // Initialize Twitter API client
    const client = new TwitterApi({
      appKey: credData.credentials.apiKey,
      appSecret: credData.credentials.apiSecret,
      accessToken: credData.credentials.accessToken,
      accessSecret: credData.credentials.accessSecret,
    });
    
    console.log('📡 Twitter API client initialized');
    console.log('👤 Testing as:', credData.twitterHandle);
    console.log();
    
    // Create a cricket storyteller style test thread (3 tweets)
    const testThread = [
      '🏏 Test cricket story: MS Dhoni\'s 2011 World Cup final six - the psychology behind the shot that defined a generation 1/3 🧵',
      'The pressure was immense. 28 years of waiting. 1.3 billion dreams riding on his bat. But Dhoni chose to finish with a six, not a safe single. Why? 2/3',
      'Because legends don\'t just win - they create moments that transcend sport. That six wasn\'t just about cricket; it was about belief, audacity, and destiny. 3/3 🏏'
    ];
    
    console.log('📝 Test thread content:');
    testThread.forEach((tweet, i) => {
      console.log(`  ${i + 1}. ${tweet}`);
    });
    console.log();
    
    console.log('🚀 Attempting to post thread using tweetThread method...');
    
    try {
      const results = await client.v2.tweetThread(testThread);
      
      console.log('🎉 Thread posted successfully!');
      console.log(`📊 Posted ${results.length} tweets`);
      
      results.forEach((result, i) => {
        if (result.data?.id) {
          console.log(`  ${i + 1}. Tweet ID: ${result.data.id}`);
          console.log(`     URL: https://twitter.com/${credData.twitterHandle.replace('@', '')}/status/${result.data.id}`);
        }
      });
      
      console.log('\n✅ Twitter threading API is working correctly!');
      console.log('🔍 This means the issue is likely with the thread content format or length');
      
    } catch (threadError) {
      console.error('❌ Failed to post thread:', threadError.message);
      
      if (threadError.code) {
        console.error('🚨 Twitter API error code:', threadError.code);
      }
      
      if (threadError.data) {
        console.error('📄 Twitter API error details:', JSON.stringify(threadError.data, null, 2));
      }
      
      console.log('\n🔧 Threading troubleshooting:');
      console.log('1. Check thread content length (each tweet must be ≤ 280 chars)');
      console.log('2. Verify thread formatting');
      console.log('3. Check for policy violations in content');
      console.log('4. Try with simpler content first');
      
      // Test with even simpler content
      console.log('\n🔄 Trying with minimal content...');
      
      const simpleThread = [
        'Cricket test thread 1/2 🏏',
        'Simple cricket story test 2/2 🏏'
      ];
      
      try {
        const simpleResults = await client.v2.tweetThread(simpleThread);
        console.log('✅ Simple thread worked! Issue is with content complexity/length');
        
        simpleResults.forEach((result, i) => {
          if (result.data?.id) {
            console.log(`  Simple tweet ${i + 1} ID: ${result.data.id}`);
          }
        });
        
      } catch (simpleError) {
        console.error('❌ Even simple thread failed:', simpleError.message);
        console.log('🚨 This suggests a deeper Twitter API or account issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testThreadAPI();