import { NextRequest, NextResponse } from 'next/server';
import { generateEnhancedTweet } from '@/lib/generationService';
import { saveTweet, generateTweetId, getTweetsByAccount, getActiveAccounts } from '@/lib/db';
import { getCurrentTimeInIST } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { 
  getGenerationBatchInfo,
  getSchedulingInsights
} from '@/lib/schedule';
import { TweetGenerationConfig } from '@/lib/types';
import { getRandomTopicForPersona, getPersonaByKey } from '@/lib/personas';

// Job tracking removed - using synchronous generation

/**
 * Enhanced Multi-Account Content Generation API
 * Inspired by the YouTube system's sophisticated batch processing and account-specific logic
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const debugMode = searchParams.get('debug') === 'true';
    
    // Include scheduling insights in debug mode
    if (debugMode) {
      const insights = getSchedulingInsights();
      logger.info('Scheduling insights requested', 'generate-debug', insights);
    }
    
    // If account_id is provided, generate for specific account using enhanced logic
    if (accountId) {
      return await generateForAccountEnhanced(accountId, debugMode);
    }
    
    // Otherwise, generate for all active accounts with improved orchestration
    return await generateForAllAccountsEnhanced(debugMode);
    
  } catch (error) {
    logger.error('Enhanced generation failed', 'generate', error as Error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to start enhanced generation',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Enhanced account-specific generation using YouTube system's intelligent batch processing
 */
