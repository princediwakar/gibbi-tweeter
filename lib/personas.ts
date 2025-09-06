/**
 * English Learning Persona System with Comprehensive Topic Coverage
 * Designed for engaging English language learning content generation
 */

// Represents a topic/subcategory in the persona hierarchy
interface PersonaTopic {
  key: string;
  displayName: string;
}

// Defines the structure for personas with detailed topic breakdown
export interface PersonaConfig {
  key: string;
  displayName: string;
  description: string;
  topics: PersonaTopic[];
  prompt_template?: string; // Custom prompt template for this persona
  hashtag_sets?: string[][]; // Different hashtag sets for variety
  content_types?: ('single_tweet' | 'thread')[]; // Supported content types
  thread_templates?: string[]; // Available thread templates for this persona
}

export const VOCABULARY_BUILDER: PersonaConfig = {
  key: 'english_vocab_builder',
  displayName: 'Vocabulary Builder 🏆',
  description: 'Master new words, meanings, and usage in engaging ways',
  topics: [
    // --- Core Vocabulary Skills ---
    { key: 'eng_vocab_word_meaning', displayName: 'What Does This Word Mean? 📖' },
    { key: 'eng_vocab_fill_blanks', displayName: 'Fill in the Blank! ✍️' },
    { key: 'eng_spelling_bee', displayName: 'Can You Spell It? 🐝' },
    { key: 'eng_vocab_word_forms', displayName: 'Which Word Form Fits? 🔄' },

    // --- Word Relationships ---
    { key: 'eng_vocab_synonyms', displayName: 'Word Twins (Synonyms) 👯' },
    { key: 'eng_vocab_antonyms', displayName: 'Opposites Attract (Antonyms) ↔️' },
    { key: 'eng_vocab_shades_of_meaning', displayName: 'Shades of Meaning (e.g., walk vs. stroll) 🤔' },

    // --- Practical & Contextual Vocabulary ---
    { key: 'eng_vocab_confusing_words', displayName: 'Commonly Confused Words 😵' },
    { key: 'eng_vocab_collocations', displayName: 'Perfect Pairs (Collocations) 🤝' },
    { key: 'eng_vocab_thematic_words', displayName: 'Thematic Vocab (e.g., Business, Travel) ✈️' },
    { key: 'eng_vocab_register', displayName: 'Formal vs. Casual Words 👔/👕' },

    // --- Advanced Vocabulary & Fluency ---
    { key: 'eng_vocab_phrasal_verbs', displayName: 'Phrasal Verbs (get up, put off) 🧩' },
    { key: 'eng_vocab_idioms', displayName: 'Guess the Idiom! 🤯' },
    { key: 'eng_vocab_prefixes_suffixes', displayName: 'Word Origins (Prefixes/Suffixes) ⚛️' },
  ],
};

export const GRAMMAR_MASTER: PersonaConfig = {
  key: 'english_grammar_master',
  displayName: 'Grammar Master 📚',
  description: 'Perfect your grammar rules and sentence construction skills',
  topics: [
    // --- Basic Grammar Foundations ---
    { key: 'eng_grammar_parts_of_speech', displayName: 'Parts of Speech Mastery 🔤' },
    { key: 'eng_grammar_verb_tenses', displayName: 'Tense Perfect (Past, Present, Future) ⏰' },
    { key: 'eng_grammar_subject_verb', displayName: 'Subject-Verb Agreement ✅' },
    { key: 'eng_grammar_articles', displayName: 'Articles (a, an, the) 📝' },

    // --- Sentence Structure ---
    { key: 'eng_grammar_sentence_types', displayName: 'Sentence Types & Structures 🏗️' },
    { key: 'eng_grammar_clauses', displayName: 'Clauses & Complex Sentences 🔗' },
    { key: 'eng_grammar_modifiers', displayName: 'Adjectives & Adverbs Placement 🎯' },
    { key: 'eng_grammar_prepositions', displayName: 'Preposition Precision 📍' },

    // --- Advanced Grammar ---
    { key: 'eng_grammar_conditionals', displayName: 'Conditional Sentences (If/Then) 🤔' },
    { key: 'eng_grammar_passive_active', displayName: 'Active vs. Passive Voice 🔄' },
    { key: 'eng_grammar_reported_speech', displayName: 'Reported Speech & Quotations 💬' },
    { key: 'eng_grammar_punctuation', displayName: 'Punctuation Perfection 🎭' },

    // --- Common Grammar Challenges ---
    { key: 'eng_grammar_common_errors', displayName: 'Fix Common Grammar Mistakes 🚫' },
    { key: 'eng_grammar_confusing_pairs', displayName: 'Who vs. Whom, Its vs. It\'s 🤷' },
    { key: 'eng_grammar_parallel_structure', displayName: 'Parallel Structure & Consistency 📏' },
  ],
};

