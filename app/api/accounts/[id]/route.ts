import { NextRequest, NextResponse } from 'next/server';
import { getAccount } from '@/lib/db';
import { accountService, Account } from '@/lib/accountService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await getAccount(id);
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Don't expose sensitive credentials
    const safeAccount = {
      id: account.id,
      name: account.name,
      twitter_handle: account.twitter_handle,
      status: account.status,
      created_at: account.created_at,
      updated_at: account.updated_at
    };

    return NextResponse.json({ account: safeAccount });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, twitter_handle, twitter_api_key, twitter_api_secret, twitter_access_token, twitter_access_token_secret, status } = body;

    // Check if account exists
    const existingAccount = await getAccount(id);
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Prepare updates object
    const updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>> = {};
    if (name !== undefined) updates.name = name;
    if (twitter_handle !== undefined) updates.twitter_handle = twitter_handle;
    if (twitter_api_key !== undefined) updates.twitter_api_key = twitter_api_key;
    if (twitter_api_secret !== undefined) updates.twitter_api_secret = twitter_api_secret;
    if (twitter_access_token !== undefined) updates.twitter_access_token = twitter_access_token;
    if (twitter_access_token_secret !== undefined) updates.twitter_access_token_secret = twitter_access_token_secret;
    if (status !== undefined) updates.status = status;

    // Update account with optional credential validation
    await accountService.updateAccount(id, updates);

    return NextResponse.json({
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if account exists
    const existingAccount = await getAccount(id);
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    await accountService.deleteAccount(id);

    return NextResponse.json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}