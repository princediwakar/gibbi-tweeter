#!/usr/bin/env tsx

import { config } from 'dotenv';
import { getAllTweets } from '../lib/neon-db';

// Load environment variables
config({ path: '.env.local' });

async function testDatabase() {
  try {
    console.log('🔍 Fetching all tweets from Neon database...');
    
    const tweets = await getAllTweets();
    console.log(`📊 Found ${tweets.length} tweets in database:`);
    
    for (const tweet of tweets) {
      console.log(`\n📝 Tweet ID: ${tweet.id}`);
      console.log(`   Content: ${tweet.content.substring(0, 80)}...`);
      console.log(`   Persona: ${tweet.persona}`);
      console.log(`   Status: ${tweet.status}`);
      console.log(`   Created: ${tweet.created_at}`);
      console.log(`   Posted At: ${tweet.posted_at || 'Not posted'}`);
      console.log(`   Hashtags: ${tweet.hashtags.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
  }
}

testDatabase();