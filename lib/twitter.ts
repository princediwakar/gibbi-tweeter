// Simple Twitter API implementation using fetch and OAuth 1.0a
import crypto from 'crypto';

interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
}

// Legacy function removed - now using per-account credentials

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
  const oauthParams: Record<string, string> = {
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

export async function postTweet(content: string, credentials: TwitterCredentials, retryCount = 0): Promise<{ data: { id: string; text: string } }> {
  const maxRetries = 3;
  const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

  try {
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
      let errorObj;
      
      try {
        errorObj = JSON.parse(errorText);
      } catch {
        errorObj = { title: 'Unknown error', detail: errorText };
      }

      // Handle specific Twitter API errors
      if (response.status === 403) {
        if (errorText.includes('oauth1 app permissions')) {
          throw new Error(`🚫 PERMISSION ERROR: Your Twitter app needs "Read and Write" permissions. Please:
1. Visit https://developer.x.com/en/portal/dashboard
2. Select your app
3. Navigate to Settings > User authentication settings  
4. Enable "Read and Write" permissions
5. Regenerate your Access Token and Secret
6. Update your .env.local file with the new tokens

Current error: ${errorObj.detail || errorText}`);
        }
        throw new Error(`🚫 FORBIDDEN: ${errorObj.detail || errorText}`);
      }

      if (response.status === 429) {
        throw new Error(`⏰ RATE LIMIT: Too many requests. Please wait before trying again.`);
      }

      if (response.status === 401) {
        throw new Error(`🔐 UNAUTHORIZED: Invalid credentials or expired tokens. Please check your Twitter API keys.`);
      }

      // Retry on server errors (5xx)
      if (response.status >= 500 && retryCount < maxRetries) {
        console.warn(`⚠️ Server error (${response.status}), retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return postTweet(content, credentials, retryCount + 1);
      }

      throw new Error(`Twitter API error: ${response.status} ${response.statusText} - ${errorObj.detail || errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Tweet posted successfully to X/Twitter!');
    console.log(`📝 Content: ${content}`);
    console.log(`🆔 Tweet ID: ${result.data.id}`);
    console.log(`📊 Length: ${content.length} characters`);
    console.log(`🔗 URL: https://x.com/user/status/${result.data.id}`);
    
    return {
      data: {
        id: result.data.id,
        text: content
      }
    };
  } catch (error) {
    // Don't retry on client errors (4xx) except specific cases
    if (error instanceof Error && error.message.includes('PERMISSION ERROR')) {
      console.error('❌ Permission Error:', error.message);
      throw error;
    }

    if (retryCount < maxRetries && !(error instanceof Error)) {
      console.warn(`⚠️ Unexpected error, retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return postTweet(content, credentials, retryCount + 1);
    }

    console.error('❌ Error posting tweet:', error);
    throw error;
  }
}

export async function postToTwitter(content: string, hashtags: string[], credentials: TwitterCredentials): Promise<{ data: { id: string; text: string } }> {
  // Combine content and hashtags if hashtags aren't already in content
  const hasHashtagsInContent = hashtags.some(hashtag => content.includes(hashtag));
  const tweetText = hasHashtagsInContent 
    ? content 
    : `${content}${hashtags.length > 0 ? ' ' + hashtags.join(' ') : ''}`;

  return postTweet(tweetText, credentials);
}

export async function validateTwitterCredentials(credentials: TwitterCredentials): Promise<{ valid: boolean; userInfo?: { username: string; name: string; id: string } }> {
  try {
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
      return { valid: false };
    }

    const result = await response.json();
    
    console.log('✅ Twitter credentials validated');
    console.log(`👤 Connected as: @${result.data.username} (${result.data.name})`);
    console.log(`🆔 User ID: ${result.data.id}`);
    
    return {
      valid: true,
      userInfo: {
        username: result.data.username,
        name: result.data.name,
        id: result.data.id
      }
    };
  } catch (error) {
    console.error('❌ Twitter credentials validation failed:', error);
    return { valid: false };
  }
}