/**
 * Enhanced Multi-Account Tweet Scheduling System
 * Inspired by the YouTube system's sophisticated scheduling approach
 * Each account has its own independent schedule with specific persona assignments and timing strategies.
 */

interface HourlySchedule {
  [hour: number]: string[];
}

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday
type DailySchedule = Record<number, HourlySchedule>;

interface AccountSchedules {
  generation: DailySchedule;
  posting: DailySchedule;
  metadata: {
    strategy: string;
    target_audience: string;
    timezone_optimization: string;
    daily_post_target: number;
    generation_batches_per_day: number;
  };
}

/**
 * Gibbi English Learning Account Schedules
 * Focus: Global English learners across time zones
 */
const gibbiGenerationPattern: HourlySchedule = {
  2: ['english_communication_expert'],  // Early morning generation
  6: ['english_vocab_builder'],         // Mid-morning generation
  8: ['english_grammar_master'],        // Morning generation
  10: ['english_vocab_builder'],        // Late morning generation
  17: ['english_communication_expert'], // Evening generation
  20: ['english_grammar_master'],       // Night generation
};

const gibbiPostingPattern: HourlySchedule = {
  7: ['english_communication_expert'],   // Morning motivation
  12: ['english_vocab_builder'],         // Lunch break learning
  13: ['english_grammar_master'],        // Post-lunch engagement
  16: ['english_vocab_builder'],         // Post-work session
  18: ['english_communication_expert'],  // Evening study prep
  20: ['english_grammar_master'],        // Prime time engagement
  22: ['english_vocab_builder'],         // Night revision
};

/**
 * Prince Professional Account Schedules
 * Focus: Entrepreneurs and tech professionals during business hours
 */
const princeGenerationPattern: HourlySchedule = {
  5: ['product_insights'],              // Early professional generation
  9: ['startup_content'],               // Business hours start
  14: ['tech_commentary'],              // Post-lunch professional
  19: ['product_insights'],             // Evening professional content
};

const princePostingPattern: HourlySchedule = {
  8: ['product_insights'],              // Morning professional audience
  11: ['startup_content'],              // Mid-morning business
  15: ['tech_commentary'],              // Afternoon professional
  19: ['product_insights'],             // Evening professional peak
  21: ['tech_commentary'],              // Late evening insights
};

// Account ID mapping - maps database UUIDs to schedule keys
const ACCOUNT_ID_MAPPING: Record<string, string> = {
  'bc1165c3-aa53-492c-83c2-d0fc68753f0f': 'gibbi_account',  // @gibbiai
  'b36846db-08f1-4d1d-88ec-bd01ca964774': 'prince_account', // @princediwakar25
};

// Reverse mapping - from schedule keys to database UUIDs
const SCHEDULE_KEY_TO_ID: Record<string, string> = {
  'gibbi_account': 'bc1165c3-aa53-492c-83c2-d0fc68753f0f',
  'prince_account': 'b36846db-08f1-4d1d-88ec-bd01ca964774',
};

/**
 * Map database account ID to schedule key
 */
function getScheduleKey(accountId: string): string | undefined {
  return ACCOUNT_ID_MAPPING[accountId];
}

