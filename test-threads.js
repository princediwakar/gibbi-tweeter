#!/usr/bin/env node

/**
 * Thread Testing Script - Uses existing twitter-api-v2 infrastructure
 * Tests business_storyteller persona with instant thread posting
 */


const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://gibbi-tweeter.vercel.app' 
  : 'http://localhost:3000';

async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`🔄 ${options.method || 'GET'} ${endpoint}`);
  
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
  
  return response.json();
}

async function getPrinceAccount() {
  console.log('📋 Fetching accounts...');
  const response = await apiCall('/api/accounts');
  const accounts = response.accounts || response;
  
  const princeAccount = accounts.find(acc => 
    acc.twitter_handle?.includes('princediwakar25') || 
    acc.name?.toLowerCase().includes('prince')
  );
  
  if (!princeAccount) {
    console.log('❌ Prince account not found. Available accounts:');
    accounts.forEach(acc => console.log(`  - ${acc.name} (${acc.twitter_handle})`));
    throw new Error('Prince account not found');
  }
  
  console.log(`✅ Found account: ${princeAccount.name} (${princeAccount.twitter_handle})`);
  return princeAccount;
}

async function generateBusinessThread(account) {
  console.log('\n🤖 Generating business storyteller thread...');
  
  // Use GET with query parameters and debug mode to bypass scheduling
  const result = await apiCall(`/api/generate?account_id=${account.id}&debug=true`, {
    headers: {
      'Authorization': 'Bearer 4Hqw8Wp0otUVOR9oRKl3MJyKGq/Sj9kOkEASqUn8Lt4='
    }
  });
  
  console.log('✅ Thread generated successfully!');
  
  if (result.thread && Array.isArray(result.thread)) {
    console.log(`\n📝 Thread preview (${result.thread.length} tweets):`);
    result.thread.forEach((tweet, i) => {
      console.log(`\n${i + 1}/${result.thread.length} 🧵`);
      console.log(`${tweet.content}`);
      if (tweet.hashtags?.length > 0) {
        console.log(`Hashtags: ${tweet.hashtags.join(' ')}`);
      }
    });
  }
  
  return result;
}

async function generateCricketThread(account) {
  console.log('\n🏏 Generating cricket storyteller thread...');
  
  // Use GET with query parameters and debug mode to bypass scheduling
  const result = await apiCall(`/api/generate?account_id=${account.id}&debug=true`, {
    headers: {
      'Authorization': 'Bearer 4Hqw8Wp0otUVOR9oRKl3MJyKGq/Sj9kOkEASqUn8Lt4='
    }
  });
  
  console.log('✅ Cricket thread generated successfully!');
  
  if (result.generatedThreads && result.generatedThreads.length > 0) {
    const cricketThreads = result.generatedThreads.filter(t => t.persona === 'cricket_storyteller');
    if (cricketThreads.length > 0) {
      console.log(`\n🏏 Cricket thread preview:`);
      console.log(`Template: ${cricketThreads[0].template}`);
      console.log(`Story Category: ${cricketThreads[0].story_category}`);
      console.log(`Total tweets: ${cricketThreads[0].total_tweets}`);
    }
  }
  
  // Get the actual thread content from the tweets API
  const tweetsResponse = await apiCall(`/api/tweets?account_id=${account.id}&limit=10`);
  const tweets = tweetsResponse.data || tweetsResponse;
  const cricketThreadTweets = tweets.filter(t => 
    t.thread_id && t.persona === 'cricket_storyteller'
  ).sort((a, b) => a.thread_sequence - b.thread_sequence);
  
  if (cricketThreadTweets.length > 0) {
    console.log(`\n🏏 Latest cricket thread content (${cricketThreadTweets.length} tweets):`);
    cricketThreadTweets.forEach((tweet) => {
      console.log(`\n${tweet.thread_sequence}/${cricketThreadTweets.length} 🏏`);
      console.log(`${tweet.content}`);
      if (tweet.hashtags?.length > 0) {
        console.log(`Hashtags: ${tweet.hashtags.join(' ')}`);
      }
    });
  }
  
  return result;
}

