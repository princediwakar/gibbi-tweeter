import OpenAI from 'openai';
import { getPersonaByKey, PersonaConfig } from '@/lib/personas';
import { getAccount, createThread, saveTweet, generateTweetId } from './db';
import type { Account, Tweet } from './types';
import { getThreadTemplate, ThreadTemplate } from './threadTemplates';

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface ThreadGenerationConfig {
  account_id: string;
  persona: string;
  template?: string; // Specific template name
  topic?: string; // Optional topic override
}

export interface ThreadGenerationResult {
  thread_id: string;
  total_tweets: number;
  tweets: Tweet[];
  template_used: string;
  story_category: string;
}

/**
 * Select appropriate thread template for business storyteller persona
 */
function selectThreadTemplate(persona: PersonaConfig, templateOverride?: string): ThreadTemplate {
  if (templateOverride) {
    const template = getThreadTemplate(templateOverride);
    if (template) {
      console.log(`🎯 Using specified template: ${template.displayName}`);
      return template;
    }
    console.warn(`⚠️ Template "${templateOverride}" not found, using random selection`);
  }

  // For business storyteller, select from available templates
  if (persona.key === 'business_storyteller' && persona.thread_templates) {
    const randomIndex = Math.floor(Math.random() * persona.thread_templates.length);
    const templateName = persona.thread_templates[randomIndex];
    const template = getThreadTemplate(templateName);
    
    if (template) {
      console.log(`🎲 Randomly selected template: ${template.displayName}`);
      return template;
    }
  }

  // Fallback to founder struggle template
  const fallbackTemplate = getThreadTemplate('founder_struggle');
  if (!fallbackTemplate) {
    throw new Error('No thread templates available');
  }
  
  console.log(`🔄 Using fallback template: ${fallbackTemplate.displayName}`);
  return fallbackTemplate;
}

/**
 * Generate thread-specific prompt for Indian business storytelling
 */
