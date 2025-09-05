require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkDatabase() {
  try {
    console.log('Checking existing database structure...');
    
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Existing tables:', tables.rows.map(r => r.table_name));
    
    // If tweets table exists, check its columns
    const tweetsExists = tables.rows.some(r => r.table_name === 'tweets');
    if (tweetsExists) {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'tweets' AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      console.log('Tweets table columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
    
    // Check if accounts table exists
    const accountsExists = tables.rows.some(r => r.table_name === 'accounts');
    console.log('Accounts table exists:', accountsExists);
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkDatabase();