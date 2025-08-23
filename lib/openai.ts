import OpenAI from "openai";
import { getTrendingTopics, TrendingTopic } from "./trending";
import fs from "fs/promises"; // Use promises for async file operations

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
baseURL: "https://api.deepseek.com",
});

const BASE_DELAY = 2000;

export interface TweetGenerationOptions {
persona: "unhinged_satirist" | "desi_philosopher" | "vibe_coder"; // Required, not optional
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
  maxLength = 270,
  customPrompt,
  useTrendingTopics = true,
} = options;

let selectedTopic: string = customPrompt || "General Satire";
let randomTopic: TrendingTopic | null = null;

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
        
        randomTopic = trendingTopics[randomIndex];
        selectedTopic = randomTopic.title;
        console.log(`📈 Using RSS-sourced trending topic (${bulkIndex !== undefined ? 'bulk #' + bulkIndex : 'single'}): ${randomTopic.title}`);
        break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`⚠️ Failed to fetch trending topics (attempt ${attempt}/3): ${message}`);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * 2 ** (attempt - 1)));
      } else {
        console.warn("⚠️ Failed to fetch trending topics after 3 attempts, proceeding without trends");
        selectedTopic = "Breaking News & Current Events";
      }
    }
  }
} else if (customPrompt) {
  selectedTopic = customPrompt;
} else if (!useTrendingTopics) {
  selectedTopic = "Current Indian Reality";
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

// Enhanced anti-repetition system: analyze last 20 tweets for patterns
let antiRepetitionGuard = "";
let structuralPatterns: string[] = [];
let themeKeywords: string[] = [];

try {
  const data = await fs.readFile("data/tweets.json", "utf8");
  const tweetsData: Array<{ content: string }> = JSON.parse(data);
  const recent20 = tweetsData.slice(-20).map((t) => t.content);
  
  if (recent20.length > 0) {
    // Extract structural patterns (sentence starters, formats)
    structuralPatterns = recent20.map(tweet => {
      const words = tweet.split(' ');
      if (words.length >= 3) {
        // Get first 3 words pattern and last word pattern
        return `${words.slice(0, 3).join(' ')} ... ${words[words.length - 1]}`;
      }
      return tweet.slice(0, 30);
    });
    
    // Extract theme keywords (excluding common words)
    const allWords = recent20.join(' ').toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && 
        !['this', 'that', 'with', 'when', 'where', 'while', 'india', 'indian'].includes(word));
    
    const wordFreq = allWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    themeKeywords = Object.entries(wordFreq)
      .filter(([, count]) => count >= 2)
      .map(([word]) => word)
      .slice(0, 8);

    antiRepetitionGuard = `
🚫 STRICT ANTI-REPETITION PROTOCOL:

AVOID these overused structural patterns:
${structuralPatterns.slice(0, 5).map((p, i) => `${i + 1}. ${p}`).join('\n')}

AVOID these overused themes/keywords: ${themeKeywords.join(', ')}

✅ FRESHNESS REQUIREMENTS:
- Use a COMPLETELY different sentence structure
- Pick an unexplored angle using ${randomArchetype}
- Create a new metaphor/comparison not used before
- If it sounds familiar, SCRAP IT and think of something else
- Surprise even yourself with the punchline direction`;
  }
} catch (err) {
  console.warn("Could not read tweets.json for anti-repetition analysis:", err);
}

// Removed overcomplicated creativity injection - let natural humor flow

  // Persona-specific prompt generation
  let basePrompt: string;
  
  if (persona === "desi_philosopher") {
    basePrompt = `You're a wise but sarcastic Indian philosopher who finds ancient wisdom in modern chaos. 

Write one funny philosophical tweet about: ${selectedTopic}

Use ${randomArchetype} style. Connect ancient Indian philosophy (karma, dharma, maya, moksha) to today's absurd reality. Be witty, not preachy.

Examples:
- "Karma is when your startup pitch gets rejected because Mercury is in microwave"
- "According to Vedanta, suffering is an illusion. So is my bank balance after GST"
- "Buddha said desire leads to suffering. Clearly he never tried canceling a Jio plan"

${randomTopic?.hashtags && randomTopic.hashtags.length > 0 ? `Use these hashtags: ${randomTopic.hashtags.join(' ')}` : ''}

${antiRepetitionGuard}

Make it quotable and genuinely funny:`;
  } else if (persona === "vibe_coder") {
    basePrompt = `You're a chill Indian developer who finds humor in coding life and tech culture. 

Write one relatable, funny tweet about: ${selectedTopic}

Use ${randomArchetype} style. Mix coding references with Indian developer reality. Be witty and relatable, not cynical.

Examples of the vibe:
- "My code works on my machine the way my mom's food works in our kitchen - perfect conditions, magical results"
- "Debugging at 2 AM hits different. It's like having deep conversations with your bugs about life choices"
- "Stack Overflow is basically our senior developer who never gets tired of explaining the same thing 1000 times"
- "Git commit messages reflect my emotional journey: 'initial commit' → 'fix bug' → 'PLEASE WORK' → 'I give up'"

${randomTopic?.hashtags && randomTopic.hashtags.length > 0 ? `Use these hashtags: ${randomTopic.hashtags.join(' ')}` : ''}

${antiRepetitionGuard}

Make it something fellow developers will relate to and share:`;
  } else {
    // Simplified unhinged satirist prompt
    basePrompt = `You're a savage Indian comedian. Write one brutal, hilarious tweet about: ${selectedTopic}

Use ${randomArchetype} style. Be ruthlessly funny about Indian reality. Roast everyone and everything.

Examples of the energy:
- "Digital India: where AI startups raise millions while government sites still ask for Internet Explorer"
- "Inflation so bad, even God stopped accepting coconuts — he switched to UPI"  
- "Stock market rising, jobs falling — it's basically a yoga pose called Middle Class Collapse"
- "India's youth: Too qualified for arranged marriages, too broke for love marriages"

${randomTopic?.hashtags && randomTopic.hashtags.length > 0 ? `Use these hashtags: ${randomTopic.hashtags.join(' ')}` : ''}

${antiRepetitionGuard}

Write something people will screenshot and quote. Be savage:`;
  }
  

try {
  console.log("🚀 Generating tweet...");
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "user", content: basePrompt }],
    max_tokens: Math.min(120, Math.ceil(maxLength / 2)),
    temperature: bulkIndex !== undefined ? 
      1.3 + (bulkIndex * 0.15) % 0.5 : // 1.3 to 1.8 range for bulk generation
      1.4, // Higher temperature for funnier, more creative outputs
  });

  let tweet = completion.choices[0]?.message?.content?.trim();
  if (!tweet) throw new Error("Empty response from model");

  if (tweet.length > maxLength) {
    // Find last complete word before maxLength to avoid awkward truncation
    const truncated = tweet.slice(0, maxLength - 1);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    tweet = lastSpaceIndex > maxLength * 0.7 ? truncated.slice(0, lastSpaceIndex) : truncated;
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
  
  // If no hashtags were generated, return empty array - let AI handle it
  if (cleanHashtags.length === 0) {
    return []; // Let AI generate meaningful hashtags
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
{
  id: "desi_philosopher",
  name: "Desi Philosopher",
  description:
    "Ancient wisdom meets modern chaos with philosophical insights",
  emoji: "🧘‍♂️",
},
{
  id: "vibe_coder",
  name: "Vibe Coder",
  description:
    "Chill Indian developer sharing relatable coding life humor",
  emoji: "💻",
},
] as const;