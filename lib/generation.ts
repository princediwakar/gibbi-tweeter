/**
 * Tweet Generation Service
 * Adapts the quiz generation approach for viral Twitter content
 */

import OpenAI from 'openai';
import { getRandomTopicForPersona, getPersonaByKey, selectPersonaByWeight } from './personas';

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface TweetContent {
  content: string;
  hashtags: string[];
  persona: string;
  topic?: string;
  topicDisplayName?: string;
  viralHooks: string[];
  gibibiCTA?: string;
}

export interface TweetGenerationConfig {
  persona?: string;
  topic?: string;
  contentType?: 'challenge' | 'trap' | 'quick_tip' | 'motivation' | 'question_reveal' | 'competitive';
}

/**
 * Generates unique variation markers for content diversity
 */
function generateVariationMarkers(): { timeMarker: string; tokenMarker: string } {
  const timestamp = Date.now();
  const timeMarker = `T${timestamp}`;
  const tokenMarker = `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  return { timeMarker, tokenMarker };
}

/**
 * Creates viral tweet prompts based on persona and topic
 */
async function generateViralTweetPrompt(config: TweetGenerationConfig): Promise<string> {
  const { timeMarker, tokenMarker } = generateVariationMarkers();
  
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
  
  if (persona.key === 'neet_physics') {
    basePrompt = `Create a VIRAL NEET Physics tweet about "${topic.displayName}" that will get massive engagement.

VIRAL REQUIREMENTS:
• Start with a hook like "🚨 BRUTAL PHYSICS TRAP:" or "⚡ 90% GET THIS WRONG:"
• Include a challenging physics concept or problem from ${topic.displayName}
• Add competitive elements like "AIIMS toppers solve this in 60 seconds"
• Use urgency and FOMO triggers
• Include viral phrases like "Don't be the 90%" or "RT if you're ready for NEET"
• Keep under 280 characters including hashtags
• Make it shareable and ego-driven

CONTENT TYPE: ${contentType}
${persona.viralFocus}

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'neet_chemistry') {
    basePrompt = `Create a VIRAL NEET Chemistry tweet about "${topic.displayName}" that will explode on Twitter.

VIRAL REQUIREMENTS:
• Start with hooks like "💣 CHEMISTRY NIGHTMARE:" or "🧪 95% FAIL THIS:"
• Focus on tricky chemistry concepts from ${topic.displayName}
• Add pressure elements like "This is why only 2% get into AIIMS"
• Include reaction mechanisms, equations, or molecular concepts
• Use competitive language and medical college references
• Keep under 280 characters including hashtags
• Make students want to prove their chemistry knowledge

CONTENT TYPE: ${contentType}
${persona.viralFocus}

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'neet_biology') {
    basePrompt = `Create a VIRAL NEET Biology tweet about "${topic.displayName}" that will dominate medical prep Twitter.

VIRAL REQUIREMENTS:
• Start with hooks like "🧬 BIOLOGY DEATH TRAP:" or "⚡ MEDICAL NIGHTMARE:"
• Focus on complex biology concepts from ${topic.displayName}
• Add medical relevance and clinical applications
• Include competitive triggers like "Future doctors MUST know this"
• Reference medical colleges and toppers
• Keep under 280 characters including hashtags
• Make aspiring doctors share to prove readiness

CONTENT TYPE: ${contentType}
${persona.viralFocus}

[${timeMarker}-${tokenMarker}]`;
  }

  // Add Gibbi CTA requirement (15% chance)
  const includeGibibiCTA = Math.random() < 0.15;
  if (includeGibibiCTA) {
    basePrompt += `\n\nIMPORTANT: Include a subtle Gibbi AI mention like "Master more questions like this at gibbi.vercel.app" or "Ready for unlimited NEET practice? Try gibbi.vercel.app" but keep it natural and non-promotional.`;
  }

  return basePrompt + `\n\nFormat as JSON with: "content", "hashtags" (array), "viralHooks" (array of specific viral elements used), "gibibiCTA" (string or null). Make it VIRAL and SHAREABLE!`;
}

/**
 * Main tweet generation function
 */
export async function generateViralTweet(config: TweetGenerationConfig = {}): Promise<TweetContent | null> {
  try {
    const prompt = await generateViralTweetPrompt(config);
    const { timeMarker, tokenMarker } = generateVariationMarkers();

    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('AI returned no content.');
    }

    const tweetData = parseAndValidateTweetResponse(content);
    if (!tweetData) {
      throw new Error('Failed to parse or validate AI response.');
    }

    // Get persona and topic info
    const persona = config.persona 
      ? getPersonaByKey(config.persona) 
      : selectPersonaByWeight();
      
    const topic = config.topic && persona
      ? persona.topics.find(t => t.key === config.topic)
      : getRandomTopicForPersona(persona?.key || '');

    const finalTweet: TweetContent = {
      ...tweetData,
      persona: persona?.key || 'unknown',
      topic: topic?.key,
      topicDisplayName: topic?.displayName,
    };

    console.log(`✅ Generated viral tweet for ${persona?.displayName} on ${topic?.displayName} [${timeMarker}-${tokenMarker}]`);
    return finalTweet;

  } catch (error) {
    console.error(`❌ Failed to generate viral tweet:`, error);
    return null;
  }
}

/**
 * Parse and validate the AI response for tweet content
 */
function parseAndValidateTweetResponse(content: string): Omit<TweetContent, 'persona' | 'topic' | 'topicDisplayName'> | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);
    
    if (!data.content || typeof data.content !== 'string' ||
        !data.hashtags || !Array.isArray(data.hashtags) ||
        !data.viralHooks || !Array.isArray(data.viralHooks)) {
      throw new Error('AI response missing required fields or has invalid structure.');
    }
    
    // Ensure content is under 280 characters
    const totalLength = data.content.length + data.hashtags.join(' ').length + (data.gibibiCTA ? data.gibibiCTA.length : 0);
    if (totalLength > 280) {
      console.warn('Generated tweet exceeds 280 characters, truncating...');
      data.content = data.content.substring(0, 250 - data.hashtags.join(' ').length);
    }

    return {
      content: data.content,
      hashtags: data.hashtags,
      viralHooks: data.viralHooks,
      gibibiCTA: data.gibibiCTA || null
    };
    
  } catch (error) {
    console.error(`Failed to parse AI tweet response. Content: "${content}"`, error);
    return null;
  }
}

/**
 * Generate multiple tweets in batch
 */
export async function generateBatchTweets(count: number, config: TweetGenerationConfig = {}): Promise<TweetContent[]> {
  const tweets: TweetContent[] = [];
  const promises: Promise<TweetContent | null>[] = [];

  for (let i = 0; i < count; i++) {
    promises.push(generateViralTweet(config));
  }

  const results = await Promise.all(promises);
  
  for (const result of results) {
    if (result) {
      tweets.push(result);
    }
  }

  console.log(`📊 Batch generation complete: ${tweets.length}/${count} successful tweets`);
  return tweets;
}

/**
 * Generate content hash for duplicate detection
 */
export function generateContentHash(tweet: TweetContent): string {
  const contentString = JSON.stringify({
    content: tweet.content,
    hashtags: tweet.hashtags,
    persona: tweet.persona
  });
  
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `CH${Math.abs(hash).toString(36).toUpperCase()}`;
}