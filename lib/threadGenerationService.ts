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
 * Split a long tweet into multiple tweets at natural break points
 */
function splitLongTweet(content: string): string[] {
  const maxLength = 280;
  
  if (content.length <= maxLength) {
    return [content];
  }
  
  const tweets: string[] = [];
  let remaining = content.trim();
  
  while (remaining.length > maxLength) {
    // Find natural break points in order of preference
    let splitIndex = maxLength;
    
    // Try to split at sentence endings (. ! ?)
    let lastSentence = remaining.lastIndexOf('.', maxLength);
    if (lastSentence === -1) lastSentence = remaining.lastIndexOf('!', maxLength);
    if (lastSentence === -1) lastSentence = remaining.lastIndexOf('?', maxLength);
    
    if (lastSentence > maxLength * 0.6) { // Don't split too early
      splitIndex = lastSentence + 1;
    } else {
      // Try to split at comma or semicolon
      let lastPunctuation = remaining.lastIndexOf(',', maxLength);
      if (lastPunctuation === -1) lastPunctuation = remaining.lastIndexOf(';', maxLength);
      
      if (lastPunctuation > maxLength * 0.7) {
        splitIndex = lastPunctuation + 1;
      } else {
        // Split at last space to avoid breaking words
        const lastSpace = remaining.lastIndexOf(' ', maxLength);
        if (lastSpace > maxLength * 0.5) {
          splitIndex = lastSpace;
        }
      }
    }
    
    // Extract the tweet and clean up
    const tweetContent = remaining.substring(0, splitIndex).trim();
    tweets.push(tweetContent);
    
    // Continue with remaining content
    remaining = remaining.substring(splitIndex).trim();
  }
  
  // Add the final piece
  if (remaining.length > 0) {
    tweets.push(remaining);
  }
  
  console.log(`✂️ Split long tweet into ${tweets.length} parts:`, tweets.map(t => `${t.length} chars`));
  return tweets;
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
  const diversityMarker = `D${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  
  // Add variation instructions
  const variationPrompts = [
    "Focus on a lesser-known regional business story",
    "Tell a story from the startup ecosystem (2010-2024)",
    "Share a family business transition story", 
    "Explore a crisis management story",
    "Highlight an unexpected business pivot",
    "Discuss a cultural adaptation success"
  ];
  const selectedVariation = variationPrompts[Math.floor(Math.random() * variationPrompts.length)];

  return `You are an expert Indian business storyteller creating compelling Twitter threads about authentic business stories with emotional depth and strategic insights.

UNIQUENESS INSTRUCTION: ${selectedVariation}

THREAD TEMPLATE: "${template.displayName}"

STORY BRIEF: ${template.story_prompt}

CREATIVE FREEDOM:
• Find and weave a compelling, authentic Indian business story
• Use your knowledge to discover interesting, lesser-known stories or fresh angles
• Focus on emotional depth and strategic insights
• Each thread should be completely unique and original

STORY REQUIREMENTS:
• Focus on authentic Indian business stories (Tata, Reliance, Infosys, newer startups, family businesses, etc.)
• Include emotional elements - human struggles, difficult decisions, family dynamics
• Provide strategic business insights and universal lessons
• Use specific numbers, dates, and concrete details when possible
• Connect historical context with modern business principles
• Each tweet should be engaging standalone while advancing the narrative
• IMPORTANT: Use Twitter handles (@username) instead of names when mentioning people, companies, or organizations

INDIAN BUSINESS CONTEXT:
• Draw from rich Indian business history - from independence era to modern startups
• Include cultural elements - family business dynamics, traditional vs modern approaches
• Reference iconic Indian business leaders and their decision-making patterns
• Highlight uniquely Indian business concepts like 'Jugaad', family succession, regulatory challenges
• Connect with current Indian startup ecosystem and unicorn stories

CONTENT APPROACH:
• Start with an engaging hook
• Tell the story with natural flow and pacing
• Include human elements and emotional depth
• End with meaningful insights or lessons
• Use conversational storytelling tone
• Include specific, memorable details

THREADING FORMAT:
• Generate clean content without numbering - numbering will be added automatically
• Each tweet should be engaging standalone while advancing the narrative
• Thread length should serve the story, not arbitrary constraints
• Content will be processed for threading after generation

CHARACTER LIMITS - CRITICAL:
• EACH TWEET MUST BE STRICTLY UNDER 270 CHARACTERS (including spaces and punctuation)
• This leaves 10 characters buffer for thread indicators (X/Y) and hashtags
• If content exceeds 280 characters, BREAK IT INTO TWO TWEETS instead
• Count characters carefully - Twitter rejects tweets over 280 characters
• Shorter tweets are better for engagement - aim for 200-260 characters per tweet

FORBIDDEN:
• Generic business advice without specific story
• Western business examples (focus on Indian context)
• Overly promotional tone
• Facts without emotional connection
• Stories that are too well-known (find lesser-known angles)

Generate a complete thread with optimal length for your story. Return ONLY valid JSON with this exact format:

{
  "title": "Thread title",
  "story_category": "${template.name}",
  "hashtags": ["Relevant hashtags for your specific story"],
  "tweets": [
    {
      "sequence": 1,
      "content": "Tweet 1 content"
    },
    {
      "sequence": 2,
      "content": "Tweet 2 content"
    }
    // ... continue for all tweets in your thread
  ]
}

Create hashtags that are authentic and specific to your story content. Avoid generic business hashtags.

[${timeMarker}-${tokenMarker}-${diversityMarker}]`;
}

/**
 * Parse and validate thread generation response
 */
function parseThreadResponse(content: string, template: ThreadTemplate): { title: string; story_category: string; hashtags: string[]; tweets: Array<{ sequence: number; content: string; }> } | null {
  try {
    const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const data = JSON.parse(cleanedContent);
    
    if (!data.title || !data.tweets || !Array.isArray(data.tweets) || !data.hashtags || !Array.isArray(data.hashtags)) {
      throw new Error('AI response missing required fields');
    }
    
    if (data.tweets.length < 3 || data.tweets.length > 10) {
      throw new Error(`Thread length should be reasonable (3-10 tweets), got ${data.tweets.length}`);
    }
    
    // Validate tweet structure and handle character limits
    const processedTweets = [];
    for (let i = 0; i < data.tweets.length; i++) {
      const tweet = data.tweets[i];
      if (!tweet.content || typeof tweet.content !== 'string') {
        throw new Error(`Tweet ${i + 1} missing content`);
      }
      
      // Character validation and overflow handling
      if (tweet.content.length > 280) {
        console.warn(`Tweet ${i + 1} is too long (${tweet.content.length} chars), splitting into multiple tweets...`);
        
        // Split at natural break points (sentences, clauses)
        const splitTweets = splitLongTweet(tweet.content);
        
        // Add split tweets with correct sequencing
        splitTweets.forEach((content, splitIndex) => {
          processedTweets.push({
            sequence: processedTweets.length + 1,
            content: content
          });
        });
      } else {
        processedTweets.push({
          sequence: processedTweets.length + 1,
          content: tweet.content
        });
      }
    }
    
    // Validate final length
    if (processedTweets.length > 15) {
      throw new Error(`Thread too long after splitting: ${processedTweets.length} tweets (max 15)`);
    }
    
    return {
      title: data.title,
      story_category: data.story_category || template.name,
      hashtags: data.hashtags,
      tweets: processedTweets
    };
  } catch (error) {
    console.error(`Failed to parse thread response: ${error}`, { content: content.substring(0, 200) + '...' });
    return null;
  }
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
      max_tokens: 4000, // Allow for longer responses
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

    // Use AI-generated hashtags from the thread response
    const hashtags = threadData.hashtags;

    // Create and save individual tweets
    const tweets: Tweet[] = [];
    
    for (const tweetData of threadData.tweets) {
      const tweetId = generateTweetId();
      
      // Add threading numbering to content
      const threadNumber = `${tweetData.sequence}/${threadData.tweets.length}`;
      const threadedContent = tweetData.sequence === 1 
        ? `${tweetData.content} ${threadNumber} 🧵`
        : `${tweetData.content} ${threadNumber}`;
      
      const tweet: Tweet = {
        id: tweetId,
        account_id: config.account_id,
        content: threadedContent,
        hashtags: hashtags,
        persona: config.persona,
        status: 'ready',
        created_at: new Date().toISOString(),
        // Threading fields
        thread_id: threadId,
        thread_sequence: tweetData.sequence,
        content_type: 'thread'
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

/*

/**
 * Get thread generation eligibility for account
 */
export function canGenerateThreads(account: Account): boolean {
  // Currently only Prince's business account supports threading
  const handle = account.twitter_handle.toLowerCase();
  
  // Specific accounts that should NOT generate threads (Gibbi's educational accounts)
  const excludedHandles = ['@gibbi_ai', 'gibbi_ai'];
  if (excludedHandles.includes(handle) || excludedHandles.includes(handle.replace('@', ''))) {
    return false;
  }
  
  // Specific accounts that CAN generate threads (Prince's business accounts)
  const allowedHandles = ['@princediwakar25', 'princediwakar25'];
  return allowedHandles.includes(handle) || allowedHandles.includes(handle.replace('@', ''));
}

const threadGenerationService = {
  generateThread,
  canGenerateThreads
};

export default threadGenerationService;