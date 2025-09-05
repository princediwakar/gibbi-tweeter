require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkAccounts() {
  try {
    console.log('Checking accounts table...');
    
    const accounts = await sql`SELECT * FROM accounts`;
    console.log('Accounts found:', accounts.rows.length);
    
    accounts.rows.forEach((account, index) => {
      console.log(`\nAccount ${index + 1}:`);
      console.log('  ID:', account.id);
      console.log('  Name:', account.name);
      console.log('  Handle:', account.twitter_handle);
      console.log('  Status:', account.status);
      console.log('  API Key encrypted:', account.twitter_api_key ? 'Yes' : 'No');
      console.log('  API Key value:', account.twitter_api_key ? account.twitter_api_key.substring(0, 20) + '...' : 'null');
    });
    
  } catch (error) {
    console.error('❌ Error checking accounts:', error.message);
  }
}

checkAccounts();