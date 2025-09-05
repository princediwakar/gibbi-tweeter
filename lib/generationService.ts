import OpenAI from 'openai';
import { getRandomTopicForPersona, getPersonaByKey, selectPersonaByWeight, getHashtagsForPersona, PersonaConfig } from '@/lib/personas';
import { EnhancedTweet, TweetGenerationConfig, VariationMarkers } from './types';
import { getAccount } from './db';
import type { Account } from './db';
import { getDynamicContext } from './contentSource';

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

/**
 * Generates unique variation markers for content diversity during generation
 */
function generateVariationMarkers(): VariationMarkers {
  const timestamp = Date.now();
  const timeMarker = `T${timestamp}`;
  const tokenMarker = `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  return { 
    time_marker: timeMarker, 
    token_marker: tokenMarker, 
    generation_timestamp: timestamp,
    content_hash: '' // Will be populated after content generation
  };
}

/**
 * Topic-specific guidelines for enhanced content generation
 * Inspired by the YouTube system's comprehensive topic guidelines
 */
const TOPIC_GUIDELINES = {
  // English Learning Categories - Educational Focus
  eng_vocab_word_meaning: {
    focus: 'Essential word definitions with memorable contexts and usage',
    hook: 'Test knowledge of a word that sounds simple but most people misuse',
    scenarios: ['job interviews', 'academic writing', 'professional communication'],
    engagement: 'Challenge viewers to use the word correctly'
  },
  eng_vocab_fill_blanks: {
    focus: 'Context-based vocabulary application and sentence completion',
    hook: 'Present a sentence that stumps even native speakers',
    scenarios: ['writing emails', 'giving presentations', 'casual conversations'],
    engagement: 'Test their sentence completion skills'
  },
  eng_vocab_synonyms: {
    focus: 'Word relationships and precise synonym usage',
    hook: 'Reveal synonym pairs that seem identical but have crucial differences',
    scenarios: ['avoiding repetition', 'upgrading vocabulary', 'expressing nuance'],
    engagement: 'Help them choose the perfect word'
  },
  eng_vocab_antonyms: {
    focus: 'Opposite word relationships and contrasting meanings',
    hook: 'Test antonym knowledge with words that have surprising opposites',
    scenarios: ['debates and arguments', 'creative writing', 'expressing contrast'],
    engagement: 'Challenge their opposite-word knowledge'
  },
  eng_vocab_confusing_words: {
    focus: 'Commonly mixed-up word pairs and how to use them correctly',
    hook: 'Expose the word mistake that makes you sound less intelligent',
    scenarios: ['affect vs effect', 'complement vs compliment', 'principal vs principle'],
    engagement: 'Help them avoid embarrassing mistakes'
  },
  eng_grammar_parts_of_speech: {
    focus: 'Essential grammar foundations with clear examples',
    hook: 'Reveal the grammar rule that 90% of people get wrong',
    scenarios: ['writing professionally', 'academic papers', 'clear communication'],
    engagement: 'Master the grammar that matters most'
  },
  eng_grammar_verb_tenses: {
    focus: 'Tense usage with practical applications',
    hook: 'The tense mistake that changes your entire meaning',
    scenarios: ['telling stories', 'describing experiences', 'making plans'],
    engagement: 'Perfect your tense timing'
  },
  eng_comm_pronunciation: {
    focus: 'Clear pronunciation for confident communication',
    hook: 'The pronunciation mistake that undermines your credibility',
    scenarios: ['presentations', 'job interviews', 'networking events'],
    engagement: 'Sound more professional instantly'
  },
  eng_comm_conversation_starters: {
    focus: 'Natural conversation skills for social confidence',
    hook: 'The conversation starter that never fails',
    scenarios: ['networking events', 'social gatherings', 'professional meetings'],
    engagement: 'Start conversations with confidence'
  },

  // Professional Development Categories
  product_user_research: {
    focus: 'User research insights and practical application methods',
    hook: 'The user research mistake that kills great products',
    scenarios: ['conducting interviews', 'analyzing feedback', 'making decisions'],
    engagement: 'Understand your users better'
  },
  product_feature_decisions: {
    focus: 'Strategic feature development and prioritization',
    hook: 'Why most feature decisions fail and how to fix them',
    scenarios: ['roadmap planning', 'stakeholder alignment', 'resource allocation'],
    engagement: 'Build features that matter'
  },
  startup_validation: {
    focus: 'Idea validation techniques and market research strategies',
    hook: 'The validation step most founders skip (and regret)',
    scenarios: ['idea testing', 'customer discovery', 'pivot decisions'],
    engagement: 'Validate before you build'
  },
  startup_funding: {
    focus: 'Funding strategies and investor relations insights',
    hook: 'What investors really look for (it\'s not what you think)',
    scenarios: ['pitch preparation', 'due diligence', 'negotiation'],
    engagement: 'Get funded faster'
  },
  tech_ai_trends: {
    focus: 'AI developments and practical implications for developers',
    hook: 'The AI trend that will change everything (not ChatGPT)',
    scenarios: ['tool selection', 'skill development', 'career planning'],
    engagement: 'Stay ahead of AI disruption'
  },
  tech_web_development: {
    focus: 'Modern web development practices and emerging technologies',
    hook: 'The web development practice that separates seniors from juniors',
    scenarios: ['architecture decisions', 'performance optimization', 'best practices'],
    engagement: 'Level up your development skills'
  }
};

/**
 * Generates a content hash for duplicate detection
 */
function generateContentHash(tweet: EnhancedTweet): string {
  const contentString = JSON.stringify({
    content: tweet.content,
    hashtags: tweet.hashtags,
    persona: tweet.persona
  });
  
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `CH${Math.abs(hash).toString(36).toUpperCase()}`;
}

/**
 * Generates SEO-optimized hashtags based on persona and topic
 */
function generateOptimizedHashtags(persona: string, categoryDisplayName: string, topicDisplayName: string, personaConfig?: PersonaConfig): string[] {
  // Use persona-specific hashtags if available
  if (personaConfig && personaConfig.hashtag_sets && personaConfig.hashtag_sets.length > 0) {
    return getHashtagsForPersona(personaConfig, 0);
  }
  
  const baseHashtags: Record<string, string[]> = {
    english_vocab_builder: ['#EnglishLearning', '#Vocabulary', '#WordPower', '#EnglishTips'],
    english_grammar_master: ['#EnglishGrammar', '#Grammar', '#EnglishLearning', '#WritingSkills'],
    english_communication_expert: ['#Communication', '#Speaking', '#EnglishSkills', '#Conversation'],
    product_insights: ['#ProductDevelopment', '#UserResearch', '#ProductManagement', '#StartupLife'],
    startup_content: ['#Startup', '#Entrepreneur', '#BuildInPublic', '#StartupLife'],
    tech_commentary: ['#Tech', '#Technology', '#Software', '#Programming']
  };

  const hashtags = [...(baseHashtags[persona] || ['#Content', '#Learning', '#Growth', '#Tips'])];
  
  // Add topic-specific hashtag
  const topicKey = topicDisplayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  if (topicKey.length > 3) {
    hashtags.push(`#${topicKey}`);
  }

  return hashtags.slice(0, 4); // Limit to 4 hashtags
}

