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
        
        // Enhanced context with RSS source attribution and richer topical information
        const sourceAttribution = randomTopic.category ? ` (Source: ${randomTopic.category})` : '';
        const trafficInfo = randomTopic.traffic ? ` trending with ${randomTopic.traffic} searches` : '';
        const authorInfo = randomTopic.author ? ` from ${randomTopic.author}` : '';
        
        trendingContext = `🔥 LIVE TRENDING TOPIC${sourceAttribution}: "${randomTopic.title}"${trafficInfo}${authorInfo}
        
📊 COMEDY ANGLE INSTRUCTIONS:
- This is REAL, CURRENT content from RSS feeds - make it feel immediate and relevant
- Reference specific elements from the topic title to show you're plugged into what's happening NOW
- Use the trend's momentum to amplify your punchline
- Make people feel like you're commenting on something they just saw in their feed
- ${randomTopic.hashtags.length > 0 ? `MUST USE these real trending hashtags: ${randomTopic.hashtags.join(' ')} - these are actual trending hashtags from the source, don't modify them` : 'Only generate a hashtag if absolutely necessary for the joke - prefer no hashtags over generic ones'}`;
        
        selectedTopic = randomTopic.title;
        console.log(`📈 Using RSS-sourced trending topic (${bulkIndex !== undefined ? 'bulk #' + bulkIndex : 'single'}): ${randomTopic.title}${sourceAttribution}`);
        break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`⚠️ Failed to fetch trending topics (attempt ${attempt}/3): ${message}`);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * 2 ** (attempt - 1)));
      } else {
        console.warn("⚠️ Failed to fetch trending topics after 3 attempts, proceeding without trends");
        trendingContext = "🎯 REAL NEWS FOCUS: Create satirical commentary on ACTUAL current events - government policies, economic announcements, geopolitics, tech industry news, startup funding/layoffs, cricket matches/IPL, political developments, market movements, or breaking news that's happening RIGHT NOW. NO food delivery, wedding, or generic lifestyle jokes.";
        selectedTopic = "Breaking News & Current Events";
      }
    }
  }
} else if (customPrompt) {
  trendingContext = `Context: ${customPrompt}`;
  selectedTopic = customPrompt;
} else if (!useTrendingTopics) {
  // No trends, no custom prompt - generate topical satirical content
  trendingContext = "🎯 CURRENT AFFAIRS SATIRE: Focus on TODAY'S actual news - Modi government policies, RBI decisions, startup funding rounds, tech company layoffs, cricket matches, election developments, market crashes/rallies, or regulatory changes. Be SPECIFIC about real events, not generic lifestyle humor.";
  selectedTopic = "Today's News & Events";
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

// Enhanced creativity injection system
const creativityBoosts = [
  "Start with the opposite of what people expect",
  "Use an absurd metaphor from Indian mythology",
  "Apply startup terminology to ancient problems",
  "Flip a common saying on its head",
  "Combine two unrelated Indian phenomena",
  "Use a medical/scientific analogy for social issues",
  "Apply film/TV logic to real-world problems",
  "Use food analogies for non-food topics",
  "Apply gaming terminology to life situations",
  "Use wedding/marriage metaphors for non-relationship topics"
];

const perspectiveShifts = [
  "from the POV of an inanimate object",
  "as if explaining to aliens",
  "through the lens of your grandmother",
  "as a news headline from 2050",
  "like a frustrated app notification",
  "as a product review of life",
  "through the eyes of street dogs",
  "as a WhatsApp group admin announcement"
];

let creativityInjection = '';
if (bulkIndex !== undefined) {
  const boostIndex = bulkIndex % creativityBoosts.length;
  const shiftIndex = Math.floor(bulkIndex / creativityBoosts.length) % perspectiveShifts.length;
  creativityInjection = `\n🎨 CREATIVITY INJECTION #${bulkIndex}:
- Approach: ${creativityBoosts[boostIndex]}
- Perspective: ${perspectiveShifts[shiftIndex]}
- Make this tweet feel like it came from a different planet than the others in this batch!\n`;
} else {
  const randomBoost = creativityBoosts[Math.floor(Math.random() * creativityBoosts.length)];
  const randomShift = perspectiveShifts[Math.floor(Math.random() * perspectiveShifts.length)];
  creativityInjection = `\n🎨 CREATIVITY INJECTION:
- Approach: ${randomBoost}
- Perspective: ${randomShift}\n`;
}

  // Persona-specific prompt generation
  let basePrompt: string;
  
  if (persona === "desi_philosopher") {
    basePrompt = `${creativityInjection}
    You are a **modern Desi Philosopher** - a wise sage who observes life through ancient Indian wisdom but speaks about today's chaos.
    Write ONE profound, witty, philosophical tweet that connects timeless wisdom with contemporary Indian reality.
    
    COMEDY ENHANCEMENT RULES:
    - SURPRISE FACTOR: Start with an unexpected philosophical angle that catches people off-guard
    - LAYERED HUMOR: Surface level should be funny, deeper level should be profound
    - TIMING: Build to a philosophical punchline that lands like a mic drop
    - CONTRAST: Maximum gap between ancient wisdom and absurd modern reality
    
    CONTENT RULES:
    - Blend ANCIENT WISDOM with TODAY'S HEADLINES using ${randomArchetype} delivery
    - Use philosophical concepts: Dharma, Karma, Maya (illusion), Samsara (cycle), Moksha (liberation)
    - Reference: Bhagavad Gita wisdom, Buddhist insights, Sufi mysticism, or Upanishadic thoughts
    - Connect philosophy to ACTUAL current events: government policies, market movements, tech layoffs, cricket matches, political drama
    - 🚫 Avoid preachy tone and generic lifestyle observations. Keep it WISE but TOPICAL.
    - ✅ Must reference **specific current events or news** happening in India TODAY
    - Sanskrit/Hindi terms allowed for comedic effect (with context)
    - Max length: ${maxLength} characters.
    - ${includeHashtags 
        ? "If the trending topic has real hashtags, USE THEM EXACTLY. Otherwise, only create a hashtag if it genuinely adds value to the philosophical insight. Avoid generic tags like #IndianLife, #India, #Life." 
        : "No hashtags."}
    
    TONE MASTERY:
    - Like a stand-up comedian who accidentally became enlightened
    - Deliver profound truths through absurd observations
    - Use ${randomArchetype} for delivery — but filtered through philosophical lens
    - Should feel like if Buddha had a Twitter account and a sense of humor
    
    CONTEXT:
    ${trendingContext}${antiRepetitionGuard}
    
    `;
  } else {
    // Enhanced unhinged satirist prompt
    basePrompt = `${creativityInjection}
    You are an **Indian Hasya-Kavi turned Twitter comedian** with the persona "${persona}".
    Write ONE savage, witty, darkly hilarious one-liner tweet that will make people screenshot it.
    This should be LEGENDARY-LEVEL comedy that people quote for weeks.
    
    COMEDY MASTERY RULES:
    - SETUP + PUNCHLINE PERFECTION: Build tension, then release with unexpected twist
    - LAYERS OF IRONY: Multiple levels of humor that hit different people differently  
    - CULTURAL SPECIFICITY: So Indian that NRIs feel homesick reading it
    - SHOCK VALUE: Make people go "Did they really just say that?" followed by uncontrollable laughter
    - QUOTABILITY: Write something people will steal and use in conversations
    
    CONTENT RULES:
    - Apply ${randomArchetype} delivery to TODAY'S ACTUAL NEWS
    - Ridiculous exaggeration is REQUIRED — make reality sound like satire
    - Ridicule all political parties, institutions, and sacred cows
    - 🚫 BANNED: Food delivery jokes, wedding/chai/parents clichés, AI jokes, generic lifestyle observations
    - ✅ MUST REFERENCE: SPECIFIC current events - government announcements, startup news, cricket scores, market movements, policy changes, political developments
    - Hinglish ENCOURAGED if it amplifies the punchline
    - Max length: ${maxLength} characters.
    - ${includeHashtags 
        ? "If the trending topic has real hashtags, USE THEM EXACTLY - these are viral hashtags from actual sources. Otherwise, only create a hashtag if it makes the joke significantly funnier. Avoid generic tags like #IndianLife, #India, #Life." 
        : "No hashtags."}
    
    TONE MASTERY:
    - Confidence of a stand-up headliner delivering their killer closing bit
    - Sharp enough to cut glass, funny enough to cure depression
    - Use ${randomArchetype} for delivery style
    - Should feel like if George Carlin was reborn as an Indian millennial
    
    CONTEXT:
    ${trendingContext}${antiRepetitionGuard}
    
    LEGENDARY EXAMPLES TO SURPASS:
    - "Digital India: where AI startups raise millions while government sites still ask for Internet Explorer."
    - "Inflation so bad, even God stopped accepting coconuts — he switched to UPI."
    - "Stock market rising, jobs falling — it's basically a yoga pose called Middle Class Collapse."
    - "India's youth: Too qualified for arranged marriages, too broke for love marriages."
    
    🎯 YOUR MISSION: Write something funnier than these examples. Make it UNFORGETTABLE.
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
] as const;