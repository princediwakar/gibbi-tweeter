/**
 * Viral NEET Tweet Schedule for Maximum Engagement
 * Optimized for IST timezone and NEET aspirant study patterns
 */


export interface ScheduleSlot {
  hour: number;          // IST hour (0-23)
  personas: string[];    // Array of persona keys for this slot
  priority: 'high' | 'medium' | 'low';
  description: string;
}

export interface DailySchedule {
  generation: ScheduleSlot[];  // When to generate content
  posting: ScheduleSlot[];     // When to post content
}

// Generation Schedule: When to create new content (6 slots daily)
export const GENERATION_SCHEDULE: ScheduleSlot[] = [
  {
    hour: 2,  // 2:00 AM IST - Early morning batch for 7 AM posts
    personas: ['neet_biology'],
    priority: 'high',
    description: 'Morning Biology batch - Start day with confidence boosters'
  },
  {
    hour: 6,  // 6:00 AM IST - Mid-morning batch for 12 PM posts
    personas: ['neet_chemistry'],
    priority: 'medium', 
    description: 'Chemistry batch for lunch break revision'
  },
  {
    hour: 8,  // 8:00 AM IST - Morning batch for 1 PM posts
    personas: ['neet_biology'],
    priority: 'high',
    description: 'Post-breakfast biology concepts'
  },
  {
    hour: 10, // 10:00 AM IST - Late morning batch for 4 PM posts
    personas: ['neet_physics'],
    priority: 'medium',
    description: 'Physics challenges for afternoon reinforcement'
  },
  {
    hour: 17, // 5:00 PM IST - Evening batch for 8 PM prime time
    personas: ['neet_biology'],
    priority: 'high',
    description: 'Prime time biology content for intensive study'
  },
  {
    hour: 20, // 8:00 PM IST - Night batch for 10 PM posts
    personas: ['neet_biology'],
    priority: 'high',
    description: 'Night revision biology challenges'
  }
];

// Posting Schedule: When to publish content (peak engagement times)
export const POSTING_SCHEDULE: ScheduleSlot[] = [
  {
    hour: 7,   // 7:00 AM IST - Early morning motivation
    personas: ['neet_biology'],
    priority: 'high',
    description: 'Morning motivation and confidence boosters'
  },
  {
    hour: 12,  // 12:00 PM IST - Lunch break learning
    personas: ['neet_chemistry'],
    priority: 'medium',
    description: 'Quick chemistry revision during coaching break'
  },
  {
    hour: 13,  // 1:00 PM IST - Post-lunch engagement
    personas: ['neet_biology'],
    priority: 'high',
    description: 'Afternoon biology challenges'
  },
  {
    hour: 16,  // 4:00 PM IST - Post-coaching session
    personas: ['neet_physics'],
    priority: 'medium',
    description: 'Reinforce physics concepts learned in coaching'
  },
  {
    hour: 18,  // 6:00 PM IST - Evening study prep
    personas: ['neet_chemistry'],
    priority: 'medium',
    description: 'Chemistry concepts for evening study preparation'
  },
  {
    hour: 20,  // 8:00 PM IST - Prime time engagement
    personas: ['neet_biology'],
    priority: 'high',
    description: 'Peak engagement hour - biology focus for medical aspirants'
  },
  {
    hour: 22,  // 10:00 PM IST - Night revision
    personas: ['neet_biology'],
    priority: 'high',
    description: 'End day with challenging concepts for night owls'
  }
];

/**
 * Get personas scheduled for generation at specific hour
 */
export function getGenerationPersonasForHour(hour: number): string[] {
  const slot = GENERATION_SCHEDULE.find(s => s.hour === hour);
  return slot ? slot.personas : [];
}

/**
 * Get personas scheduled for posting at specific hour  
 */
export function getPostingPersonasForHour(hour: number): string[] {
  const slot = POSTING_SCHEDULE.find(s => s.hour === hour);
  return slot ? slot.personas : [];
}

/**
 * Check if current hour is a high priority time slot
 */
export function isHighPriorityHour(hour: number, type: 'generation' | 'posting'): boolean {
  const schedule = type === 'generation' ? GENERATION_SCHEDULE : POSTING_SCHEDULE;
  const slot = schedule.find(s => s.hour === hour);
  return slot ? slot.priority === 'high' : false;
}

/**
 * Get next scheduled generation time
 */
export function getNextGenerationTime(currentHour: number): { hour: number; personas: string[]; description: string } {
  // Find next generation slot after current hour
  const nextSlot = GENERATION_SCHEDULE
    .sort((a, b) => a.hour - b.hour)
    .find(slot => slot.hour > currentHour) || GENERATION_SCHEDULE[0]; // Wrap to next day
    
  return {
    hour: nextSlot.hour,
    personas: nextSlot.personas,
    description: nextSlot.description
  };
}

/**
 * Get next scheduled posting time
 */
export function getNextPostingTime(currentHour: number): { hour: number; personas: string[]; description: string } {
  const nextSlot = POSTING_SCHEDULE
    .sort((a, b) => a.hour - b.hour)
    .find(slot => slot.hour > currentHour) || POSTING_SCHEDULE[0];
    
  return {
    hour: nextSlot.hour,
    personas: nextSlot.personas,
    description: nextSlot.description
  };
}

/**
 * Calculate optimal persona distribution based on NEET weightings
 * Biology: 60%, Chemistry: 20%, Physics: 20%
 */
export function getOptimalPersonaDistribution(totalTweets: number): { [key: string]: number } {
  return {
    neet_biology: Math.floor(totalTweets * 0.6),   // 60% - highest NEET weightage
    neet_chemistry: Math.floor(totalTweets * 0.2), // 20% - moderate weightage  
    neet_physics: Math.floor(totalTweets * 0.2)    // 20% - moderate weightage
  };
}

/**
 * Get peak engagement hours (IST) for maximum viral potential
 */
export function getPeakEngagementHours(): number[] {
  return [7, 13, 20, 22]; // Morning motivation, afternoon break, prime time, night revision
}

/**
 * Check if current time is within peak viral hours
 */
export function isPeakViralTime(hour: number): boolean {
  return getPeakEngagementHours().includes(hour);
}

/**
 * Get content type recommendations based on time of day
 */
export function getContentTypeForHour(hour: number): string {
  if (hour >= 6 && hour <= 9) return 'motivation';      // Morning motivation
  if (hour >= 10 && hour <= 15) return 'challenge';     // Daytime challenges  
  if (hour >= 16 && hour <= 18) return 'quick_tip';     // Evening tips
  if (hour >= 19 && hour <= 22) return 'competitive';   // Prime time competition
  return 'trap';                                         // Night traps and complex concepts
}

export const DAILY_SCHEDULE: DailySchedule = {
  generation: GENERATION_SCHEDULE,
  posting: POSTING_SCHEDULE
};

export default DAILY_SCHEDULE;