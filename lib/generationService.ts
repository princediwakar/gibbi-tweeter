import OpenAI from 'openai';
import { getRandomTopicForPersona, getPersonaByKey, selectPersonaByWeight } from '@/lib/personas';
import { EnhancedTweet, TweetGenerationConfig, VariationMarkers } from './types';

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
function generateOptimizedHashtags(persona: string, categoryDisplayName: string, topicDisplayName: string): string[] {
  const baseHashtags: Record<string, string[]> = {
    english_vocab_builder: ['#EnglishLearning', '#Vocabulary', '#WordPower', '#EnglishTips'],
    english_grammar_master: ['#EnglishGrammar', '#Grammar', '#EnglishLearning', '#WritingSkills'],
    english_communication_expert: ['#Communication', '#Speaking', '#EnglishSkills', '#Conversation']
  };

  const hashtags = [...(baseHashtags[persona] || ['#EnglishLearning', '#Education', '#Language'])];
  
  // Add topic-specific hashtag
  const topicKey = topicDisplayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  if (topicKey.length > 3) {
    hashtags.push(`#${topicKey}`);
  }

  return hashtags.slice(0, 4); // Limit to 4 hashtags
}

/**
 * Creates professional tweet prompts based on persona and topic
 */
async function generateTweetPrompt(config: TweetGenerationConfig): Promise<string> {
  const markers = generateVariationMarkers();
  const { time_marker: timeMarker, token_marker: tokenMarker } = markers;
  
  // Select persona (either specified or weighted random)
  const persona = config.persona 
    ? getPersonaByKey(config.persona) 
    : selectPersonaByWeight();
    
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
  
  if (persona.key === 'english_vocab_builder') {
    basePrompt = `Write a helpful English vocabulary lesson about "${topic.displayName}" in the voice of an experienced English teacher.

TEACHER APPROACH:
• Address a common vocabulary challenge or question about ${topic.displayName}
• Provide a clear, simple explanation that learners can understand
• Include a practical memory aid, example sentence, or usage tip
• Connect to real-world usage or why it matters for communication
• Keep under 240 characters (excluding hashtags)
• Sound like a knowledgeable, helpful teacher - not a salesperson
• Focus on genuine educational value and practical usage

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: Clear explanation and practical vocabulary building

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'english_grammar_master') {
    basePrompt = `Write a helpful English grammar lesson about "${topic.displayName}" in the voice of an experienced grammar teacher.

TEACHER APPROACH:
• Start with a common grammar mistake or confusion about ${topic.displayName}
• Provide clear explanation with step-by-step reasoning
• Include a simple rule, pattern, or way to remember the concept
• Explain why this grammar point is important for clear communication
• Keep under 240 characters (excluding hashtags)
• Sound like a patient, knowledgeable teacher who understands learner struggles
• Focus on making complex grammar simple and memorable

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: Clear explanation and practical grammar learning

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'english_communication_expert') {
    basePrompt = `Write a helpful English communication tip about "${topic.displayName}" in the voice of an experienced communication coach.

TEACHER APPROACH:
• Address a common communication challenge that learners face about ${topic.displayName}
• Break it down into simple, actionable steps
• Include a relatable scenario or real-life example to make it memorable
• Connect to professional or personal communication benefits
• Keep under 240 characters (excluding hashtags)
• Sound like an encouraging communication coach who makes complex skills accessible
• Focus on building genuine confidence and practical communication skills

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: Clear explanation and practical communication skills

[${timeMarker}-${tokenMarker}]`;
  }

  // Add Gibbi CTA requirement (15% chance)
  const includegibbiCTA = Math.random() < 0.15;
  if (includegibbiCTA) {
    basePrompt += `\n\nIMPORTANT: Include a natural Gibbi AI mention like "Practice more English at gibbi.vercel.app" or "Improve your skills at gibbi.vercel.app" - keep it helpful and non-promotional.`;
  }

  return basePrompt + `\n\nFormat as JSON with: "content", "teachingElements" (array of educational approaches used like "analogy", "common mistake", "practical tip"), "gibbiCTA" (string or null). Write like a helpful teacher, not a marketer!`;
}

/**
 * Parse and validate the AI response for tweet content
 */
function parseAndValidateTweetResponse(content: string, persona: string, topic: { key: string; displayName: string }): EnhancedTweet | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);
    
    if (!data.content || typeof data.content !== 'string' ||
        !data.teachingElements || !Array.isArray(data.teachingElements)) {
      throw new Error('AI response missing required fields or has invalid structure.');
    }
    
    // Generate optimized hashtags
    const hashtags = generateOptimizedHashtags(persona, topic.displayName, topic.displayName);
    
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
 * Main enhanced tweet generation function
 */
export async function generateEnhancedTweet(config: TweetGenerationConfig = {}): Promise<EnhancedTweet | null> {
  try {
    const prompt = await generateTweetPrompt(config);
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

    // Get persona and topic info for validation
    const persona = config.persona 
      ? getPersonaByKey(config.persona) 
      : selectPersonaByWeight();
      
    const topic = config.topic && persona
      ? persona.topics.find(t => t.key === config.topic)
      : getRandomTopicForPersona(persona?.key || '');

    if (!persona || !topic) {
      throw new Error('Invalid persona or topic configuration');
    }

    const tweetData = parseAndValidateTweetResponse(content, persona.key, topic);
    if (!tweetData) {
      throw new Error('Failed to parse or validate AI response.');
    }

    // Add content hash for duplicate detection (not stored in DB)
    const contentHash = generateContentHash(tweetData);
    
    console.log(`✅ Generated enhanced tweet for ${persona.displayName} on ${topic.displayName} [${timeMarker}-${tokenMarker}] Hash: ${contentHash}`);
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