// Enhanced account-specific schedules with metadata and strategy information
const ACCOUNT_SCHEDULES: Record<string, AccountSchedules> = {
  gibbi_account: {
    generation: {
      0: gibbiGenerationPattern, // Sunday
      1: gibbiGenerationPattern, // Monday
      2: gibbiGenerationPattern, // Tuesday
      3: gibbiGenerationPattern, // Wednesday
      4: gibbiGenerationPattern, // Thursday
      5: gibbiGenerationPattern, // Friday
      6: gibbiGenerationPattern, // Saturday
    },
    posting: {
      0: gibbiPostingPattern, // Sunday
      1: gibbiPostingPattern, // Monday
      2: gibbiPostingPattern, // Tuesday
      3: gibbiPostingPattern, // Wednesday
      4: gibbiPostingPattern, // Thursday
      5: gibbiPostingPattern, // Friday
      6: gibbiPostingPattern, // Saturday
    },
    metadata: {
      strategy: 'Global English learners with consistent educational content across timezones',
      target_audience: 'English language learners worldwide (A2-C1 level)',
      timezone_optimization: 'Multiple timezone coverage for global reach',
      daily_post_target: 7,
      generation_batches_per_day: 6
    }
  },

  prince_account: {
    generation: {
      0: princeGenerationPattern, // Sunday
      1: princeGenerationPattern, // Monday
      2: princeGenerationPattern, // Tuesday
      3: princeGenerationPattern, // Wednesday
      4: princeGenerationPattern, // Thursday
      5: princeGenerationPattern, // Friday
      6: princeGenerationPattern, // Saturday
    },
    posting: {
      0: princePostingPattern, // Sunday
      1: princePostingPattern, // Monday
      2: princePostingPattern, // Tuesday
      3: princePostingPattern, // Wednesday
      4: princePostingPattern, // Thursday
      5: princePostingPattern, // Friday
      6: princePostingPattern, // Saturday
    },
    metadata: {
      strategy: 'Professional content targeting entrepreneurs and tech professionals during business hours',
      target_audience: 'Entrepreneurs, product managers, developers (25-45 age group)',
      timezone_optimization: 'Business hours optimization for professional engagement',
      daily_post_target: 5,
      generation_batches_per_day: 4
    }
  }
};

/**
 * Get generation schedule for a specific account
 */
export function getGenerationSchedule(accountId: string): DailySchedule {
  const scheduleKey = getScheduleKey(accountId);
  if (!scheduleKey) {
    throw new Error(`No schedule mapping found for account: ${accountId}`);
  }
  
  const schedules = ACCOUNT_SCHEDULES[scheduleKey];
  if (!schedules) {
    throw new Error(`No generation schedule found for account: ${accountId} (scheduleKey: ${scheduleKey})`);
  }
  return schedules.generation;
}

/**
 * Get posting schedule for a specific account
 */
export function getPostingSchedule(accountId: string): DailySchedule {
  const scheduleKey = getScheduleKey(accountId);
  if (!scheduleKey) {
    throw new Error(`No schedule mapping found for account: ${accountId}`);
  }
  
  const schedules = ACCOUNT_SCHEDULES[scheduleKey];
  if (!schedules) {
    throw new Error(`No posting schedule found for account: ${accountId} (scheduleKey: ${scheduleKey})`);
  }
  return schedules.posting;
}

/**
 * Get personas scheduled for generation at a specific time for an account
 */
export function getScheduledPersonasForGeneration(
  accountId: string,
  dayOfWeek: number,
  hour: number
): string[] {
  const schedule = getGenerationSchedule(accountId);
  const daySchedule = schedule[dayOfWeek];
  return daySchedule?.[hour] || [];
}

/**
 * Get personas scheduled for posting at a specific time for an account
 */
export function getScheduledPersonasForPosting(
  accountId: string,
  dayOfWeek: number,
  hour: number
): string[] {
  const schedule = getPostingSchedule(accountId);
  const daySchedule = schedule[dayOfWeek];
  return daySchedule?.[hour] || [];
}

/**
 * Check if generation is scheduled for an account at current time
 */
export function isGenerationScheduled(accountId: string, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const personas = getScheduledPersonasForGeneration(accountId, dayOfWeek, hour);
  return personas.length > 0;
}

/**
 * Check if posting is scheduled for an account at current time
 */
export function isPostingScheduled(accountId: string, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const personas = getScheduledPersonasForPosting(accountId, dayOfWeek, hour);
  return personas.length > 0;
}

/**
 * Get all available account IDs with schedules
 */
export function getScheduledAccountIds(): string[] {
  return Object.values(SCHEDULE_KEY_TO_ID);
}

/**
 * Get account metadata for scheduling strategy insights
 */
export function getAccountMetadata(accountId: string): AccountSchedules['metadata'] | null {
  const scheduleKey = getScheduleKey(accountId);
  if (!scheduleKey) {
    return null;
  }
  
  const schedules = ACCOUNT_SCHEDULES[scheduleKey];
  return schedules ? schedules.metadata : null;
}

/**
 * Get current scheduled activity for all accounts (for monitoring/debugging)
 */