export const COMMUNICATION_EXPERT: PersonaConfig = {
  key: 'english_communication_expert',
  displayName: 'Communication Expert 🗣️',
  description: 'Enhance speaking, writing, and conversation skills for effective communication',
  topics: [
    // --- Speaking & Pronunciation ---
    { key: 'eng_comm_pronunciation', displayName: 'Pronunciation & Accent Tips 🎤' },
    { key: 'eng_comm_stress_intonation', displayName: 'Word Stress & Intonation 🎵' },
    { key: 'eng_comm_conversation_starters', displayName: 'Conversation Starters & Small Talk 💬' },
    { key: 'eng_comm_expressing_opinions', displayName: 'Expressing Opinions Confidently 💪' },

    // --- Writing Skills ---
    { key: 'eng_comm_writing_structure', displayName: 'Essay & Paragraph Structure 📄' },
    { key: 'eng_comm_business_writing', displayName: 'Business Writing (Emails, Reports) 💼' },
    { key: 'eng_comm_creative_writing', displayName: 'Creative Writing & Storytelling 📖' },
    { key: 'eng_comm_academic_writing', displayName: 'Academic Writing & Research 🎓' },

    // --- Practical Communication ---
    { key: 'eng_comm_presentations', displayName: 'Presentation Skills & Public Speaking 🎯' },
    { key: 'eng_comm_job_interviews', displayName: 'Job Interview Communication 👔' },
    { key: 'eng_comm_networking', displayName: 'Professional Networking Language 🤝' },
    { key: 'eng_comm_cultural_context', displayName: 'Cultural Context & Politeness 🌍' },

    // --- Advanced Communication ---
    { key: 'eng_comm_persuasion', displayName: 'Persuasive Language & Argumentation 🏛️' },
    { key: 'eng_comm_storytelling', displayName: 'Storytelling Techniques 📚' },
    { key: 'eng_comm_body_language', displayName: 'Non-Verbal Communication 🤲' },
    { key: 'eng_comm_conflict_resolution', displayName: 'Diplomatic Language & Conflict Resolution 🕊️' },
  ],
};


// Satirist persona for Prince's account (single tweets only)
export const SATIRIST: PersonaConfig = {
  key: 'satirist',
  displayName: 'Satirist 😏',
  description: 'Witty and satirical observations about current events, politics, business, and social trends',
  content_types: ['single_tweet'],
  topics: [
    { key: 'political_satire', displayName: 'Political News Satire' },
    { key: 'current_events_humor', displayName: 'Current Events Humor' },
    { key: 'business_news_irony', displayName: 'Business News Irony' },
    { key: 'social_trends_comedy', displayName: 'Social Trends Comedy' },
    { key: 'news_absurdity', displayName: 'News Absurdity Commentary' },
    { key: 'media_parody', displayName: 'Media Coverage Parody' },
    { key: 'economic_humor', displayName: 'Economic News Humor' },
    { key: 'celebrity_politics_satire', displayName: 'Celebrity Politics Satire' },
  ],
  hashtag_sets: [
    ['#PoliticalSatire', '#CurrentEvents', '#NewsHumor', '#Satire'],
    ['#IndianPolitics', '#NewsCommentary', '#Reality', '#Truth'],
    ['#BusinessNews', '#NewsSatire', '#MediaHumor', '#Irony'],
    ['#SocialTrends', '#NewsParody', '#Commentary', '#Humor'],
    ['#PoliticalHumor', '#NewsAbsurdity', '#SatiricalNews', '#WittyTakes']
  ]
};

// Business storyteller persona with Indian business story templates
export const BUSINESS_STORYTELLER: PersonaConfig = {
  key: 'business_storyteller',
  displayName: 'Business Storyteller 📈',
  description: 'Compelling Indian business stories with emotional depth and strategic insights',
  content_types: ['thread'],
  thread_templates: [
    'founder_struggle',
    'business_decision', 
    'family_business_dynamics',
    'cross_era_parallel',
    'failure_recovery',
    'market_disruption',
    'succession_story',
    'crisis_leadership',
    'innovation_breakthrough',
    'cultural_adaptation'
  ],
  topics: [
    { key: 'founder_stories', displayName: 'Founder Journey Stories' },
    { key: 'business_decisions', displayName: 'Strategic Business Decisions' },
    { key: 'family_business', displayName: 'Family Business Dynamics' },
    { key: 'market_disruption', displayName: 'Market Disruption Stories' },
    { key: 'crisis_management', displayName: 'Crisis Leadership Stories' },
    { key: 'cultural_business', displayName: 'Cultural Adaptation in Business' },
    { key: 'succession_planning', displayName: 'Business Succession Stories' },
    { key: 'innovation_breakthroughs', displayName: 'Innovation Breakthrough Stories' }
  ],
  hashtag_sets: [
    ['#IndianBusiness', '#Entrepreneurship', '#StartupStories', '#Leadership'],
    ['#BusinessHistory', '#Founders', '#Strategy', '#Innovation'],
    ['#TataGroup', '#Reliance', '#BusinessLessons', '#Success'],
    ['#StartupIndia', '#Jugaad', '#BusinessWisdom', '#Founders'],
    ['#FamilyBusiness', '#Succession', '#Legacy', '#Vision'],
    ['#BusinessDecisions', '#CrisisLeadership', '#MarketDisruption', '#Growth']
  ]
};

// Active personas optimized for current multi-account strategy
export const PERSONAS: PersonaConfig[] = [
  VOCABULARY_BUILDER, 
  GRAMMAR_MASTER, 
  COMMUNICATION_EXPERT,
  SATIRIST,
  BUSINESS_STORYTELLER
] as const;

// Type helpers
export type PersonaKey = typeof PERSONAS[number]['key'];

// Utility functions
export function getPersonaByKey(key: string): PersonaConfig | undefined {
  return PERSONAS.find(p => p.key === key);
}

// Topic selection functions
export function getRandomTopicForPersona(personaKey: string): PersonaTopic | undefined {
  const persona = getPersonaByKey(personaKey);
  if (!persona || persona.topics.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * persona.topics.length);
  return persona.topics[randomIndex];
}

export function getAllTopicsForPersona(personaKey: string): PersonaTopic[] {
  const persona = getPersonaByKey(personaKey);
  return persona ? persona.topics : [];
}

// Content distribution by weight (equal distribution)
export function selectPersonaByWeight(): PersonaConfig {
  const randomIndex = Math.floor(Math.random() * PERSONAS.length);
  return PERSONAS[randomIndex];
}

// Account-to-persona mapping for strict isolation based on Twitter handles
const ACCOUNT_PERSONA_MAPPING: Record<string, string[]> = {
  // Gibbi English Learning Account (@gibbi_ai)
  'gibbi_ai': [
    'english_vocab_builder',
    'english_grammar_master', 
    'english_communication_expert'
  ],
  // Prince Business Account (@princediwakar25)  
  'princediwakar25': [
    'satirist',
    'business_storyteller'
  ]
};

/**
 * Get allowed personas for a specific Twitter handle
 */
export function getAllowedPersonasForHandle(twitterHandle: string): string[] {
  // Remove @ symbol if present and convert to lowercase
  const cleanHandle = twitterHandle.replace('@', '').toLowerCase();
  return ACCOUNT_PERSONA_MAPPING[cleanHandle] || [];
}