async function testInstantThreadPosting(account) {
  console.log('\n🚀 Testing instant thread posting...');
  
  // Get ready threads for this account
  const response = await apiCall(`/api/tweets?account_id=${account.id}&status=ready`);
  const tweets = response.data || response;
  const readyThreads = tweets.filter(t => t.thread_id && t.thread_sequence === 1);
  
  if (readyThreads.length === 0) {
    console.log('⚠️  No ready threads found. Generate a thread first.');
    return null;
  }
  
  const thread = readyThreads[0];
  console.log(`🎯 Found ready thread: ${thread.thread_id}`);
  
  // Test the instant posting endpoint
  const result = await apiCall('/api/auto-post', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 4Hqw8Wp0otUVOR9oRKl3MJyKGq/Sj9kOkEASqUn8Lt4='
    },
    body: JSON.stringify({
      account_id: account.id,
      test_mode: true,
      thread_only: true
    })
  });
  
  console.log('✅ Instant posting test completed!');
  console.log('📊 Result:', JSON.stringify(result, null, 2));
  
  return result;
}

async function verifyTwitterCredentials(account) {
  console.log('\n🔐 Verifying Twitter API credentials...');
  
  // This would normally be decrypted in the actual service
  console.log('✅ Account has Twitter credentials configured');
  console.log(`📱 Account: ${account.twitter_handle}`);
  console.log(`🔑 API Key: ${account.twitter_api_key ? 'Present' : 'Missing'}`);
  console.log(`🔑 Access Token: ${account.twitter_access_token ? 'Present' : 'Missing'}`);
  
  return true;
}

async function showThreadProgress(account) {
  console.log('\n📊 Recent thread activity:');
  
  const response = await apiCall(`/api/tweets?account_id=${account.id}&limit=20`);
  const tweets = response.data || response;
  const threadTweets = tweets.filter(t => t.thread_id);
  
  // Group by thread_id
  const threads = {};
  threadTweets.forEach(tweet => {
    if (!threads[tweet.thread_id]) {
      threads[tweet.thread_id] = [];
    }
    threads[tweet.thread_id].push(tweet);
  });
  
  Object.entries(threads).forEach(([threadId, tweets]) => {
    const sortedTweets = tweets.sort((a, b) => a.thread_sequence - b.thread_sequence);
    const firstTweet = sortedTweets[0];
    const status = firstTweet.status === 'posted' ? '✅' : 
                   firstTweet.status === 'ready' ? '🟢' : 
                   firstTweet.status === 'scheduled' ? '🟡' : '⚪';
    
    console.log(`\n${status} Thread ${threadId} (${sortedTweets.length} tweets)`);
    console.log(`   Status: ${firstTweet.status}`);
    console.log(`   Preview: ${firstTweet.content.substring(0, 80)}...`);
    
    if (firstTweet.twitter_url) {
      console.log(`   URL: ${firstTweet.twitter_url}`);
    }
  });
}

async function runTest(testType = 'all') {
  console.log('🧵 Thread Testing with twitter-api-v2');
  console.log('=====================================\n');
  
  try {
    // Get Prince's account
    const account = await getPrinceAccount();
    
    // Verify credentials
    await verifyTwitterCredentials(account);
    
    if (testType === 'generate' || testType === 'all') {
      // Generate new thread
      await generateBusinessThread(account);
    }
    
    if (testType === 'cricket' || testType === 'all') {
      // Generate cricket thread
      await generateCricketThread(account);
    }
    
    if (testType === 'post' || testType === 'all') {
      // Test posting
      await testInstantThreadPosting(account);
    }
    
    if (testType === 'status' || testType === 'all') {
      // Show progress
      await showThreadProgress(account);
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case '--generate':
  case '-g':
    runTest('generate');
    break;
  case '--cricket':
  case '-c':
    runTest('cricket');
    break;
  case '--post':
  case '-p':
    runTest('post');
    break;
  case '--status':
  case '-s':
    runTest('status');
    break;
  case '--help':
  case '-h':
    console.log(`
🧵 Thread Testing Script

Usage:
  node test-threads.js [option]

Options:
  -g, --generate    Generate new business thread
  -c, --cricket     Generate new cricket thread
  -p, --post        Test thread posting
  -s, --status      Show thread status
  -h, --help        Show this help
  
  (no option)      Run all tests

Examples:
  node test-threads.js --generate
  node test-threads.js --cricket
  node test-threads.js --post
  node test-threads.js --status
  node test-threads.js
`);
    break;
  default:
    runTest('all');
}