/**
 * Determines if RSS sources should be used based on account type
 */
function shouldUseRSSSources(account: Account | null): boolean {
  if (!account) return false;
  
  const handle = account.twitter_handle.toLowerCase();
  const name = account.name.toLowerCase();
  
  // Gibbi accounts (English learning) should NOT use RSS sources - rely on educational content
  if (handle.includes('gibbi') || name.includes('gibbi') || name.includes('english') || name.includes('learning')) {
    return false;
  }
  
  // Prince accounts (personal/professional) should use RSS sources by default
  if (handle.includes('prince') || name.includes('prince') || name.includes('diwakar')) {
    return true;
  }
  
  // Other professional accounts should use RSS sources
  if (name.includes('business') || name.includes('company') || name.includes('brand') || name.includes('professional')) {
    return true;
  }
  
  // Default to RSS sources for non-educational accounts
  return true;
}

/**
 * Generates enhanced tweet prompts using topic guidelines and variation markers
 * Inspired by the YouTube system's sophisticated prompt generation
 */
async function generateEnhancedTweetPrompt(config: TweetGenerationConfig): Promise<{ prompt: string; persona: PersonaConfig; topic: unknown }> {
  const markers = generateVariationMarkers();
  const { time_marker: timeMarker, token_marker: tokenMarker } = markers;
  
  // Get account context if provided
  let account: Account | null = null;
  
  if (config.account_id && config.account_id !== 'fallback') {
    account = await getAccount(config.account_id);
    if (account) {
      console.log(`🎯 Account context: ${account.name} (${account.twitter_handle})`);
    }
  }
  
  // Determine if RSS sources should be used
  const useRSSSources = shouldUseRSSSources(account);
  console.log(`📰 RSS sources ${useRSSSources ? 'enabled' : 'disabled'} for account: ${account?.name || 'unknown'}`);
  
  // Fetch RSS context if RSS sources are enabled
  let rssContext = '';
  if (useRSSSources && config.persona) {
    try {
      // Fetch RSS context for professional personas
      if (['product_insights', 'startup_content', 'tech_commentary'].includes(config.persona)) {
        const topicForRSS = config.topic || 'technology';
        rssContext = await getDynamicContext(config.persona, topicForRSS);
        console.log(`📰 Fetched RSS context for ${config.persona}: ${rssContext.length > 0 ? 'success' : 'no content'}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch RSS context, continuing without it:', error);
    }
  }
  
  // Select persona - completely account-agnostic
  let persona: PersonaConfig | undefined;
  
  if (config.persona) {
    // Use specifically requested persona
    persona = getPersonaByKey(config.persona);
    if (persona) {
      console.log(`✅ Using requested persona: ${persona.displayName}`);
    }
  }
  
  if (!persona) {
    // No specific persona requested or not found - use random selection
    // In the future, this could use account-specific allowed personas from database config
    persona = selectPersonaByWeight();
    console.log(`🎲 Using random persona: ${persona.displayName}`);
  }
    
  if (!persona) {
    throw new Error('Invalid persona specified');
  }

  // Select topic (either specified or random from persona)
  const topic = config.topic 
    ? persona.topics.find(t => t.key === config.topic)
    : getRandomTopicForPersona(persona.key);
    
  if (!topic) {
    throw new Error('No valid topic found for persona');
  }

  const contentType = config.contentType || 'challenge';
  
  let basePrompt = '';
  
  // Get topic guidelines for enhanced prompting
  const topicKey = (topic as { key: string; displayName: string }).key;
  const guidelines = TOPIC_GUIDELINES[topicKey as keyof typeof TOPIC_GUIDELINES];
  
  // Generate prompts based on persona type and account context with enhanced guidelines
  if (persona.key === 'english_vocab_builder') {
    const enhancedGuidelines = guidelines || {
      focus: 'Essential vocabulary building with practical applications',
      hook: 'Present vocabulary that elevates communication skills',
      scenarios: ['professional communication', 'academic writing', 'daily conversations'],
      engagement: 'Help learners use words confidently'
    };

    basePrompt = `You are a viral English education expert creating engaging vocabulary content for Twitter.

TOPIC: "${topic.displayName}" - ${enhancedGuidelines.focus}

VIRAL LEARNING STRATEGY:
• HOOK: ${enhancedGuidelines.hook}
• SCENARIOS: Focus on ${enhancedGuidelines.scenarios?.join(', ')}
• ENGAGEMENT: ${enhancedGuidelines.engagement}

Generate Twitter content that targets intermediate English learners (B1-B2 level) who want to sound more fluent and professional:

CONTENT APPROACH:
• Lead with confidence-building ("Master this and sound fluent!")
• Present vocabulary that elevates communication skills
• Include practical, immediate application opportunities
• Create "aha!" moments that boost learning motivation
• Keep under 240 characters (excluding hashtags)
• Sound like a helpful teacher who makes learning exciting
${!useRSSSources ? '• Focus on timeless educational content - avoid current events' : ''}

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: Practical vocabulary mastery

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'english_grammar_master') {
    const enhancedGuidelines = guidelines || {
      focus: 'Essential grammar rules with clear, practical explanations',
      hook: 'Reveal the grammar rule that most people get wrong',
      scenarios: ['professional writing', 'academic papers', 'clear communication'],
      engagement: 'Master grammar that makes you sound professional'
    };

    basePrompt = `You are a viral English grammar expert creating engaging educational content for Twitter.

TOPIC: "${topic.displayName}" - ${enhancedGuidelines.focus}

VIRAL LEARNING STRATEGY:
• HOOK: ${enhancedGuidelines.hook}
• SCENARIOS: Focus on ${enhancedGuidelines.scenarios?.join(', ')}
• ENGAGEMENT: ${enhancedGuidelines.engagement}

Generate grammar content that helps learners avoid common mistakes and communicate more clearly:

CONTENT APPROACH:
• Start with a common grammar confusion or mistake
• Provide clear explanation with memorable patterns or rules
• Include practical examples that learners can apply immediately
• Explain why this grammar point matters for professional communication
• Keep under 240 characters (excluding hashtags)
• Sound like a patient teacher who makes complex grammar simple
${!useRSSSources ? '• Focus on timeless educational content - avoid current events' : ''}

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: Practical grammar mastery

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'english_communication_expert') {
    const enhancedGuidelines = guidelines || {
      focus: 'Practical communication skills for confident interactions',
      hook: 'The communication technique that transforms conversations',
      scenarios: ['presentations', 'job interviews', 'networking events'],
      engagement: 'Communicate with confidence and clarity'
    };

    basePrompt = `You are a viral English communication expert creating engaging content for confident communication.

TOPIC: "${topic.displayName}" - ${enhancedGuidelines.focus}

VIRAL LEARNING STRATEGY:
• HOOK: ${enhancedGuidelines.hook}
• SCENARIOS: Focus on ${enhancedGuidelines.scenarios?.join(', ')}
• ENGAGEMENT: ${enhancedGuidelines.engagement}

Generate communication content that builds genuine confidence and practical skills:

CONTENT APPROACH:
• Address a common communication challenge that learners face
• Break it down into simple, actionable steps
• Include relatable scenarios that make the advice memorable
• Connect to professional and personal communication benefits
• Keep under 240 characters (excluding hashtags)
• Sound like an encouraging coach who makes complex skills accessible
${!useRSSSources ? '• Focus on timeless educational content - avoid current events' : ''}

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: Practical communication mastery

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'product_insights') {
    const enhancedGuidelines = guidelines || {
      focus: 'Practical product development insights from real experience',
      hook: 'The product insight that changes everything',
      scenarios: ['feature decisions', 'user research', 'roadmap planning'],
      engagement: 'Build better products with proven strategies'
    };

    // Build RSS context for professional personas
    let rssSourceContext = '';
    if (rssContext.length > 0) {
      rssSourceContext = `\n\nRECENT INDUSTRY DEVELOPMENTS (from RSS sources):\n${rssContext}`;
    }

    basePrompt = `You are a seasoned product expert sharing viral product development insights on Twitter.

TOPIC: "${topic.displayName}" - ${enhancedGuidelines.focus}

VIRAL STRATEGY:
• HOOK: ${enhancedGuidelines.hook}
• SCENARIOS: Focus on ${enhancedGuidelines.scenarios?.join(', ')}
• ENGAGEMENT: ${enhancedGuidelines.engagement}

Generate product content that provides genuine value to product managers and builders:

CONTENT APPROACH:
• Share a hard-learned insight or counterintuitive lesson about ${topic.displayName}
• Include specific examples or scenarios that illustrate the point
• Explain why this matters for product success and user experience
• Keep under 240 characters (excluding hashtags)
• Sound authentic and based on real experience - avoid generic advice
• Focus on actionable insights that product people can apply immediately
${useRSSSources ? '• May reference current industry trends or recent product examples' : ''}${rssSourceContext}

CONTENT TYPE: ${contentType}
PROFESSIONAL FOCUS: Practical product insights

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'startup_content') {
    // Build RSS context for startup personas
    let rssSourceContext = '';
    if (rssContext.length > 0) {
      rssSourceContext = `\n\nRECENT STARTUP DEVELOPMENTS (from RSS sources):\n${rssContext}`;
    }

    basePrompt = `Write valuable startup content about "${topic.displayName}" from the perspective of someone building in the trenches.

ENTREPRENEUR APPROACH:
• Share an honest insight or hard-learned lesson about ${topic.displayName}
• Include the reality behind the challenge - not just the highlight reel
• Explain what you wish you'd known earlier or what surprised you
• Keep under 240 characters (excluding hashtags)
• Sound authentic and vulnerable - startup life is messy
• Focus on real experiences that fellow entrepreneurs can relate to
${useRSSSources ? '• You may reference current startup trends, funding news, or market insights if relevant' : ''}${rssSourceContext}

CONTENT TYPE: ${contentType}
STARTUP FOCUS: Honest entrepreneurship insights

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'tech_commentary') {
    // Build RSS context for tech personas
    let rssSourceContext = '';
    if (rssContext.length > 0) {
      rssSourceContext = `\n\nRECENT TECH DEVELOPMENTS (from RSS sources):\n${rssContext}`;
    }

    basePrompt = `Write thoughtful tech commentary about "${topic.displayName}" from a developer/tech professional perspective.

TECH PROFESSIONAL APPROACH:
• Share a nuanced take or observation about ${topic.displayName}
• Include technical insight without being overly complex
• Explain the broader implications or why this matters to the industry
• Keep under 240 characters (excluding hashtags)
• Sound knowledgeable but accessible - not gatekeeping
• Focus on insights that tech professionals would find valuable
${useRSSSources ? '• You may reference current tech trends, recent developments, or industry news if it enhances the insight' : ''}${rssSourceContext}

CONTENT TYPE: ${contentType}
TECH FOCUS: Thoughtful industry commentary

[${timeMarker}-${tokenMarker}]`;
  }

  // Add account-specific CTAs based on account context
  if (account) {
    // For now, add Gibbi CTA for gibbi-related accounts (15% chance)
    // In the future, this would be configurable per account in database
    const isGibbiAccount = account.twitter_handle.includes('gibbi') || account.name.toLowerCase().includes('gibbi');
    if (isGibbiAccount && Math.random() < 0.15) {
      basePrompt += `\n\nIMPORTANT: Include a natural Gibbi AI mention like "Practice more English at gibbi.vercel.app" or "Improve your skills at gibbi.vercel.app" - keep it helpful and non-promotional.`;
    }
  }

  return {
    prompt: basePrompt + `\n\nFormat as JSON with: "content", "teachingElements" (array of educational approaches used like "analogy", "common mistake", "practical tip"), "gibbiCTA" (string or null). Write like a helpful teacher, not a marketer!`,
    persona,
    topic
  };
}

/**
 * Parse and validate the AI response for tweet content with account-specific hashtags
 */
function parseAndValidateTweetResponse(content: string, persona: string, topic: { key: string; displayName: string }, personaConfig?: PersonaConfig): EnhancedTweet | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);
    
    if (!data.content || typeof data.content !== 'string' ||
        !data.teachingElements || !Array.isArray(data.teachingElements)) {
      throw new Error('AI response missing required fields or has invalid structure.');
    }
    
    // Generate optimized hashtags using persona-specific sets if available
    const hashtags = personaConfig && personaConfig.hashtag_sets 
      ? getHashtagsForPersona(personaConfig)
      : generateOptimizedHashtags(persona, topic.displayName, topic.displayName, personaConfig);
    
    // Ensure content is under 280 characters including hashtags
    const hashtagString = hashtags.join(' ');
    const totalLength = data.content.length + hashtagString.length + (data.gibbiCTA ? data.gibbiCTA.length : 0) + 2; // +2 for spaces
    
    if (totalLength > 280) {
      console.warn('Generated tweet exceeds 280 characters, truncating...');
      const availableLength = 250 - hashtagString.length - (data.gibbiCTA ? data.gibbiCTA.length : 0);
      data.content = data.content.substring(0, availableLength);
    }

    return {
      content: data.content,
      hashtags: hashtags,
      persona: persona,
      category: topic.key.split('_')[1] || 'general', // Extract category from topic key
      topic: topic.key,
      engagementHooks: data.teachingElements, // Map teachingElements to engagementHooks for backward compatibility
      gibbiCTA: data.gibbiCTA || undefined,
      contentType: 'explanation' // Default content type for teacher approach
    };
    
  } catch (error) {
    console.error(`Failed to parse AI tweet response. Content: "${content}"`, error);
    return null;
  }
}

