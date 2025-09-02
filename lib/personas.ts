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

export const PERSONAS: PersonaConfig[] = [VOCABULARY_BUILDER, GRAMMAR_MASTER, COMMUNICATION_EXPERT] as const;

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

// For legacy compatibility (with key mapping)
export const personas = PERSONAS.map(p => ({
  id: p.key,
  name: p.displayName,
  emoji: p.displayName.includes('🏆') ? '🏆' : p.displayName.includes('📚') ? '📚' : '🗣️',
  description: p.description,
}));

export default PERSONAS;