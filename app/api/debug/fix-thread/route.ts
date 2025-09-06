import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const { threadId } = await request.json();
    
    if (!threadId) {
      return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
    }

    // Get current thread status
    const currentStatus = await sql`
      SELECT * FROM threads WHERE id = ${threadId}
    `;
    
    if (currentStatus.rows.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const thread = currentStatus.rows[0];
    console.log('Current thread status:', thread);

    // Fix the thread status to enable progression
    await sql`
      UPDATE threads 
      SET status = 'posting',
          current_tweet = 2,
          next_post_time = NOW(),
          parent_tweet_id = '1964035280418867286'
      WHERE id = ${threadId}
    `;

    // Get updated status
    const updatedStatus = await sql`
      SELECT * FROM threads WHERE id = ${threadId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Thread status fixed',
      before: thread,
      after: updatedStatus.rows[0]
    });

  } catch (error) {
    console.error('Error fixing thread:', error);
    return NextResponse.json({
      error: 'Failed to fix thread status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}