/**
 * Main enhanced tweet generation function with multi-account support
 */
export async function generateEnhancedTweet(config: TweetGenerationConfig = {}): Promise<EnhancedTweet | null> {
  try {
    const { prompt, persona, topic } = await generateEnhancedTweetPrompt(config);
    const markers = generateVariationMarkers();
  const { time_marker: timeMarker, token_marker: tokenMarker } = markers;

    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('AI returned no content.');
    }

    if (!persona || !topic) {
      throw new Error('Invalid persona or topic configuration');
    }

    const tweetData = parseAndValidateTweetResponse(content, persona.key, topic as { key: string; displayName: string }, persona);
    if (!tweetData) {
      throw new Error('Failed to parse or validate AI response.');
    }

    // Add content hash for duplicate detection (not stored in DB)
    const contentHash = generateContentHash(tweetData);
    
    console.log(`✅ Generated enhanced tweet for ${persona.displayName} on ${(topic as { key: string; displayName: string }).displayName} [${timeMarker}-${tokenMarker}] Hash: ${contentHash}`);
    return tweetData;

  } catch (error) {
    console.error(`❌ Failed to generate enhanced tweet:`, error);
    return null;
  }
}

/**
 * Generate multiple enhanced tweets in batch
 */
export async function generateBatchEnhancedTweets(count: number, config: TweetGenerationConfig = {}): Promise<EnhancedTweet[]> {
  const tweets: EnhancedTweet[] = [];
  const promises: Promise<EnhancedTweet | null>[] = [];

  for (let i = 0; i < count; i++) {
    promises.push(generateEnhancedTweet(config));
  }

  const results = await Promise.all(promises);
  
  for (const result of results) {
    if (result) {
      tweets.push(result);
    }
  }

  console.log(`📊 Enhanced batch generation complete: ${tweets.length}/${count} successful tweets`);
  return tweets;
}