import { NextRequest, NextResponse } from 'next/server';
import { logWithTimezone, getCurrentTimeInET } from '@/lib/datetime';

export async function GET() {
  try {
    logWithTimezone('🧪 Testing cron functionality...');
    
    const now = getCurrentTimeInET();
    
    // Test both endpoints
    const results = {
      timestamp: now.toISOString(),
      currentET: now.toLocaleString(),
      environment: process.env.NODE_ENV,
      cronSecret: process.env.CRON_SECRET ? 'Present' : 'Missing',
      tests: {
        dailyTweets: '/api/cron/daily-tweets',
        postTweet: '/api/cron/post-tweet'
      }
    };

    logWithTimezone('✅ Cron test completed');
    
    return NextResponse.json({
      success: true,
      message: 'Cron test endpoint working',
      results
    });

  } catch (error) {
    logWithTimezone('❌ Cron test failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Cron test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint, secret } = await request.json();
    
    logWithTimezone(`🧪 Testing cron endpoint: ${endpoint}`);
    
    // Simulate cron authorization header
    const headers = {
      'Authorization': `Bearer ${secret || process.env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    };
    
    const baseUrl = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const testUrl = `${protocol}://${baseUrl}${endpoint}`;
    
    logWithTimezone(`📡 Making request to: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    
    logWithTimezone(`📋 Response status: ${response.status}`);
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      endpoint: testUrl,
      result
    });

  } catch (error) {
    logWithTimezone('❌ Manual cron test failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Manual cron test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}