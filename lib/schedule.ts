/**
 * English Learning Tweet Schedule for Maximum Engagement
 * Optimized for IST timezone and English learner patterns
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
    personas: ['english_communication_expert'],
    description: 'Morning Communication batch - Start day with confidence boosters'
  },
  {
    hour: 6,  // 6:00 AM IST - Mid-morning batch for 12 PM posts
    personas: ['english_vocab_builder'],
    description: 'Vocabulary batch for lunch break learning'
  },
  {
    hour: 8,  // 8:00 AM IST - Morning batch for 1 PM posts
    personas: ['english_grammar_master'],
    description: 'Post-breakfast grammar concepts'
  },
  {
    hour: 10, // 10:00 AM IST - Late morning batch for 4 PM posts
    personas: ['english_vocab_builder'],
    description: 'Vocabulary challenges for afternoon learning'
  },
  {
    hour: 17, // 5:00 PM IST - Evening batch for 8 PM prime time
    personas: ['english_communication_expert'],
    description: 'Prime time communication content for evening practice'
  },
  {
    hour: 20, // 8:00 PM IST - Night batch for 10 PM posts
    personas: ['english_grammar_master'], 
    description: 'Night revision grammar challenges'
  }
];

// Posting Schedule: When to publish content (peak engagement times)
export const POSTING_SCHEDULE: ScheduleSlot[] = [
  {
    hour: 7,   // 7:00 AM IST - Early morning motivation
    personas: ['english_communication_expert'],
    description: 'Morning motivation and confidence boosters'
  },
  {
    hour: 12,  // 12:00 PM IST - Lunch break learning
    personas: ['english_vocab_builder'],
    description: 'Quick vocabulary learning during lunch break'
  },
  {
    hour: 13,  // 1:00 PM IST - Post-lunch engagement
    personas: ['english_grammar_master'],
    description: 'Afternoon grammar challenges'
  },
  {
    hour: 16,  // 4:00 PM IST - Post-work session
    personas: ['english_vocab_builder'],
    description: 'Reinforce vocabulary concepts learned during the day'
  },
  {
    hour: 18,  // 6:00 PM IST - Evening study prep
    personas: ['english_communication_expert'],
    description: 'Communication skills for evening practice preparation'
  },
  {
    hour: 20,  // 8:00 PM IST - Prime time engagement
    personas: ['english_grammar_master'],
    description: 'Peak engagement hour - grammar focus for serious learners'
  },
  {
    hour: 22,  // 10:00 PM IST - Night revision
    personas: ['english_vocab_builder'],
    description: 'End day with challenging vocabulary for night owls'
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
  if (hour >= 6 && hour <= 9) return 'practical_application';  // Morning - real-world usage
  if (hour >= 10 && hour <= 15) return 'concept_clarification'; // Daytime - clear explanations
  if (hour >= 16 && hour <= 18) return 'memory_aid';           // Evening - learning aids  
  if (hour >= 19 && hour <= 22) return 'explanation';          // Prime time - detailed teaching
  return 'common_mistake';                                      // Night - error correction
}

export const DAILY_SCHEDULE: DailySchedule = {
  generation: GENERATION_SCHEDULE,
  posting: POSTING_SCHEDULE
};

export default DAILY_SCHEDULE;