async function generateForAccountEnhanced(accountId: string, debugMode = false) {
  const nowIST = getCurrentTimeInIST();
  const callId = Math.random().toString(36).substring(2, 8);
  
  logger.info(`[Enhanced:${callId}] Starting generation for account ${accountId}`, 'generate-enhanced');

  // Get enhanced batch information using YouTube-inspired scheduling logic
  const batchInfo = getGenerationBatchInfo(accountId, nowIST);
  
  if (!batchInfo.should_generate) {
    return NextResponse.json({
      success: true,
      message: `⏳ No generation scheduled for account ${accountId} at ${nowIST.getHours()}:00 IST`,
      accountId,
      batchInfo,
      timestamp: new Date().toISOString()
    });
  }

  // Get account details and current pipeline status
  const activeAccounts = await getActiveAccounts();
  const account = activeAccounts.find(a => a.id === accountId);
  if (!account) {
    return NextResponse.json({
      success: false,
      error: `Account ${accountId} not found or inactive`
    }, { status: 404 });
  }

  const accountTweets = await getTweetsByAccount(accountId);
  const pendingTweets = accountTweets.filter(t => t.status !== 'posted' && t.status !== 'failed');
  
  // Enhanced pipeline management - different thresholds per account strategy
  const maxPipelineSize = accountId.includes('gibbi') ? 8 : 5; // Educational accounts can have larger pipeline
  
  if (pendingTweets.length >= maxPipelineSize) {
    return NextResponse.json({
      success: true,
      message: `✅ Account pipeline is healthy with ${pendingTweets.length} tweets. No generation needed.`,
      accountId,
      currentPipeline: pendingTweets.length,
      maxPipeline: maxPipelineSize,
      batchInfo,
      generated: 0,
      timestamp: new Date().toISOString()
    });
  }

  // Enhanced batch generation using the YouTube system's approach
  const targetBatchSize = Math.min(batchInfo.batch_size, maxPipelineSize - pendingTweets.length);
  const generatedTweets = [];
  const errors = [];
  
  logger.info(`[Enhanced:${callId}] Generating batch of ${targetBatchSize} tweets for account ${accountId}`, 'generate-batch');

  for (let i = 0; i < targetBatchSize; i++) {
    try {
      // Intelligent persona selection - rotate through available personas
      const selectedPersonaKey = batchInfo.personas[i % batchInfo.personas.length];
      const persona = getPersonaByKey(selectedPersonaKey);
      
      if (!persona) {
        errors.push(`Persona ${selectedPersonaKey} not found`);
        continue;
      }

      // Enhanced topic selection using persona-specific logic
      const topic = getRandomTopicForPersona(selectedPersonaKey);
      if (!topic) {
        errors.push(`No topics available for persona ${selectedPersonaKey}`);
        continue;
      }

      // Intelligent content type selection based on time and account strategy
      const contentTypes = ['explanation', 'concept_clarification', 'memory_aid', 'practical_application', 'common_mistake', 'analogy'];
      const contentType = contentTypes[(nowIST.getHours() + i) % contentTypes.length];

      const config: TweetGenerationConfig = {
        account_id: accountId,
        persona: selectedPersonaKey,
        topic: topic.key,
        contentType: contentType as TweetGenerationConfig['contentType']
      };

      const generatedTweet = await generateEnhancedTweet(config);
      
      if (!generatedTweet) {
        errors.push(`Failed to generate tweet for persona ${selectedPersonaKey}`);
        continue;
      }

      const tweet = {
        id: generateTweetId(),
        account_id: accountId,
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona: generatedTweet.persona,
        status: 'ready' as const,
        created_at: new Date().toISOString(),
        quality_score: 1,
      };

      await saveTweet(tweet);
      generatedTweets.push({
        persona: selectedPersonaKey,
        topic: topic.displayName,
        contentType,
        length: generatedTweet.content.length
      });

      logger.info(`[Enhanced:${callId}] Generated tweet ${i + 1}/${targetBatchSize} for ${selectedPersonaKey}`, 'generate-success');

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Generation ${i + 1} failed: ${errorMsg}`);
      logger.error(`[Enhanced:${callId}] Generation ${i + 1} failed: ${errorMsg}`, 'generate-error', error as Error);
    }
  }

  const response = {
    success: true,
    message: `✅ Enhanced batch generation complete for account ${accountId}`,
    accountId,
    accountName: account.name,
    strategy: batchInfo.account_strategy,
    generated: generatedTweets.length,
    targetBatchSize,
    currentPipeline: pendingTweets.length + generatedTweets.length,
    maxPipeline: maxPipelineSize,
    batchInfo: debugMode ? batchInfo : undefined,
    generatedTweets: debugMode ? generatedTweets : generatedTweets.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString()
  };

  logger.info(`[Enhanced:${callId}] Batch complete: ${generatedTweets.length}/${targetBatchSize} tweets generated`, 'generate-complete');
  return NextResponse.json(response);
}


/**
 * Enhanced multi-account orchestration inspired by YouTube system's parallel processing
 */
async function generateForAllAccountsEnhanced(debugMode = false) {
  const sessionId = Math.random().toString(36).substring(2, 8);
  const activeAccounts = await getActiveAccounts();
  
  logger.info(`[Session:${sessionId}] Starting enhanced multi-account generation for ${activeAccounts.length} accounts`, 'generate-multi');
  
  if (activeAccounts.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No active accounts found',
      totalAccounts: 0,
      totalGenerated: 0,
      timestamp: new Date().toISOString()
    });
  }

  // Process accounts in parallel for better performance (inspired by YouTube system)
  const accountPromises = activeAccounts.map(async (account) => {
    try {
      const result = await generateForAccountEnhanced(account.id, debugMode);
      const data = await result.json();
      
      return {
        accountId: account.id,
        accountName: account.name,
        success: data.success,
        generated: data.generated || 0,
        strategy: data.strategy || 'Unknown',
        currentPipeline: data.currentPipeline || 0,
        message: data.message || data.error,
        errors: data.errors
      };
      
    } catch (error) {
      logger.error(`[Session:${sessionId}] Failed to process account ${account.id}`, 'generate-multi-error', error as Error);
      return {
        accountId: account.id,
        accountName: account.name,
        success: false,
        generated: 0,
        strategy: 'Unknown',
        currentPipeline: 0,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Wait for all accounts to complete processing
  const results = await Promise.all(accountPromises);
  
  // Aggregate results with enhanced metrics
  const totalGenerated = results.reduce((sum, r) => sum + (r.generated || 0), 0);
  const successfulAccounts = results.filter(r => r.success).length;
  const accountsWithGeneration = results.filter(r => (r.generated || 0) > 0).length;
  
  // Include scheduling insights for monitoring
  const insights = getSchedulingInsights();
  
  const response = {
    success: true,
    message: `Enhanced multi-account generation complete: ${totalGenerated} tweets generated across ${accountsWithGeneration} accounts`,
    sessionId,
    totalAccounts: activeAccounts.length,
    successfulAccounts,
    accountsWithGeneration,
    totalGenerated,
    schedulingInsights: debugMode ? insights : undefined,
    results: debugMode ? results : results.map(r => ({
      accountId: r.accountId,
      accountName: r.accountName,
      success: r.success,
      generated: r.generated,
      strategy: r.strategy
    })),
    timestamp: new Date().toISOString()
  };

  logger.info(`[Session:${sessionId}] Multi-account generation complete: ${totalGenerated} tweets, ${successfulAccounts}/${activeAccounts.length} accounts successful`, 'generate-multi-complete');
  
  return NextResponse.json(response);
}


