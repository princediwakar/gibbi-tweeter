#!/usr/bin/env tsx

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';

// Load environment variables
config({ path: '.env.local' });

async function createTable() {
  try {
    console.log('🔧 Creating tweets table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS tweets (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        hashtags JSONB DEFAULT '[]',
        persona TEXT NOT NULL,
        scheduled_for TIMESTAMPTZ,
        posted_at TIMESTAMPTZ,
        twitter_id TEXT,
        twitter_url TEXT,
        error_message TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        quality_score JSONB
      )
    `;
    
    console.log('✅ Tweets table created successfully!');
    
    // Test the connection
    const result = await sql`SELECT COUNT(*) as count FROM tweets`;
    console.log(`📊 Current tweet count: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();