export function getCurrentScheduledActivity(date: Date = new Date()): {
  accountId: string;
  metadata: AccountSchedules['metadata'];
  generation_personas: string[];
  posting_personas: string[];
}[] {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  
  return getScheduledAccountIds().map(accountId => {
    const generationPersonas = getScheduledPersonasForGeneration(accountId, dayOfWeek, hour);
    const postingPersonas = getScheduledPersonasForPosting(accountId, dayOfWeek, hour);
    const metadata = getAccountMetadata(accountId)!;
    
    return {
      accountId,
      metadata,
      generation_personas: generationPersonas,
      posting_personas: postingPersonas
    };
  });
}

/**
 * Check if an account should generate content at current time with batch size information
 * Inspired by YouTube system's intelligent batch management
 */
export function getGenerationBatchInfo(accountId: string, date: Date = new Date()): {
  should_generate: boolean;
  personas: string[];
  batch_size: number;
  account_strategy: string;
} {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const personas = getScheduledPersonasForGeneration(accountId, dayOfWeek, hour);
  const metadata = getAccountMetadata(accountId);
  
  // Default batch size based on account type and scheduled personas
  let batchSize = 2; // Default
  if (metadata) {
    // Educational accounts (like Gibbi) generate more content per batch
    if (accountId.includes('gibbi') || metadata.target_audience.includes('learners')) {
      batchSize = 3;
    }
    // Professional accounts generate focused content
    else if (metadata.target_audience.includes('entrepreneurs') || metadata.target_audience.includes('professionals')) {
      batchSize = 2;
    }
  }
  
  return {
    should_generate: personas.length > 0,
    personas,
    batch_size: batchSize,
    account_strategy: metadata?.strategy || 'Unknown strategy'
  };
}

/**
 * Get posting eligibility with intelligent rate limiting
 * Inspired by YouTube system's account-aware posting logic
 */
export function getPostingEligibility(accountId: string, date: Date = new Date()): {
  should_post: boolean;
  personas: string[];
  max_posts_this_hour: number;
  account_strategy: string;
} {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  const personas = getScheduledPersonasForPosting(accountId, dayOfWeek, hour);
  const metadata = getAccountMetadata(accountId);
  
  // Intelligent posting limits based on account strategy
  let maxPostsThisHour = 1; // Conservative default
  if (metadata) {
    // Educational accounts can post more frequently during peak learning times
    if (accountId.includes('gibbi')) {
      // Peak learning hours (7-9, 12-14, 18-22)
      if ((hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 22)) {
        maxPostsThisHour = 2;
      }
    }
    // Professional accounts focus on business hours
    else if (metadata.target_audience.includes('professionals')) {
      // Business hours (8-18)
      if (hour >= 8 && hour <= 18) {
        maxPostsThisHour = 1;
      }
    }
  }
  
  return {
    should_post: personas.length > 0,
    personas,
    max_posts_this_hour: maxPostsThisHour,
    account_strategy: metadata?.strategy || 'Unknown strategy'
  };
}

/**
 * Advanced scheduling insights for monitoring and optimization
 */
export function getSchedulingInsights(): {
  total_accounts: number;
  accounts_with_metadata: number;
  daily_targets: Record<string, number>;
  generation_strategies: Record<string, string>;
  current_activity_summary: string;
} {
  const accountIds = getScheduledAccountIds();
  const now = new Date();
  const currentActivity = getCurrentScheduledActivity(now);
  
  const dailyTargets: Record<string, number> = {};
  const generationStrategies: Record<string, string> = {};
  
  accountIds.forEach(accountId => {
    const metadata = getAccountMetadata(accountId);
    if (metadata) {
      dailyTargets[accountId] = metadata.daily_post_target;
      generationStrategies[accountId] = metadata.strategy;
    }
  });
  
  const activeAccounts = currentActivity.filter(
    a => a.generation_personas.length > 0 || a.posting_personas.length > 0
  );
  
  return {
    total_accounts: accountIds.length,
    accounts_with_metadata: Object.keys(dailyTargets).length,
    daily_targets: dailyTargets,
    generation_strategies: generationStrategies,
    current_activity_summary: `${activeAccounts.length} accounts active at ${now.getHours()}:00`
  };
}

// Export types
export type { HourlySchedule, DailySchedule, AccountSchedules };