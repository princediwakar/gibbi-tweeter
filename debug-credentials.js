#!/usr/bin/env node

/**
 * Debug script to check Twitter credentials for Prince's account
 */

const BASE_URL = 'http://localhost:3000';

async function debugCredentials() {
  console.log('🔐 Debugging Twitter credentials for Prince\'s account\n');
  
  try {
    // Get Prince's account details directly from the API
    const accountsResponse = await fetch(`${BASE_URL}/api/accounts`);
    const accountsData = await accountsResponse.json();
    
    const princeAccount = accountsData.accounts.find(acc => 
      acc.twitter_handle?.includes('princediwakar25')
    );
    
    if (!princeAccount) {
      console.log('❌ Prince account not found');
      return;
    }
    
    console.log('📋 Account Details:');
    console.log(`  Name: ${princeAccount.name}`);
    console.log(`  Handle: ${princeAccount.twitter_handle}`);
    console.log(`  ID: ${princeAccount.id}`);
    console.log(`  Status: ${princeAccount.status}`);
    console.log(`  Credentials configured: ${princeAccount.credentials_configured}`);
    console.log();
    
    // Direct SQL check via a debug endpoint
    console.log('🔍 Direct database credential check:');
    
    const debugUrl = `${BASE_URL}/api/debug/credentials?account_id=${princeAccount.id}`;
    console.log(`Making request to: ${debugUrl}`);
    
    try {
      const credResponse = await fetch(debugUrl);
      const credData = await credResponse.json();
      
      if (credResponse.ok) {
        console.log('✅ Credentials retrieved successfully:');
        console.log(`  API Key: ${credData.credentials.apiKey ? `${credData.credentials.apiKey.substring(0, 10)}...` : 'NULL'}`);
        console.log(`  API Secret: ${credData.credentials.apiSecret ? `${credData.credentials.apiSecret.substring(0, 10)}...` : 'NULL'}`);
        console.log(`  Access Token: ${credData.credentials.accessToken ? `${credData.credentials.accessToken.substring(0, 15)}...` : 'NULL'}`);
        console.log(`  Access Secret: ${credData.credentials.accessSecret ? `${credData.credentials.accessSecret.substring(0, 10)}...` : 'NULL'}`);
      } else {
        console.log(`❌ Debug endpoint failed: ${credData.error || 'Unknown error'}`);
      }
    } catch (debugError) {
      console.log('❌ Debug endpoint not available (expected for first run)');
      console.log('   This means we need to create a debug endpoint');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugCredentials();