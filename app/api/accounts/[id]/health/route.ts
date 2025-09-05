import { NextRequest, NextResponse } from 'next/server';
import { accountService } from '@/lib/accountService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const health = await accountService.getAccountHealth(id);

    if (!health.account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      account: {
        id: health.account.id,
        name: health.account.name,
        twitter_handle: health.account.twitter_handle,
        status: health.account.status
      },
      health: {
        isHealthy: health.isHealthy,
        twitterConnectionValid: health.twitterConnectionValid,
        error: health.error
      }
    });
  } catch (error) {
    console.error('Error checking account health:', error);
    return NextResponse.json(
      { error: 'Failed to check account health' },
      { status: 500 }
    );
  }
}