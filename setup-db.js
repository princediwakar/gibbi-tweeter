require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');
const fs = require('fs');

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Read the schema file
    const schemaSQL = fs.readFileSync('./lib/neon-schema.sql', 'utf8');
    
    // Execute the entire schema as one query
    console.log('Executing schema...');
    await sql.query(schemaSQL);
    
    console.log('✅ Database schema setup completed!');
    
    // Test the connection by counting tables
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('accounts', 'tweets')
    `;
    
    console.log('✅ Created tables:', result.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();