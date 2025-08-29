/**
 * Viral NEET Tweet Schedule for Maximum Engagement
 * Optimized for IST timezone and NEET aspirant study patterns
 */


export interface ScheduleSlot {
  hour: number;          // IST hour (0-23)
  personas: string[];    // Array of persona keys for this slot
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
    
    description: 'Morning Biology batch - Start day with confidence boosters'
  },
  {
    hour: 6,  // 6:00 AM IST - Mid-morning batch for 12 PM posts
    personas: ['neet_chemistry'],
    description: 'Chemistry batch for lunch break revision'
  },
  {
    hour: 8,  // 8:00 AM IST - Morning batch for 1 PM posts
    personas: ['neet_biology'],
    
    description: 'Post-breakfast biology concepts'
  },
  {
    hour: 10, // 10:00 AM IST - Late morning batch for 4 PM posts
    personas: ['neet_physics'],
    description: 'Physics challenges for afternoon reinforcement'
  },
  {
    hour: 17, // 5:00 PM IST - Evening batch for 8 PM prime time
    personas: ['neet_biology'],
    description: 'Prime time biology content for intensive study'
  },
  {
    hour: 20, // 8:00 PM IST - Night batch for 10 PM posts
    personas: ['neet_biology'], 
    description: 'Night revision biology challenges'
  }
];

// Posting Schedule: When to publish content (peak engagement times)
export const POSTING_SCHEDULE: ScheduleSlot[] = [
  {
    hour: 7,   // 7:00 AM IST - Early morning motivation
    personas: ['neet_biology'],
    
    description: 'Morning motivation and confidence boosters'
  },
  {
    hour: 12,  // 12:00 PM IST - Lunch break learning
    personas: ['neet_chemistry'],
    description: 'Quick chemistry revision during coaching break'
  },
  {
    hour: 13,  // 1:00 PM IST - Post-lunch engagement
    personas: ['neet_biology'],
    
    description: 'Afternoon biology challenges'
  },
  {
    hour: 16,  // 4:00 PM IST - Post-coaching session
    personas: ['neet_physics'],
    description: 'Reinforce physics concepts learned in coaching'
  },
  {
    hour: 18,  // 6:00 PM IST - Evening study prep
    personas: ['neet_chemistry'],
    description: 'Chemistry concepts for evening study preparation'
  },
  {
    hour: 20,  // 8:00 PM IST - Prime time engagement
    personas: ['neet_biology'],
    
    description: 'Peak engagement hour - biology focus for medical aspirants'
  },
  {
    hour: 22,  // 10:00 PM IST - Night revision
    personas: ['neet_biology'],
    
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
 * Get content type recommendations based on time of day
 */
export function getContentTypeForHour(hour: number): string {
  if (hour >= 6 && hour <= 9) return 'practical_application';  // Morning - real-world connections
  if (hour >= 10 && hour <= 15) return 'concept_clarification'; // Daytime - clear explanations
  if (hour >= 16 && hour <= 18) return 'memory_aid';           // Evening - study aids  
  if (hour >= 19 && hour <= 22) return 'explanation';          // Prime time - detailed teaching
  return 'common_mistake';                                      // Night - error correction
}

export const DAILY_SCHEDULE: DailySchedule = {
  generation: GENERATION_SCHEDULE,
  posting: POSTING_SCHEDULE
};

export default DAILY_SCHEDULE;