/**
 * Get allowed personas for a specific account ID (requires account lookup)
 */
export async function getAllowedPersonasForAccount(accountId: string): Promise<string[]> {
  // Import here to avoid circular dependency
  const { getAccount } = await import('./db');
  
  try {
    const account = await getAccount(accountId);
    if (!account) {
      return [];
    }
    return getAllowedPersonasForHandle(account.twitter_handle);
  } catch (error) {
    console.error(`Failed to get account for ID ${accountId}:`, error);
    return [];
  }
}

/**
 * Check if a persona is allowed for a specific Twitter handle
 */
export function isPersonaAllowedForHandle(personaKey: string, twitterHandle: string): boolean {
  const allowedPersonas = getAllowedPersonasForHandle(twitterHandle);
  return allowedPersonas.includes(personaKey);
}

/**
 * Check if a persona is allowed for a specific account (requires account lookup)
 */
export async function isPersonaAllowedForAccount(personaKey: string, accountId: string): Promise<boolean> {
  const allowedPersonas = await getAllowedPersonasForAccount(accountId);
  return allowedPersonas.includes(personaKey);
}

/**
 * Get random persona from handle's allowed personas
 */
export function getRandomPersonaForHandle(twitterHandle: string, personaKeys?: string[]): PersonaConfig {
  const allowedPersonas = getAllowedPersonasForHandle(twitterHandle);
  
  if (allowedPersonas.length === 0) {
    throw new Error(`No personas allowed for handle: ${twitterHandle}`);
  }
  
  // If specific persona keys requested, filter by allowed personas
  let eligiblePersonas = allowedPersonas;
  if (personaKeys && personaKeys.length > 0) {
    eligiblePersonas = personaKeys.filter(key => allowedPersonas.includes(key));
  }
  
  if (eligiblePersonas.length === 0) {
    // Fall back to any allowed persona for this handle
    eligiblePersonas = allowedPersonas;
  }
  
  const randomKey = eligiblePersonas[Math.floor(Math.random() * eligiblePersonas.length)];
  const persona = getPersonaByKey(randomKey);
  
  if (!persona) {
    throw new Error(`Persona not found: ${randomKey}`);
  }
  
  return persona;
}

/**
 * Get random persona from account's allowed personas (requires account lookup)
 */
export async function getRandomPersonaForAccount(accountId: string, personaKeys?: string[]): Promise<PersonaConfig> {
  // Import here to avoid circular dependency
  const { getAccount } = await import('./db');
  
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error(`Account not found: ${accountId}`);
  }
  
  return getRandomPersonaForHandle(account.twitter_handle, personaKeys);
}


export function getHashtagsForPersona(persona: PersonaConfig, variation = 0): string[] {
  if (!persona.hashtag_sets || persona.hashtag_sets.length === 0) {
    // Generate default hashtags for active personas
    const defaultHashtags: Record<string, string[]> = {
      english_vocab_builder: ['#EnglishLearning', '#Vocabulary', '#WordPower', '#Learning'],
      english_grammar_master: ['#EnglishGrammar', '#Grammar', '#Writing', '#Learning'],
      english_communication_expert: ['#Communication', '#Speaking', '#English', '#Skills'],
      satirist: ['#StartupLife', '#TechHumor', '#BusinessReality', '#Satire'],
      business_storyteller: ['#IndianBusiness', '#Entrepreneurship', '#StartupStories', '#Leadership']
    };
    
    return defaultHashtags[persona.key] || ['#Content', '#Learning', '#Growth', '#Tips'];
  }
  
  const setIndex = variation % persona.hashtag_sets.length;
  return persona.hashtag_sets[setIndex];
}


/**
 * Get all available personas for any account (account-agnostic)
 */
export function getAllPersonas(): PersonaConfig[] {
  return PERSONAS;
}

// Legacy compatibility export
export const personas = PERSONAS.map(p => ({
  id: p.key,
  name: p.displayName,
  emoji: p.displayName.includes('🏆') ? '🏆' : p.displayName.includes('📚') ? '📚' : '🗣️',
  description: p.description,
}));

export default PERSONAS;