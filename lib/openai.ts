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

// Infuse variability with comedy archetypes from top influential comedians
const comedyArchetypes = [
  "observational comedy (Jerry Seinfeld style) - finding absurdity in everyday mundane situations",
  "self-deprecating roast (Russell Peters style) - turning personal/cultural flaws into punchlines",
  "social commentary (George Carlin style) - exposing societal hypocrisies with sharp wit",
  "absurdist exaggeration (Dave Chappelle style) - taking real situations to ridiculous extremes",
  "deadpan irony (Steven Wright style) - delivering shocking truths with matter-of-fact delivery",
  "storytelling humor (Kevin Hart style) - turning relatable experiences into comedic narratives",
  "political satire (John Oliver style) - dissecting current events with intelligent mockery",
  "cultural mashup (Aziz Ansari style) - blending traditional and modern perspectives for contrast",
  "wordplay and puns (Robin Williams style) - clever linguistic manipulation for humor",
  "dark humor (Louis C.K. style) - finding comedy in uncomfortable truths",
  "physical comedy concepts (Mr. Bean style) - describing visual absurdity in words",
  "improvisational wit (Whose Line style) - quick, unexpected connections and callbacks"
];
const randomArchetype = comedyArchetypes[Math.floor(Math.random() * comedyArchetypes.length)];

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

Think deeper: Use a ${randomArchetype} approach, a fresh perspective, and a unique metaphor to create an original tweet.`;
  }
} catch (err) {
  console.warn("Could not read tweets.json for uniqueness infusion:", err);
}

const basePrompt = `
You are an **Indian Hasya-Kavi turned Twitter satirist** with the persona "${persona}".
Your job: write ONE brilliant, witty, poetic one-liner tweet that is TOPICAL or TIMELESS.

CONTENT REQUIREMENTS:
- Must be either TOPICAL (about current events, trending issues, recent news) or TIMELESS (universal truths about Indian life)
- Sharp social commentary wrapped in humor about real, specific situations
- Reference actual phenomena, not generic scenarios
- Topics can range from: politics, economics, tech, culture, society, current events, lifestyle trends
- NO generic "AI speaks 20 languages but..." type content
- NO made-up scenarios about "chai-wallah" or random characters
- Focus on REAL, RELATABLE situations Indians face today

STYLE RULES:
- Punchy, funny, and intelligent satire with bite
- Maintain the rhythm and exaggeration of Hasya-Kavi poetry, but Twitter-friendly
- Always feel topical and alive (today's India)
- Hinglish is welcome if it adds authentic flavor
- ${includeHashtags ? "Include 1-2 TOPICAL, TREND-FOCUSED hashtags that relate to current events, tech trends, or specific issues mentioned in the tweet. Make them CamelCase, short (max 25 chars), and newsworthy. Examples: #AIRevolution #StartupStruggles #CryptoReality #EdTechBoom #FinTechIndia #ClimateAction #TechLayoffs #UberEats. AVOID generic family/personal hashtags like #FamilyDrama #IndianParents." : "Do not include hashtags."}
- Maximum ${maxLength} characters
- Only output the tweet text, nothing else

TONE:
- Clever, biting, and shareable
- Use ${randomArchetype} approach for maximum comedic impact
- Sound timeless but tied to current realities
- Intelligent enough for a professor, funny enough for a chaiwala

${trendingContext}${previousTweetsAvoidance}

GOOD EXAMPLES WITH PROPER HASHTAGS:
- "Government speed: launches Digital India, but WiFi still on buffalo speed. #DigitalIndia #TechInIndia"
- "Inflation ne kya jadoo kiya hai, ab middle class bhi premium lagti hai. #InflationIndia #MiddleClass"
- "Stock market touching the sky, but my portfolio touching my heart. #Investing #StockMarket"
- "Netflix asks 'Are you still watching?' and I reply 'Are you still charging?' #Netflix #StreamingLife"

GOOD TOPICAL HASHTAG EXAMPLES:
#AIRevolution #TechLayoffs #StartupStruggles #CryptoReality #EdTechBoom #FinTechIndia #ClimateAction #EVRevolution #5GIndia #DigitalPayments #WorkFromHome #GigEconomy #InflationIndia #PropertyMarket #StockMarket

AVOID BAD HASHTAGS LIKE:
- #GooGle4ogmaigMadeby (gibberish)
- #FlatFlatmatesMore (repetitive)
- #RoadPeaceRussiaUkra (truncated)
- #MumbaiSocialClubWee (nonsensical ending)
- Random concatenations or corrupted text
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
  const rawHashtags = text.match(regex) || [];
  
  // Clean and validate hashtags
  const cleanHashtags = rawHashtags
    .map(tag => {
      // Remove the # to work with the text
      let cleanTag = tag.slice(1);
      
      // Remove any numbers that make it look corrupted (like "4ogmaig")
      cleanTag = cleanTag.replace(/[0-9]+[a-z]+[0-9]*[a-z]*/g, '');
      
      // Remove common corrupted patterns
      cleanTag = cleanTag.replace(/([a-z])([A-Z]){2,}/g, '$1'); // Remove multiple caps
      cleanTag = cleanTag.replace(/(.)\1{2,}/g, '$1'); // Remove repeated chars
      
      // Truncate if too long, but preserve word boundaries
      if (cleanTag.length > 25) {
        // Try to find a good break point (camelCase boundary)
        let truncated = cleanTag.slice(0, 25);
        const lastCapIndex = truncated.lastIndexOf(truncated.match(/[A-Z]/g)?.slice(-1)[0] || '');
        if (lastCapIndex > 5) {
          truncated = cleanTag.slice(0, lastCapIndex);
        }
        cleanTag = truncated;
      }
      
      // Only return if it has reasonable length and doesn't look corrupted
      if (cleanTag.length >= 3 && cleanTag.length <= 15 && /^[A-Za-z][A-Za-z0-9]*$/.test(cleanTag)) {
        return '#' + cleanTag;
      }
      
      return null;
    })
    .filter(Boolean) // Remove null values
    .slice(0, 2); // Limit to 2 hashtags
  
  // If we couldn't clean the hashtags properly, use fallback
  if (cleanHashtags.length === 0) {
    return ['#IndianLife']; // Safe fallback
  }
  
  return cleanHashtags as string[];
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