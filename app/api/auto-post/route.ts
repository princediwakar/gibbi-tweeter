import { NextRequest, NextResponse } from 'next/server';
import { getReadyTweetsByAccount, saveTweet } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getCurrentTimeInIST } from '@/lib/utils';
import { 
  getScheduledPersonasForPosting, 
  getScheduledAccountIds,
  isPostingScheduled 
} from '@/lib/schedule';
import { accountService } from '@/lib/accountService';
// Removed TwitterApi import due to initialization issues with Turbopack
// Using manual Twitter API implementation for now
import { postTweet } from '@/lib/twitter';

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nowIST = getCurrentTimeInIST();
    const currentHourIST = nowIST.getHours();
    const dayOfWeek = nowIST.getDay();
    
    logger.info(`🔍 Multi-account posting check at ${currentHourIST}:00 IST (Day: ${dayOfWeek})`, 'auto-post');

    // Get all available account IDs with schedules
    const scheduledAccountIds = getScheduledAccountIds();
    
    if (scheduledAccountIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: `⚠️ No accounts configured with posting schedules`,
        scheduledPersonas: [],
        currentHour: currentHourIST,
        accountsProcessed: 0,
        totalPosted: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Check which accounts have posting scheduled for current time
    const activeScheduledAccounts: string[] = [];
    const allScheduledPersonas: string[] = [];

    for (const accountId of scheduledAccountIds) {
      if (isPostingScheduled(accountId, nowIST)) {
        activeScheduledAccounts.push(accountId);
        const personas = getScheduledPersonasForPosting(accountId, dayOfWeek, currentHourIST);
        allScheduledPersonas.push(...personas);
      }
    }

    if (activeScheduledAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: `⏳ No accounts scheduled for posting at ${currentHourIST}:00 IST`,
        scheduledPersonas: [],
        currentHour: currentHourIST,
        accountsProcessed: 0,
        totalPosted: 0,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`📋 Accounts scheduled for posting: ${activeScheduledAccounts.join(', ')}`, 'auto-post');
    logger.info(`📋 Personas scheduled for posting: ${allScheduledPersonas.join(', ')}`, 'auto-post');

    // Get all active accounts
    const accounts = await accountService.getAllAccounts();
    logger.info(`👥 Processing ${accounts.length} active accounts`, 'auto-post');
    
    const accountResults = [];
    let totalPosted = 0;
    let totalErrors = 0;

    // Process each account separately
    for (const account of accounts) {
      try {
        logger.info(`🏢 Processing account: ${account.name} (@${account.twitter_handle})`, 'auto-post');
        
        // Skip accounts not scheduled for posting at this time
        if (!activeScheduledAccounts.includes(account.id)) {
          logger.info(`⏭️ Account ${account.name} not scheduled for posting at this time`, 'auto-post');
          continue;
        }
        
        // Get ready tweets for this account
        const readyTweets = await getReadyTweetsByAccount(account.id);
        
        // Get scheduled personas for this specific account
        const accountScheduledPersonas = getScheduledPersonasForPosting(account.id, dayOfWeek, currentHourIST);
        
        // Filter tweets by scheduled personas for this account
        const scheduledTweets = readyTweets.filter(tweet =>
          accountScheduledPersonas.includes(tweet.persona)
        );

        logger.info(`📝 Found ${scheduledTweets.length} scheduled tweets for ${account.name}`, 'auto-post');

        let accountPosted = 0;
        const accountErrors: string[] = [];

        // Create Twitter credentials for this account
        const twitterCredentials = {
          apiKey: account.twitter_api_key,
          apiSecret: account.twitter_api_secret,
          accessToken: account.twitter_access_token,
          accessSecret: account.twitter_access_token_secret,
        };

        // Post tweets for this account
        for (const tweet of scheduledTweets) {
          try {
            logger.info(`📤 ${account.name}: Posting tweet: ${tweet.content.substring(0, 50)}...`, 'auto-post');
            
            // Combine content with hashtags
            const fullContent = tweet.hashtags?.length > 0 
              ? `${tweet.content}\n\n${tweet.hashtags.join(' ')}`
              : tweet.content;
            
            const result = await postTweet(fullContent, twitterCredentials);
            
            // Update tweet status
            const updatedTweet = {
              ...tweet,
              status: 'posted' as const,
              postedAt: new Date().toISOString(),
              twitterId: result.data.id,
              twitterUrl: `https://x.com/${account.twitter_handle}/status/${result.data.id}`,
              posted_at: new Date().toISOString(),
              twitter_id: result.data.id,
              twitter_url: `https://x.com/${account.twitter_handle}/status/${result.data.id}`
            };
            
            await saveTweet(updatedTweet);
            accountPosted++;
            totalPosted++;
            
            logger.info(`✅ ${account.name}: Posted tweet ${tweet.id} - Twitter ID: ${result.data.id}`, 'auto-post');
            
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ ${account.name}: Failed to post tweet ${tweet.id}: ${errorMsg}`, 'auto-post', error as Error);
            
            // Mark tweet as failed
            const failedTweet = {
              ...tweet,
              status: 'failed' as const,
              errorMessage: errorMsg,
              error_message: errorMsg
            };
            await saveTweet(failedTweet);
            
            accountErrors.push(`Tweet ${tweet.id}: ${errorMsg}`);
            totalErrors++;
          }
        }

        accountResults.push({
          account: {
            id: account.id,
            name: account.name,
            twitter_handle: account.twitter_handle
          },
          found: scheduledTweets.length,
          posted: accountPosted,
          errors: accountErrors.length,
          errorDetails: accountErrors
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`❌ Failed to process account ${account.name}: ${errorMsg}`, 'auto-post', error as Error);
        
        accountResults.push({
          account: {
            id: account.id,
            name: account.name,
            twitter_handle: account.twitter_handle
          },
          found: 0,
          posted: 0,
          errors: 1,
          errorDetails: [`Account processing failed: ${errorMsg}`]
        });
        totalErrors++;
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      currentTime: `${nowIST.getHours()}:${nowIST.getMinutes().toString().padStart(2, '0')} IST`,
      scheduledPersonas: allScheduledPersonas,
      accountsProcessed: accounts.length,
      totalPosted,
      totalErrors,
      accountResults,
      message: totalPosted > 0 
        ? `🚀 Posted ${totalPosted} tweets across ${accounts.length} accounts!`
        : accounts.length > 0
          ? `⏳ No tweets ready to post from ${accounts.length} accounts at this time`
          : '👥 No active accounts found',
    };

    logger.info(`📊 Multi-account posting summary: ${totalPosted} posted, ${totalErrors} errors across ${accounts.length} accounts`, 'auto-post');
    
    return NextResponse.json(response);

  } catch (error) {
    logger.error('Multi-account posting failed', 'auto-post', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process multi-account posting',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST method for manual triggering or specific account processing
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { account_id, process_all_accounts = false } = body;

    if (account_id) {
      // Process specific account
      const accountHealth = await accountService.getAccountHealth(account_id);
      if (!accountHealth.isHealthy) {
        return NextResponse.json({ 
          error: `Account ${account_id} is not healthy: ${accountHealth.error}` 
        }, { status: 400 });
      }

      const nowIST = getCurrentTimeInIST();
      const currentHourIST = nowIST.getHours();
      const dayOfWeek = nowIST.getDay();
      
      logger.info(`🎯 Single account posting check for ${account_id} at ${currentHourIST}:00 IST (Day: ${dayOfWeek})`, 'auto-post');

      // Check if posting is scheduled for this account at current time
      if (!isPostingScheduled(account_id, nowIST)) {
        return NextResponse.json({
          success: true,
          message: `⏳ No posting scheduled for account ${account_id} at ${currentHourIST}:00 IST`,
          account_id,
          currentHour: currentHourIST,
          posted: 0,
          timestamp: new Date().toISOString()
        });
      }

      // Get the account details
      const accounts = await accountService.getAllAccounts();
      const account = accounts.find(a => a.id === account_id);
      
      if (!account) {
        return NextResponse.json({
          error: `Account ${account_id} not found in processable accounts`
        }, { status: 404 });
      }

      // Get ready tweets for this account
      const readyTweets = await getReadyTweetsByAccount(account_id);
      
      // Get scheduled personas for this specific account
      const accountScheduledPersonas = getScheduledPersonasForPosting(account_id, dayOfWeek, currentHourIST);
      
      // Filter tweets by scheduled personas for this account
      const scheduledTweets = readyTweets.filter(tweet =>
        accountScheduledPersonas.includes(tweet.persona)
      );

      logger.info(`📝 Found ${scheduledTweets.length} scheduled tweets for account ${account_id}`, 'auto-post');

      if (scheduledTweets.length === 0) {
        return NextResponse.json({
          success: true,
          message: `⏳ No tweets ready for scheduled personas in account ${account_id}`,
          account_id,
          scheduledPersonas: accountScheduledPersonas,
          currentHour: currentHourIST,
          posted: 0,
          timestamp: new Date().toISOString()
        });
      }

      let posted = 0;
      const errors: string[] = [];

      // Create Twitter credentials for this account
      const twitterCredentials = {
        apiKey: account.twitter_api_key,
        apiSecret: account.twitter_api_secret,
        accessToken: account.twitter_access_token,
        accessSecret: account.twitter_access_token_secret,
      };

      // Post tweets for this account
      for (const tweet of scheduledTweets) {
        try {
          logger.info(`📤 ${account.name}: Posting tweet: ${tweet.content.substring(0, 50)}...`, 'auto-post');
          
          // Combine content with hashtags
          const fullContent = tweet.hashtags?.length > 0 
            ? `${tweet.content}\n\n${tweet.hashtags.join(' ')}`
            : tweet.content;
          
          const result = await postTweet(fullContent, twitterCredentials);
          
          // Update tweet status
          const updatedTweet = {
            ...tweet,
            status: 'posted' as const,
            postedAt: new Date().toISOString(),
            twitterId: result.data.id,
            twitterUrl: `https://x.com/${account.twitter_handle}/status/${result.data.id}`,
            posted_at: new Date().toISOString(),
            twitter_id: result.data.id,
            twitter_url: `https://x.com/${account.twitter_handle}/status/${result.data.id}`
          };
          
          await saveTweet(updatedTweet);
          posted++;
          
          logger.info(`✅ ${account.name}: Posted tweet ${tweet.id} - Twitter ID: ${result.data.id}`, 'auto-post');
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error(`❌ ${account.name}: Failed to post tweet ${tweet.id}: ${errorMsg}`, 'auto-post', error as Error);
          
          // Mark tweet as failed
          const failedTweet = {
            ...tweet,
            status: 'failed' as const,
            errorMessage: errorMsg,
            error_message: errorMsg
          };
          await saveTweet(failedTweet);
          
          errors.push(`Tweet ${tweet.id}: ${errorMsg}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: posted > 0 
          ? `🚀 Posted ${posted} tweets for account ${account_id}!`
          : `⏳ No tweets were posted for account ${account_id}`,
        account_id,
        account_name: account.name,
        twitter_handle: account.twitter_handle,
        scheduledPersonas: accountScheduledPersonas,
        found: scheduledTweets.length,
        posted,
        errors: errors.length,
        errorDetails: errors,
        currentHour: currentHourIST,
        timestamp: new Date().toISOString()
      });

    } else if (process_all_accounts) {
      // Redirect to GET method logic for processing all accounts
      return GET(request);
    } else {
      return NextResponse.json({ 
        error: 'Either account_id or process_all_accounts must be specified' 
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Manual multi-account posting failed', 'auto-post', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process manual posting request',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
