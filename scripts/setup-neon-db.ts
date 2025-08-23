#!/usr/bin/env tsx

import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { promises as fs } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

async function setupDatabase() {
  try {
    console.log('🔧 Setting up Neon database schema...');
    
    // Read the SQL schema file
    const schemaPath = join(process.cwd(), 'lib', 'neon-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement, filtering out comments
    const statements = schema.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--')); // Filter out empty statements and comments
    
    for (const statement of statements) {
      // Remove inline comments and clean up
      const cleanStatement = statement
        .split('\n')
        .map(line => line.split('--')[0].trim()) // Remove inline comments
        .filter(line => line) // Remove empty lines
        .join('\n')
        .trim();
        
      if (cleanStatement) {
        console.log(`Executing: ${cleanStatement.substring(0, 50)}...`);
        await sql.query(cleanStatement);
      }
    }
    
    console.log('✅ Database schema created successfully!');
    
    // Test the connection by querying the table
    const result = await sql`SELECT COUNT(*) as count FROM tweets`;
    console.log(`📊 Current tweet count: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();