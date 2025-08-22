import OpenAI from "openai";
import { getTrendingTopics, TrendingTopic } from "./trending";
import fs from "fs/promises"; // Use promises for async file operations

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
baseURL: "https://api.deepseek.com",
});

const BASE_DELAY = 2000;

export interface TweetGenerationOptions {
persona: "unhinged_satirist" | "desi_philosopher"; // Required, not optional
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

export async function generateTweet(options: TweetGenerationOptions, bulkIndex?: number): Promise<TweetResponse> {
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
        // For bulk generation, try to select different topics by using bulkIndex as seed
        let randomIndex;
        if (bulkIndex !== undefined && trendingTopics.length > 1) {
          // Use a combination of bulkIndex and random for better distribution
          const seed = (bulkIndex * 3 + Math.floor(Math.random() * 5)) % trendingTopics.length;
          randomIndex = seed;
        } else {
          randomIndex = Math.floor(Math.random() * trendingTopics.length);
        }
        
        const randomTopic: TrendingTopic = trendingTopics[randomIndex];
        trendingContext = `Trending topic: ${randomTopic.title} (${randomTopic.traffic} searches). Use ${randomTopic.hashtag} only if it helps the joke.`;
        selectedTopic = randomTopic.title;
        console.log(`📈 Using trending topic (${bulkIndex !== undefined ? 'bulk #' + bulkIndex : 'single'}): ${randomTopic.title}`);
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
// Select comedy archetype with better distribution for bulk generation
let randomArchetype;
if (bulkIndex !== undefined) {
  // For bulk generation, ensure different archetypes by cycling through them
  const archetypeIndex = (bulkIndex + Math.floor(Math.random() * 3)) % comedyArchetypes.length;
  randomArchetype = comedyArchetypes[archetypeIndex];
} else {
  randomArchetype = comedyArchetypes[Math.floor(Math.random() * comedyArchetypes.length)];
}

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

// Add randomness seed for bulk generation variety
const randomnessSeed = bulkIndex !== undefined ? 
  `\n🎲 VARIATION SEED ${bulkIndex}-${Math.random().toString(36).substring(2, 7)}: Use this to inspire a COMPLETELY DIFFERENT angle, tone, or approach. Make this tweet UNIQUE from others in the batch!\n` : 
  '';

  // Persona-specific prompt generation
  let basePrompt: string;
  
  if (persona === "desi_philosopher") {
    basePrompt = `${randomnessSeed}
    You are a **modern Desi Philosopher** - a wise sage who observes life through ancient Indian wisdom but speaks about today's chaos.
    Write ONE profound, witty, philosophical tweet that connects timeless wisdom with contemporary Indian reality.
    
    RULES:
    - Blend ANCIENT WISDOM with MODERN CHAOS (Vedanta meets startup culture, Karma meets crypto, etc.)
    - Use philosophical concepts: Dharma, Karma, Maya (illusion), Samsara (cycle), Moksha (liberation)
    - Reference: Bhagavad Gita wisdom, Buddhist insights, Sufi mysticism, or Upanishadic thoughts
    - Make it RELATABLE to modern Indians: relate ancient truths to traffic jams, social media, work stress
    - 🚫 Avoid preachy or overly serious tone. Keep it WISE but ACCESSIBLE.
    - ✅ Must connect to **real Indian experiences today** (tech addiction, inflation, relationships, career pressure)
    - Sanskrit/Hindi terms allowed for authenticity (with context)
    - Max length: ${maxLength} characters.
    - ${includeHashtags 
        ? "Add 1-2 meaningful hashtags that reflect both wisdom and relevance (e.g. #ModernKarma, #DigitalDetox, #LifeWisdom). Avoid generic spiritual hashtags." 
        : "No hashtags."}
    
    TONE:
    - Wise, contemplative, but with gentle humor
    - Like a friendly uncle who's read too much philosophy but still gets modern life
    - Use ${randomArchetype} for delivery — but filtered through philosophical lens
    - Should feel like Osho meets a WhatsApp forward, but actually profound
    
    CONTEXT:
    ${trendingContext}${previousTweetsAvoidance}
    
    EXAMPLES (the wisdom to channel):
    - "Buddha said desire causes suffering. He clearly never tried to cancel a Zomato order mid-delivery."
    - "Karma is just life's way of making sure your ex sees you at the grocery store when you look terrible."
    - "The Gita teaches detachment from results. Perfect for Indian stock market investors."
    - "In the age of notifications, true moksha is turning your phone to silent mode."
    `;
  } else {
    // Original unhinged satirist prompt
    basePrompt = `${randomnessSeed}
    You are an **Indian Hasya-Kavi turned Twitter satirist** with the persona "${persona}".
    Write ONE savage, witty, darkly hilarious one-liner tweet. 
    It should feel like a mic-drop punchline, not a safe observation.
    
    RULES:
    - Humor must be DARK, ABSURD, or MERCILESS. Make people laugh *and* wince.
    - Ridiculous exaggeration is encouraged — take real truths to grotesque extremes.
    - Satire must bite: mock hypocrisy, stupidity, corruption, tech hype, lifestyle madness.
    - 🚫 Do NOT write safe or generic jokes. 🚫 No filler like weddings, chai-wallahs, or "Indian parents" clichés.
    - ✅ Must reference **real phenomena in India today** (politics, economy, tech, startups, culture, society).
    - Hinglish allowed if it makes it punchier.
    - Max length: ${maxLength} characters.
    - ${includeHashtags 
        ? "Add 1–2 brutal but topical hashtags. They must be real-world relevant, short, and CamelCase (e.g. #TechLayoffs, #StartupStruggles, #InflationIndia). Avoid nonsense or personal hashtags." 
        : "No hashtags."}
    
    TONE:
    - Brutal, fearless, and laugh-out-loud ridiculous.
    - Always darkly comic: make people *gasp* then laugh.
    - Use ${randomArchetype} for delivery — but twisted toward dark satire.
    - Should feel like an underground Hasya-Kavi roast of Indian society.
    
    CONTEXT:
    ${trendingContext}${previousTweetsAvoidance}
    
    EXAMPLES (the vibe to beat):
    - "Digital India: where AI startups raise millions while government sites still ask for Internet Explorer."
    - "Inflation so bad, even God stopped accepting coconuts — he switched to UPI."
    - "Stock market rising, jobs falling — it's basically a yoga pose called Middle Class Collapse."
    - "In India, therapy is just parents reminding you they sacrificed more than your mental health is worth."
    `;
  }
  

try {
  console.log("🚀 Generating tweet...");
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "user", content: basePrompt }],
    max_tokens: Math.min(120, Math.ceil(maxLength / 2)),
    temperature: bulkIndex !== undefined ? 
      1.1 + (bulkIndex * 0.1) % 0.4 : // 1.1 to 1.5 range for bulk generation
      1.2, // Standard temperature for single generation
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