function generateThreadPrompt(template: ThreadTemplate): string {
  const timeMarker = `T${Date.now()}`;
  const tokenMarker = `TK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return `You are an expert Indian business storyteller creating compelling Twitter threads about authentic business stories with emotional depth and strategic insights.

THREAD TEMPLATE: "${template.displayName}"
TARGET TWEETS: ${template.target_tweets}
STORY STRUCTURE: ${template.structure.join(' → ')}

TEMPLATE EXAMPLE FOR REFERENCE (create different story, not this exact one):
Hook: "${template.example.hook}"
Background: "${template.example.background || template.example.context || template.example.family_context}"
Development: "${template.example.crisis || template.example.analysis || template.example.generational_conflict}"
Resolution: "${template.example.decision || template.example.resolution_attempt || template.example.outcome}"
Lesson: "${template.example.lesson || template.example.succession_wisdom || template.example.universal_principle}"

STORY REQUIREMENTS:
• Focus on authentic Indian business stories (Tata, Reliance, Infosys, newer startups, family businesses, etc.)
• Include emotional elements - human struggles, difficult decisions, family dynamics
• Provide strategic business insights and universal lessons
• Use specific numbers, dates, and concrete details when possible
• Connect historical context with modern business principles
• Each tweet should be engaging standalone while advancing the narrative

INDIAN BUSINESS CONTEXT:
• Draw from rich Indian business history - from independence era to modern startups
• Include cultural elements - family business dynamics, traditional vs modern approaches
• Reference iconic Indian business leaders and their decision-making patterns
• Highlight uniquely Indian business concepts like 'Jugaad', family succession, regulatory challenges
• Connect with current Indian startup ecosystem and unicorn stories

CONTENT APPROACH:
• Tweet 1: Strong hook with surprising/intriguing opening
• Middle tweets: Develop tension, conflict, or challenge with human elements
• Final tweet: Universal business lesson or principle that applies globally
• Use conversational tone - like storytelling, not corporate speak
• Include specific details that make the story memorable and credible
• Each tweet should be 200-240 characters to leave room for threading indicators

THREADING FORMAT:
• Tweet 1: "Hook content 1/${template.target_tweets} 🧵"
• Tweet N: "Content ${template.target_tweets}/${template.target_tweets} 🧵"
• Use thread emojis and numbering consistently
• Each tweet must advance the story meaningfully

FORBIDDEN:
• Generic business advice without specific story
• Western business examples (focus on Indian context)
• Overly promotional tone
• Facts without emotional connection
• Stories that are too well-known (find lesser-known angles)

Generate a complete ${template.target_tweets}-tweet thread following this structure. Return ONLY valid JSON with this exact format:

{
  "title": "Thread title (max 50 chars)",
  "story_category": "${template.name}",
  "tweets": [
    {
      "sequence": 1,
      "content": "Tweet 1 content with hook",
      "hook_type": "opener"
    },
    {
      "sequence": 2,
      "content": "Tweet 2 content",
      "hook_type": "context"
    }
    // ... continue for all ${template.target_tweets} tweets
  ]
}

[${timeMarker}-${tokenMarker}]`;
}

/**
 * Parse and validate thread generation response
 */
function parseThreadResponse(content: string, template: ThreadTemplate): { title: string; story_category: string; tweets: Array<{ sequence: number; content: string; hook_type: string; }> } | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);
    
    if (!data.title || !data.tweets || !Array.isArray(data.tweets)) {
      throw new Error('AI response missing required fields');
    }
    
    if (data.tweets.length !== template.target_tweets) {
      throw new Error(`Expected ${template.target_tweets} tweets, got ${data.tweets.length}`);
    }
    
    // Validate tweet structure
    for (let i = 0; i < data.tweets.length; i++) {
      const tweet = data.tweets[i];
      if (!tweet.content || typeof tweet.content !== 'string') {
        throw new Error(`Tweet ${i + 1} missing content`);
      }
      if (tweet.sequence !== i + 1) {
        throw new Error(`Tweet ${i + 1} has incorrect sequence number`);
      }
      if (tweet.content.length > 240) {
        console.warn(`Tweet ${i + 1} exceeds 240 characters, truncating...`);
        tweet.content = tweet.content.substring(0, 237) + '...';
      }
    }
    
    return {
      title: data.title,
      story_category: data.story_category || template.name,
      tweets: data.tweets
    };
  } catch (error) {
    console.error(`Failed to parse thread response: ${error}`, { content: content.substring(0, 200) + '...' });
    return null;
  }
}

/**
 * Generate hashtags for business storytelling threads
 */
function generateThreadHashtags(template: ThreadTemplate): string[] {
  // Combine template-specific hashtags with business storytelling hashtags
  const baseHashtags = ['#IndianBusiness', '#BusinessStories', '#Entrepreneurship', '#Leadership'];
  const templateHashtags = template.hashtags || [];
  
  // Merge and limit to 4 hashtags
  const allHashtags = [...new Set([...baseHashtags, ...templateHashtags])];
  return allHashtags.slice(0, 4);
}

/**
 * Main thread generation function
 */
export async function generateThread(config: ThreadGenerationConfig): Promise<ThreadGenerationResult | null> {
  try {
    console.log(`🧵 Starting thread generation for account: ${config.account_id}, persona: ${config.persona}`);
    
    // Get account context
    const account = await getAccount(config.account_id);
    if (!account) {
      throw new Error(`Account not found: ${config.account_id}`);
    }
    
    // Get persona configuration
    const persona = getPersonaByKey(config.persona);
    if (!persona) {
      throw new Error(`Persona not found: ${config.persona}`);
    }
    
    // Validate persona supports threading
    if (!persona.content_types?.includes('thread')) {
      throw new Error(`Persona ${config.persona} does not support threading`);
    }
    
    // Select thread template
    const template = selectThreadTemplate(persona, config.template);
    
    // Generate thread content using AI
    const prompt = generateThreadPrompt(template);
    
    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8, // Higher creativity for storytelling
      max_tokens: 2000, // Allow for longer responses
    });

    const aiContent = response.choices[0].message.content;
    if (!aiContent) {
      throw new Error('AI returned no content for thread generation');
    }

    // Parse and validate the response
    const threadData = parseThreadResponse(aiContent, template);
    if (!threadData) {
      throw new Error('Failed to parse or validate thread response');
    }

    console.log(`✅ Generated thread: "${threadData.title}" with ${threadData.tweets.length} tweets`);

    // Create thread record in database
    const threadId = await createThread({
      account_id: config.account_id,
      title: threadData.title,
      persona: config.persona,
      story_template: template.name,
      total_tweets: threadData.tweets.length,
      status: 'ready',
      story_category: threadData.story_category
    });

    // Generate hashtags for the thread
    const hashtags = generateThreadHashtags(template);

    // Create and save individual tweets
    const tweets: Tweet[] = [];
    
    for (const tweetData of threadData.tweets) {
      const tweetId = generateTweetId();
      
      const tweet: Tweet = {
        id: tweetId,
        account_id: config.account_id,
        content: tweetData.content,
        hashtags: hashtags,
        persona: config.persona,
        status: 'ready',
        created_at: new Date().toISOString(),
        // Threading fields
        thread_id: threadId,
        thread_sequence: tweetData.sequence,
        content_type: 'thread',
        hook_type: tweetData.hook_type as 'opener' | 'context' | 'crisis' | 'resolution' | 'lesson'
      };

      await saveTweet(tweet);
      tweets.push(tweet);
    }

    console.log(`🎉 Thread generation complete: ${tweets.length} tweets saved for thread ${threadId}`);

    return {
      thread_id: threadId,
      total_tweets: tweets.length,
      tweets: tweets,
      template_used: template.name,
      story_category: threadData.story_category
    };

  } catch (error) {
    console.error(`❌ Thread generation failed:`, error);
    return null;
  }
}

/**
 * Generate content mix for account (threads + single tweets)
 */
export async function generateContentMix(account_id: string, count: number = 1): Promise<{ threads: ThreadGenerationResult[]; single_tweets: number }> {
  const threads: ThreadGenerationResult[] = [];
  let single_tweets = 0;

  // Content mix: 70% threads, 20% business single tweets, 10% satirist
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    
    if (rand < 0.7) {
      // Generate business storyteller thread
      const threadResult = await generateThread({
        account_id,
        persona: 'business_storyteller'
      });
      
      if (threadResult) {
        threads.push(threadResult);
      }
    } else {
      // For single tweets, we'd call the existing generateEnhancedTweet function
      // This will be handled by the existing generation system
      single_tweets++;
    }
  }

  return { threads, single_tweets };
}

/**
 * Get thread generation eligibility for account
 */
export function canGenerateThreads(account: Account): boolean {
  // Currently only Prince's business account supports threading
  const handle = account.twitter_handle.toLowerCase();
  const name = account.name.toLowerCase();
  
  // Gibbi accounts should not generate threads
  if (handle.includes('gibbi') || name.includes('gibbi') || name.includes('english') || name.includes('learning')) {
    return false;
  }
  
  // Prince accounts and other business accounts can generate threads
  return true;
}

const threadGenerationService = {
  generateThread,
  generateContentMix,
  canGenerateThreads
};

export default threadGenerationService;