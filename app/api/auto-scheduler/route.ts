import { NextResponse } from 'next/server';
import { autoScheduler } from '@/lib/auto-scheduler';

export async function GET() {
  try {
    const stats = autoScheduler.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get auto-scheduler status:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        await autoScheduler.start();
        return NextResponse.json({ 
          message: 'Auto-scheduler started successfully',
          stats: autoScheduler.getStats()
        });

      case 'stop':
        await autoScheduler.stop();
        return NextResponse.json({ 
          message: 'Auto-scheduler stopped successfully',
          stats: autoScheduler.getStats()
        });

      case 'status':
        const status = autoScheduler.getStatus();
        return NextResponse.json(status);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auto-scheduler API error:', error);
    return NextResponse.json({ 
      error: 'Auto-scheduler operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}