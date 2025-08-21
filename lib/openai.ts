import OpenAI from "openai";
import { getTrendingTopics, TrendingTopic } from "./trending";
import fs from "fs/promises"; // Use promises for async file operations

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const BASE_DELAY = 2000;

export interface TweetGenerationOptions {
  persona: "unhinged_satirist"; // Required, not optional
  includeHashtags?: boolean;
  maxLength?: number;
  customPrompt?: string;
  useTrendingTopics?: boolean;
}

export interface TweetResponse {
  content: string;
  hashtags: string[];
  length: number;
  topic: string;
}

export async function generateTweet(options: TweetGenerationOptions): Promise<TweetResponse> {
  const {
    persona, // Required, no default
    includeHashtags = true,
    maxLength = 280,
    customPrompt,
    useTrendingTopics = true,
  } = options;

  let trendingContext = "";
  let selectedTopic: string = customPrompt || "General Satire";

  if (useTrendingTopics && !customPrompt) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const trendingTopics = await getTrendingTopics();
        if (trendingTopics.length > 0) {
          const randomTopic: TrendingTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
          trendingContext = `Trending topic: ${randomTopic.title} (${randomTopic.traffic} searches). Use ${randomTopic.hashtag} only if it helps the joke.`;
          selectedTopic = randomTopic.title;
          console.log(`📈 Using trending topic: ${randomTopic.title}`);
          break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`⚠️ Failed to fetch trending topics (attempt ${attempt}/3): ${message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, BASE_DELAY * 2 ** (attempt - 1)));
        } else {
          console.warn("⚠️ Failed to fetch trending topics after 3 attempts, proceeding without trends");
          trendingContext = "Generate a witty satirical tweet about current Indian life, culture, or society.";
          selectedTopic = "General Indian Satire";
        }
      }
    }
  } else if (customPrompt) {
    trendingContext = `Context: ${customPrompt}`;
    selectedTopic = customPrompt;
  } else if (!useTrendingTopics) {
    // No trends, no custom prompt - generate general satirical content
    trendingContext = "Generate a witty satirical tweet about current Indian life, culture, or society.";
    selectedTopic = "General Indian Satire";
  }

  // Infuse variability with random satire angle
  const satireAngles = [
    "roast",
    "parody",
    "absurd exaggeration",
    "irony",
    "wordplay",
    "self-deprecating humor",
    "observational comedy",
    "surreal humor",
    "dark satire",
    "cultural mashup",
  ];
  const randomAngle = satireAngles[Math.floor(Math.random() * satireAngles.length)];

  // Check tweets.json for last 10 jokes to ensure uniqueness
  let previousTweetsAvoidance = "";
  try {
    const data = await fs.readFile("data/tweets.json", "utf8");
    const tweetsData: Array<{ content: string }> = JSON.parse(data);
    const last10 = tweetsData.slice(-10).map((t) => t.content);
    if (last10.length > 0) {
      previousTweetsAvoidance = `
Avoid repeating themes, structures, or punchlines from these previous tweets:
${last10.map((t) => `- ${t}`).join("\n")}

Think deeper: Use a ${randomAngle} style, a fresh perspective, and a unique metaphor to create an original tweet.`;
    }
  } catch (err) {
    console.warn("Could not read tweets.json for uniqueness infusion:", err);
  }

  const basePrompt = `
You are an **Indian Hasya-Kavi turned Twitter satirist** with the persona "${persona}".
Your job: write ONE brilliant, witty, poetic one-liner tweet.

Rules:
- It must be punchy, funny, and intelligent satire.
- Maintain the rhythm and exaggeration of Hasya-Kavi poetry, but keep it short for Twitter.
- Sharp social commentary wrapped in humor.
- Always feel topical and alive (today’s India).
- Topics can range from geopolitics
- Hinglish is welcome if it adds flavor.
- ${includeHashtags ? "Include 1-2 relevant, short hashtags that are meaningful (like #StartupLife #TechHumor)." : "Do not include hashtags."}
- Maximum ${maxLength} characters.
- Only output the tweet text, nothing else.

Tone:
- Clever, biting, and shareable.
- Surprising perspective using ${randomAngle} style.
- Sound timeless but tied to the current moment.
- Intelligent enough for a professor, funny enough for a chaiwala.

${trendingContext}${previousTweetsAvoidance}

Examples of style:
- "Government speed: launches Digital India, but WiFi still on buffalo speed."
- "Inflation ne kya jadoo kiya hai, ab middle class bhi premium lagti hai."
`;

  try {
    console.log("🚀 Generating tweet...");
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: basePrompt }],
      max_tokens: Math.min(120, Math.ceil(maxLength / 2)),
      temperature: 1.2, // Higher temperature for variability
    });

    let tweet = completion.choices[0]?.message?.content?.trim();
    if (!tweet) throw new Error("Empty response from model");

    if (tweet.length > maxLength) {
      tweet = tweet.slice(0, maxLength - 1) + "…";
    }

    return {
      content: tweet,
      hashtags: extractHashtags(tweet),
      length: tweet.length,
      topic: selectedTopic,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Error generating tweet:", message);
    throw new Error("Tweet generation failed");
  }
}

function extractHashtags(text: string): string[] {
  const regex = /#[a-zA-Z0-9_]+/g;
  return text.match(regex) || [];
}

export const personas = [
  {
    id: "unhinged_satirist",
    name: "Unhinged Satirist",
    description:
      "Sharp Indian poet-comedian blending Hasya-Kavi rhythm with modern satire",
    emoji: "🃏",
  },
] as const;