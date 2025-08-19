import { NextResponse } from 'next/server';
import { startScheduler, stopScheduler, generateAndScheduleTweet } from '@/lib/scheduler';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        startScheduler();
        return NextResponse.json({ message: 'Scheduler started' });
      
      case 'stop':
        stopScheduler();
        return NextResponse.json({ message: 'Scheduler stopped' });
      
      case 'generate':
        const tweet = await generateAndScheduleTweet();
        return NextResponse.json(tweet);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in scheduler API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}