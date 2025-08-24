import OpenAI from "openai";
import { getTrendingTopics, TrendingTopic } from "./trending";

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
baseURL: "https://api.deepseek.com",
});

const BASE_DELAY = 2000;

export interface TweetGenerationOptions {
persona: string; // Required, not optional
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
      const trendingTopics = await getTrendingTopics(persona);
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

// Simplified anti-repetition system (database-based would be implemented here)
const antiRepetitionGuard = `
🚫 STRICT ANTI-REPETITION PROTOCOL:

AVOID family references: NO uncle, aunty, mother, father, cousin, grandma, etc.

✅ FRESHNESS REQUIREMENTS:
- Use a COMPLETELY different sentence structure
- Pick an unexplored angle using ${randomArchetype}
- Create a new metaphor/comparison not used before
- If it sounds familiar, SCRAP IT and think of something else
- Surprise even yourself with the punchline direction`;

// Removed overcomplicated creativity injection - let natural humor flow

  // Persona-specific prompt generation
  let basePrompt: string;
  
  const taggingInstruction = "\nWhen mentioning people, celebrities, politicians, or entities, always use their real Twitter handles (e.g., @elonmusk instead of Elon, @narendramodi instead of Modi) instead of just their names.";
  
  if (persona === "product_sage") {
    basePrompt = `You're a hilariously witty Indian product leader with 9 years of building beloved (and sometimes cursed) products. Share brutally funny insights about product decisions.

Write one outrageously funny yet insightful tweet about: ${selectedTopic}

Use ${randomArchetype} style. Roast product decisions while revealing genius "why" behind them. Mix product wisdom with savage Indian humor.

// Examples of the hilarious energy:
- "UPI payments now faster than politicians’ tweets—product wins. #FinTech #ProductHumor"
- "AI-generated features: users complain they’re too smart. #ProductStrategy #UXFail"
- "New Indian super-app roadmap: 17 apps in one, 0 clarity in UX. #DigitalIndia #ProductLife"
- "WhatsApp privacy updates: users panicking, PMs applauding. #ProductDesign #UXHumor"

${taggingInstruction}

${randomTopic?.hashtags && randomTopic.hashtags.length > 0 ? `Use these hashtags: ${randomTopic.hashtags.join(' ')}` : ''}

${antiRepetitionGuard}

Make it so funny that product managers will screenshot it while crying from laughter:`;
  } else {
    // Simplified unhinged satirist prompt - NO family references
    basePrompt = `You're a savage Indian comedian. Write one brutal, hilarious tweet about: ${selectedTopic}

Use ${randomArchetype} style. Be ruthlessly funny about Indian reality. Roast everyone and everything.

STRICT RULE: NO references to family members (uncle, aunty, mother, father, cousin, grandma, etc.)

// Examples of the energy:
- "Digital India: Aadhar update took 3 hours. Crypto wallet verification: 3 minutes. #ModernIndia #TechFail"
- "Metro WiFi: free, invisible, and full of existential dread. #UrbanLife #IndianReality"
- "Startups hype blockchain to solve everything; potholes remain unsolved. #VentureCapital #Satire"
- "Indian politics: trending hashtags change faster than policies. #PolicyHumor #IndianSatire"

${taggingInstruction}

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
    // Better truncation logic to preserve sentence structure
    const maxTruncateLength = maxLength - 3; // Reserve space for "..."
    const truncated = tweet.slice(0, maxTruncateLength);
    
    // Try to find the last complete sentence
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    // If we find a sentence ending within reasonable bounds, use it
    if (lastSentenceEnd > maxTruncateLength * 0.6) {
      tweet = truncated.slice(0, lastSentenceEnd + 1);
    } else {
      // Otherwise, find last complete word
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      if (lastSpaceIndex > maxTruncateLength * 0.7) {
        tweet = truncated.slice(0, lastSpaceIndex);
      } else {
        // Last resort: clean cut with ellipsis
        tweet = truncated + '...';
      }
    }
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

// Personas are managed centrally
export const personas = [
  { id: "unhinged_satirist", name: "Unhinged Satirist", emoji: "🃏" },
  { id: "product_sage", name: "Product Sage", emoji: "🎯" },
];

export function getPersonas() {
  return personas;
}