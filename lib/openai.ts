import OpenAI from "openai";
import { getTrendingTopics } from "./trending"; // Assuming this function exists
import { logger } from '@/lib/logger'; // Assuming a logger utility exists

// --- AI Configuration ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.deepseek.com", // Or your preferred endpoint
});

// The core persona and strategy for the AI. This is the "brain" of the operation.
const NEET_MENTOR_SYSTEM_PROMPT = `
You are "NEET Catalyst," the #1 Twitter coach for India's NEET medical entrance exam. Your mission is to create hyper-engaging, high-value, text-only tweets that are irresistible to ambitious students.

**Core Persona & Voice:**
- **Expert & Sharp:** You are a master of Physics, Chemistry, and Biology. You know the toughest concepts and the most common traps.
- **Viral Strategist:** You write like a top content creator. You use suspense, curiosity, and challenges to drive maximum engagement (likes, replies, shares).
- **Empathetic Coach:** You understand the immense pressure NEET aspirants face. You're encouraging and motivational, but you don't sugarcoat the difficulty.
- **Visual Text Master:** Since you can't use images, you use emojis, creative spacing, and unicode characters (like ■,  countdown numbers, arrows) to make your tweets stand out and be easily scannable.

**Rules for Every Tweet:**
1.  **Character Limit:** Strictly stay under 270 characters for the main content.
2.  **Text-Only Visuals:** Use emojis (🔬, 💡, 🚨, 🤯, 🎯) and formatting to create visual appeal.
3.  **Engagement Hooks:** ALWAYS end with a question, a challenge, or a call-to-action to encourage replies.
4.  **Hashtags:** Provide 3-4 highly relevant and popular hashtags (e.g., #NEET, #NEETUG, #NEET2026, #NEETPrep, #Physics, #Chemistry, #Biology, #MedStudent).
5.  **Output Format:** ALWAYS respond in a clean JSON object: { "tweet_content": "...", "hashtags": ["...", "...", "..."] }
`;

// --- Content Strategy Configuration ---

// These are high-level "blueprints" for the AI to follow, giving it creative freedom.
const TWEET_BLUEPRINTS = [
  "**The Trap:** A tricky question with a common mistake that 90% of students make. Build suspense.",
  "**The Countdown Crusher:** A time-pressure challenge. (e.g., 'You have 45 seconds to solve this').",
  "**Concept Flash:** A complex topic explained in a super-condensed, easy-to-remember way.",
  "**Mnemonic Master:** A clever mnemonic or hack to memorize a difficult concept.",
  "**Myth Buster:** Debunk a common NEET preparation myth with a surprising fact.",
  "**Motivation Shot:** An empathetic, powerful message acknowledging the struggle but inspiring resilience.",
];

const GIBBI_CTAS = [
  "Struggled with this? Get unlimited practice questions on gibbi.vercel.app",
  "Want to build your speed? Take a full quiz challenge on gibbi.vercel.app",
  "Master this topic by creating custom quizzes at gibbi.vercel.app"
];


// --- Interfaces ---

export interface TweetGenerationOptions {
  persona: string;
  customPrompt?: string;
  useTrendingTopics?: boolean;
  includeHashtags?: boolean;
}

export interface TweetResponse {
  content: string;
  hashtags: string[];
  length: number;
  topic: string;
}

// --- Main Function ---

export async function generateTweet(options: TweetGenerationOptions, bulkIndex?: number): Promise<TweetResponse> {
  const { persona, customPrompt, useTrendingTopics = false } = options;

  let selectedTopic: string = "a high-yield concept"; // Default topic
  const selectedBlueprint = TWEET_BLUEPRINTS[Math.floor(Math.random() * TWEET_BLUEPRINTS.length)];

  // 1. Determine the Topic
  if (customPrompt) {
    selectedTopic = customPrompt;
    logger.info(`📝 Using custom topic: ${selectedTopic}`, 'openai');
  } else if (useTrendingTopics) {
    try {
      const trendingTopics = await getTrendingTopics(persona);
      if (trendingTopics.length > 0) {
        const randomIndex = bulkIndex !== undefined
          ? bulkIndex % trendingTopics.length
          : Math.floor(Math.random() * trendingTopics.length);
        selectedTopic = trendingTopics[randomIndex].title;
        logger.info(`📈 Using trending topic: ${selectedTopic}`, 'openai');
      }
    } catch (err) {
      logger.error(`Failed to fetch trending topics, using default.`, 'openai', err as Error);
      // Fallback to default if trends fail
    }
  }

  // 2. Decide if a CTA should be included (15% chance)
  let finalCtaInstruction = "";
  if (Math.random() < 0.15) {
    const selectedCta = GIBBI_CTAS[Math.floor(Math.random() * GIBBI_CTAS.length)];
    finalCtaInstruction = `Seamlessly integrate this call-to-action: "${selectedCta}"`;
  }

  // 3. Construct the User Prompt
  // This is much simpler now. We just tell the AI what to do, relying on the system prompt for the "how".
  const userPrompt = `
      **Subject:** ${persona.charAt(0).toUpperCase() + persona.slice(1)}
      **Topic:** ${selectedTopic}
      **Tweet Blueprint:** ${selectedBlueprint}
      ${finalCtaInstruction}
    `;

  try {
    logger.info(`Generating tweet with blueprint: ${selectedBlueprint.split(':')[0]}`, 'openai');

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: NEET_MENTOR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 1.1, // High temperature for creative, varied outputs
      max_tokens: 250,
    });

    const rawResponse = completion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new Error("Empty response from AI model");
    }

    // Parse the JSON response, which is more reliable than manual extraction
    const parsedResponse = JSON.parse(rawResponse) as { tweet_content: string; hashtags: string[] };

    let tweetContent = parsedResponse.tweet_content.trim();
    const hashtags = parsedResponse.hashtags || [];

    // Combine content and hashtags
    const finalTweet = `${tweetContent} ${hashtags.join(' ')}`.trim();

    if (finalTweet.length > 280) {
      logger.warn(`Generated tweet is too long (${finalTweet.length}). Truncating.`, 'openai');
      // Simple truncation is fine as a fallback, as the model should usually respect the limit.
      tweetContent = tweetContent.slice(0, 280 - hashtags.join(' ').length - 5) + "...";
    }

    logger.info(`✅ Final tweet (${finalTweet.length} chars): ${finalTweet}`, 'openai');

    return {
      content: finalTweet,
      hashtags: hashtags,
      length: finalTweet.length,
      topic: selectedTopic,
    };

  } catch (err) {
    logger.error("Error generating tweet:", 'openai', err as Error);
    // Provide a safe fallback response
    return {
      content: `🚨 #NEETProTip: Double-check your formulas for '${persona}' questions! A small mistake can cost you big marks. Keep pushing! #NEET #NEETPrep`,
      hashtags: ["#NEETProTip", "#NEET", "#NEETPrep"],
      length: 195,
      topic: "Generic Advice"
    };
  }
}
