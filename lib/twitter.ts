// Simple Twitter API implementation using fetch and OAuth 1.0a
import crypto from 'crypto';

interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

function getCredentials(): TwitterCredentials {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    throw new Error('Twitter API credentials are missing');
  }

  return { apiKey, apiSecret, accessToken, accessSecret };
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  credentials: TwitterCredentials
): string {
  // Create base string
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  
  // Create signing key
  const signingKey = `${encodeURIComponent(credentials.apiSecret)}&${encodeURIComponent(credentials.accessSecret)}`;
  
  // Generate signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');
    
  return signature;
}

function createOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string> = {},
  credentials: TwitterCredentials
): string {
  const oauthParams = {
    oauth_consumer_key: credentials.apiKey,
    oauth_token: credentials.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
    ...params
  };

  const signature = generateOAuthSignature(method, url, oauthParams, credentials);
  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return authHeader;
}

export async function postTweet(content: string): Promise<{ data: { id: string; text: string } }> {
  try {
    const credentials = getCredentials();
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    
    const authHeader = createOAuthHeader(method, url, {}, credentials);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Tweet posted successfully to X/Twitter!');
    console.log(`📝 Content: ${content}`);
    console.log(`🆔 Tweet ID: ${result.data.id}`);
    console.log(`📊 Length: ${content.length} characters`);
    console.log(`🔗 URL: https://twitter.com/user/status/${result.data.id}`);
    
    return {
      data: {
        id: result.data.id,
        text: content
      }
    };
  } catch (error) {
    console.error('❌ Error posting tweet:', error);
    throw error;
  }
}

export async function validateTwitterCredentials(): Promise<boolean> {
  try {
    const credentials = getCredentials();
    const url = 'https://api.twitter.com/2/users/me';
    const method = 'GET';
    
    const authHeader = createOAuthHeader(method, url, {}, credentials);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': authHeader,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Twitter credentials validation failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    
    console.log('✅ Twitter credentials validated');
    console.log(`👤 Connected as: @${result.data.username} (${result.data.name})`);
    console.log(`🆔 User ID: ${result.data.id}`);
    
    return true;
  } catch (error) {
    console.error('❌ Twitter credentials validation failed:', error);
    return false;
  }
}