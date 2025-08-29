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
    neet_physics: ['#NEET', '#NEETPhysics', '#Physics', '#NEETPrep', '#MedicalEntrance'],
    neet_chemistry: ['#NEET', '#NEETChemistry', '#Chemistry', '#NEETPrep', '#MedicalEntrance'],
    neet_biology: ['#NEET', '#NEETBiology', '#Biology', '#NEETPrep', '#MedicalEntrance']
  };

  const hashtags = [...(baseHashtags[persona] || ['#NEET', '#Education', '#Quiz'])];
  
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
  
  if (persona.key === 'neet_physics') {
    basePrompt = `Create an engaging NEET Physics tweet about "${topic.displayName}" for medical entrance preparation.

REQUIREMENTS:
• Start with an attention-grabbing hook (e.g., "Physics Challenge:", "Tricky Concept:")
• Include a challenging physics concept or problem from ${topic.displayName}
• Add educational value with clear explanations
• Include competitive elements like "NEET toppers know this" or "Medical college aspirants should master this"
• Keep under 240 characters (excluding hashtags)
• Make it educational and shareable
• Focus on concept clarity and problem-solving

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: ${persona.viralFocus}

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'neet_chemistry') {
    basePrompt = `Create an engaging NEET Chemistry tweet about "${topic.displayName}" for medical entrance preparation.

REQUIREMENTS:
• Start with educational hooks like "Chemistry Concept:" or "Important for NEET:"
• Focus on key chemistry concepts from ${topic.displayName}
• Include reaction mechanisms, equations, or molecular concepts when relevant
• Add educational context like "Essential for medical entrance" or "NEET frequently asks this"
• Keep under 240 characters (excluding hashtags)
• Make it informative and educational
• Focus on conceptual understanding

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: ${persona.viralFocus}

[${timeMarker}-${tokenMarker}]`;

  } else if (persona.key === 'neet_biology') {
    basePrompt = `Create an engaging NEET Biology tweet about "${topic.displayName}" for medical entrance preparation.

REQUIREMENTS:
• Start with educational hooks like "Biology Fact:" or "Medical Entrance Tip:"
• Focus on important biology concepts from ${topic.displayName}
• Add medical relevance and clinical applications when appropriate
• Include educational context like "Future doctors should know" or "Important for NEET"
• Keep under 240 characters (excluding hashtags)
• Make it educational and informative
• Focus on conceptual clarity and medical relevance

CONTENT TYPE: ${contentType}
EDUCATIONAL FOCUS: ${persona.viralFocus}

[${timeMarker}-${tokenMarker}]`;
  }

  // Add Gibbi CTA requirement (15% chance)
  const includeGibibiCTA = Math.random() < 0.15;
  if (includeGibibiCTA) {
    basePrompt += `\n\nIMPORTANT: Include a natural Gibbi AI mention like "Practice more questions at gibbi.vercel.app" or "Master this topic at gibbi.vercel.app" - keep it helpful and non-promotional.`;
  }

  return basePrompt + `\n\nFormat as JSON with: "content", "engagementHooks" (array of educational elements used), "gibibiCTA" (string or null). Focus on educational value and clarity!`;
}

/**
 * Parse and validate the AI response for tweet content
 */
function parseAndValidateTweetResponse(content: string, persona: string, topic: { key: string; displayName: string }): EnhancedTweet | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);
    
    if (!data.content || typeof data.content !== 'string' ||
        !data.engagementHooks || !Array.isArray(data.engagementHooks)) {
      throw new Error('AI response missing required fields or has invalid structure.');
    }
    
    // Generate optimized hashtags
    const hashtags = generateOptimizedHashtags(persona, topic.displayName, topic.displayName);
    
    // Ensure content is under 280 characters including hashtags
    const hashtagString = hashtags.join(' ');
    const totalLength = data.content.length + hashtagString.length + (data.gibibiCTA ? data.gibibiCTA.length : 0) + 2; // +2 for spaces
    
    if (totalLength > 280) {
      console.warn('Generated tweet exceeds 280 characters, truncating...');
      const availableLength = 250 - hashtagString.length - (data.gibibiCTA ? data.gibibiCTA.length : 0);
      data.content = data.content.substring(0, availableLength);
    }

    return {
      content: data.content,
      hashtags: hashtags,
      persona: persona,
      category: topic.key.split('_')[1] || 'general', // Extract category from topic key
      topic: topic.key,
      engagementHooks: data.engagementHooks,
      gibibiCTA: data.gibibiCTA || undefined,
      contentType: 'challenge' // Default content type
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