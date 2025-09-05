import { NextRequest, NextResponse } from 'next/server';
import { 
  getReadyTweetsByAccount, 
  saveTweet, 
  getActiveThreadForPosting,
  getReadyThreads,
  updateThreadAfterPosting,
  getThreadTweet,
  getLastPostedTweetInThread,
  getAccountByTwitterHandle
} from '@/lib/db';
import { logger } from '@/lib/logger';
import { getCurrentTimeInIST } from '@/lib/utils';
import { 
  getScheduledPersonasForPosting, 
  getScheduledAccountIds,
  isPostingScheduled 
} from '@/lib/schedule';
import { accountService } from '@/lib/accountService';
import { postTweet, postReplyTweet } from '@/lib/twitter';

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

// Enhanced POST method with 5-minute threading support
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json().catch(() => ({}));
    
    const nowIST = getCurrentTimeInIST();
    const currentHourIST = nowIST.getHours();
    const dayOfWeek = nowIST.getDay();
    
    logger.info(`🧵 5-minute threading system check at ${nowIST.getHours()}:${nowIST.getMinutes().toString().padStart(2, '0')} IST`, 'auto-post');

    // Handle specific account filtering
    let scheduledAccountIds = getScheduledAccountIds();
    
    // Filter by account_id if provided
    if (requestBody.account_id) {
      scheduledAccountIds = scheduledAccountIds.filter(id => id === requestBody.account_id);
      logger.info(`🎯 Filtering to specific account_id: ${requestBody.account_id}`, 'auto-post');
    }
    
    // Filter by twitter_handle if provided
    if (requestBody.twitter_handle) {
      const account = await getAccountByTwitterHandle(requestBody.twitter_handle);
      if (!account) {
        return NextResponse.json({ 
          error: `Account not found for Twitter handle: ${requestBody.twitter_handle}` 
        }, { status: 404 });
      }
      scheduledAccountIds = [account.id];
      logger.info(`🎯 Filtering to Twitter handle: ${requestBody.twitter_handle} (${account.id})`, 'auto-post');
    }
    
    if (scheduledAccountIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: `⚠️ No accounts configured with posting schedules`,
        accountsProcessed: 0,
        totalPosted: 0,
        threadsProgressed: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Get filtered accounts based on scheduledAccountIds
    const allAccounts = await accountService.getAllAccounts();
    const accounts = allAccounts.filter(account => scheduledAccountIds.includes(account.id));
    
    let totalPosted = 0;
    let totalErrors = 0;
    let threadsProgressed = 0;
    const accountResults = [];

    // Process each account with threading priority system
    for (const account of accounts) {
      try {
        logger.info(`🏢 Processing account: ${account.name} (@${account.twitter_handle})`, 'auto-post');
        
        let accountPosted = 0;
        const accountErrors: string[] = [];

        // Create Twitter credentials for this account
        const twitterCredentials = {
          apiKey: account.twitter_api_key,
          apiSecret: account.twitter_api_secret,
          accessToken: account.twitter_access_token,
          accessSecret: account.twitter_access_token_secret,
        };

        // PRIORITY 1: Active thread progression (highest priority)
        const activeThread = await getActiveThreadForPosting(account.id);
        const now = new Date(); // Get current time for comparison
        if (activeThread && (!activeThread.next_post_time || new Date(activeThread.next_post_time) <= now)) { // Check if it's time to post next tweet
          try {
            logger.info(`🧵 ${account.name}: Continuing active thread "${activeThread.title}" (${activeThread.current_tweet}/${activeThread.total_tweets})`, 'auto-post');
            
            // Get the next tweet in the thread
            const nextTweet = await getThreadTweet(activeThread.id, activeThread.current_tweet);
            if (!nextTweet) {
              logger.error(`❌ ${account.name}: Could not find tweet ${activeThread.current_tweet} in thread ${activeThread.id}`, 'auto-post');
              continue;
            }

            // Get the previous tweet for reply chain
            const previousTweet = await getLastPostedTweetInThread(activeThread.id);
            
            // Format content with thread indicator
            const threadContent = `${nextTweet.content}\n\n${activeThread.current_tweet}/${activeThread.total_tweets} 🧵`;
            const fullContent = nextTweet.hashtags?.length > 0 
              ? `${threadContent}\n\n${nextTweet.hashtags.join(' ')}`
              : threadContent;

            let result;
            
            if (previousTweet?.twitter_id) {
              // Post as reply to create thread chain
              result = await postReplyTweet(fullContent, previousTweet.twitter_id, twitterCredentials);
            } else {
              // First tweet in thread - post normally
              result = await postTweet(fullContent, twitterCredentials);
            }

            // Update tweet status
            const updatedTweet = {
              ...nextTweet,
              status: 'posted' as const,
              posted_at: new Date().toISOString(),
              twitter_id: result.data.id,
              twitter_url: `https://x.com/${account.twitter_handle}/status/${result.data.id}`,
              parent_twitter_id: previousTweet?.twitter_id || null
            };
            
            await saveTweet(updatedTweet);

            // Update thread progress
            const isLastTweet = activeThread.current_tweet >= activeThread.total_tweets;
            await updateThreadAfterPosting(activeThread.id, result.data.id, isLastTweet);

            accountPosted++;
            totalPosted++;
            threadsProgressed++;
            
            const statusMsg = isLastTweet ? 'Thread completed!' : `Thread progressed (${activeThread.current_tweet + 1}/${activeThread.total_tweets})`;
            logger.info(`✅ ${account.name}: ${statusMsg} - Twitter ID: ${result.data.id}`, 'auto-post');
            
            // Continue to next account after processing active thread
            continue;
            
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.error(`❌ ${account.name}: Failed to progress thread ${activeThread.id}: ${errorMsg}`, 'auto-post', error as Error);
            accountErrors.push(`Thread ${activeThread.id}: ${errorMsg}`);
            totalErrors++;
          }
        }

        // PRIORITY 2: Start new content (only during posting schedule)
        const debugMode = process.env.DEBUG_MODE === 'true';
        if (debugMode || isPostingScheduled(account.id, nowIST)) {
          // Get scheduled personas for this specific account
          const accountScheduledPersonas = debugMode ? ['tech_commentary', 'business_storyteller', 'satirist'] : getScheduledPersonasForPosting(account.id, dayOfWeek, currentHourIST); // Bypass persona filter in debug mode
          
          // Check for ready threads to start
          const readyThreads = await getReadyThreads(account.id);
          const scheduledThreads = readyThreads.filter(thread =>
            accountScheduledPersonas.includes(thread.persona)
          );

          if (scheduledThreads.length > 0) {
            try {
              const threadToStart = scheduledThreads[0]; // Start oldest ready thread
              logger.info(`🧵 ${account.name}: Starting new thread "${threadToStart.title}"`, 'auto-post');
              
              // Get the first tweet in the thread
              const firstTweet = await getThreadTweet(threadToStart.id, 1);
              if (!firstTweet) {
                logger.error(`❌ ${account.name}: Could not find first tweet in thread ${threadToStart.id}`, 'auto-post');
              } else {
                // Format content with thread indicator
                const threadContent = `${firstTweet.content}\n\n1/${threadToStart.total_tweets} 🧵`;
                const fullContent = firstTweet.hashtags?.length > 0 
                  ? `${threadContent}\n\n${firstTweet.hashtags.join(' ')}`
                  : threadContent;

                const result = await postTweet(fullContent, twitterCredentials);
                
                // Update tweet status
                const updatedTweet = {
                  ...firstTweet,
                  status: 'posted' as const,
                  posted_at: new Date().toISOString(),
                  twitter_id: result.data.id,
                  twitter_url: `https://x.com/${account.twitter_handle}/status/${result.data.id}`
                };
                
                await saveTweet(updatedTweet);

                // Start thread posting (sets status to 'posting' and schedules next tweet)
                await updateThreadAfterPosting(threadToStart.id, result.data.id, false);
                
                accountPosted++;
                totalPosted++;
                threadsProgressed++;
                
                logger.info(`✅ ${account.name}: Started thread "${threadToStart.title}" - Twitter ID: ${result.data.id}`, 'auto-post');
              }
              
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              logger.error(`❌ ${account.name}: Failed to start thread: ${errorMsg}`, 'auto-post', error as Error);
              accountErrors.push(`Thread start: ${errorMsg}`);
              totalErrors++;
            }
          }

          // Fall back to single tweets if no threads are ready
          if (scheduledThreads.length === 0) {
            const readyTweets = await getReadyTweetsByAccount(account.id);
            const scheduledTweets = readyTweets.filter(tweet =>
              (debugMode || accountScheduledPersonas.includes(tweet.persona)) && tweet.content_type === 'single_tweet' // Bypass persona filter in debug mode
            );

            if (scheduledTweets.length > 0) {
              const tweet = scheduledTweets[0]; // Post oldest ready single tweet
              
              try {
                logger.info(`📤 ${account.name}: Posting single tweet: ${tweet.content.substring(0, 50)}...`, 'auto-post');
                
                // Combine content with hashtags
                const fullContent = tweet.hashtags?.length > 0 
                  ? `${tweet.content}\n\n${tweet.hashtags.join(' ')}`
                  : tweet.content;
                
                const result = await postTweet(fullContent, twitterCredentials);
                
                // Update tweet status
                const updatedTweet = {
                  ...tweet,
                  status: 'posted' as const,
                  posted_at: new Date().toISOString(),
                  twitter_id: result.data.id,
                  twitter_url: `https://x.com/${account.twitter_handle}/status/${result.data.id}`
                };
                
                await saveTweet(updatedTweet);
                accountPosted++;
                totalPosted++;
                
                logger.info(`✅ ${account.name}: Posted single tweet ${tweet.id} - Twitter ID: ${result.data.id}`, 'auto-post');
                
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger.error(`❌ ${account.name}: Failed to post single tweet ${tweet.id}: ${errorMsg}`, 'auto-post', error as Error);
                
                // Mark tweet as failed
                const failedTweet = {
                  ...tweet,
                  status: 'failed' as const,
                  error_message: errorMsg
                };
                logger.info(`Attempting to save failed tweet status to DB for tweet ${tweet.id}`, 'auto-post');
                await saveTweet(failedTweet);
                
                accountErrors.push(`Tweet ${tweet.id}: ${errorMsg}`);
                totalErrors++;
              }
            }
          }
        } else {
          logger.info(`⏭️ ${account.name}: No posting scheduled at this time`, 'auto-post');
        }

        accountResults.push({
          account: {
            id: account.id,
            name: account.name,
            twitter_handle: account.twitter_handle
          },
          posted: accountPosted,
          errors: accountErrors.length,
          errorDetails: accountErrors,
          hasActiveThread: !!activeThread,
          threadTitle: activeThread?.title
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
          posted: 0,
          errors: 1,
          errorDetails: [`Account processing failed: ${errorMsg}`],
          hasActiveThread: false
        });
        totalErrors++;
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      currentTime: `${nowIST.getHours()}:${nowIST.getMinutes().toString().padStart(2, '0')} IST`,
      accountsProcessed: accounts.length,
      totalPosted,
      totalErrors,
      threadsProgressed,
      accountResults,
      message: totalPosted > 0 
        ? `🚀 Posted ${totalPosted} tweets (${threadsProgressed} thread progressions) across ${accounts.length} accounts!`
        : accounts.length > 0
          ? `⏳ No content ready to post from ${accounts.length} accounts at this time`
          : '👥 No active accounts found',
    };

    logger.info(`📊 5-minute threading system summary: ${totalPosted} posted (${threadsProgressed} threads), ${totalErrors} errors across ${accounts.length} accounts`, 'auto-post');
    
    return NextResponse.json(response);

  } catch (error) {
    logger.error('5-minute threading system failed', 'auto-post', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process threading system',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
