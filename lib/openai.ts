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
  selectedTopic = "Test Preparation Strategy";
}

// Viral content types for maximum engagement and shareability
const viralContentTypes = [
  "Question of the Day - challenging practice problem with answer reveal and engagement hooks",
  "Spot the Trap - common mistake 99% of students make with dramatic reveal",
  "30-Second Challenge - time-pressured problem solving with countdown urgency",
  "Quick Win Tip - bite-sized strategy hack for immediate score improvement",
  "Test Trap Alert - warning about sneaky question patterns that fool most students",
  "Speed Round - rapid-fire questions with competitive timing elements"
];
// Select viral content type with better distribution for bulk generation
let randomViralType;
if (bulkIndex !== undefined) {
  // For bulk generation, ensure different viral types by cycling through them
  const viralIndex = (bulkIndex + Math.floor(Math.random() * 3)) % viralContentTypes.length;
  randomViralType = viralContentTypes[viralIndex];
} else {
  randomViralType = viralContentTypes[Math.floor(Math.random() * viralContentTypes.length)];
}

// Viral engagement techniques for maximum shareability
const viralEngagementHooks = [
  "start with dramatic statements like '99% of students miss this'",
  "create urgency with countdown language 'Solve in 30 seconds!'",
  "use competitive hooks 'Can you beat yesterday's average?'",
  "pose direct challenges 'RT if you got this right!'",
  "create curiosity gaps 'The answer will shock you'",
  "use specific numbers for credibility '87% of test-takers fall for this trap'",
  "add call-to-action endings 'Comment your answer below!'",
  "create shareability with 'Tag someone who needs to see this'"
];

const randomViralHook = bulkIndex !== undefined ? 
  viralEngagementHooks[(bulkIndex + Math.floor(Math.random() * 2)) % viralEngagementHooks.length] :
  viralEngagementHooks[Math.floor(Math.random() * viralEngagementHooks.length)];

// Occasional Gibbi AI traffic drivers (use sparingly - not every tweet)
const gibbiCTAs = [
  "Want unlimited practice questions like this? Check out gibbi.vercel.app",
  "Ready for a full quiz challenge? Try gibbi.vercel.app",
  "Create your own custom quizzes at gibbi.vercel.app",
  "Master more questions like this at gibbi.vercel.app"
];

const shouldIncludeGibbiCTA = Math.random() < 0.15; // 15% chance to include Gibbi mention
const selectedGibbiCTA = shouldIncludeGibbiCTA ? 
  gibbiCTAs[Math.floor(Math.random() * gibbiCTAs.length)] : "";

// Viral content quality guidelines
const contentQualityGuard = `
🔥 VIRAL EDUCATIONAL CONTENT:

✅ VIRAL REQUIREMENTS:
- ${randomViralHook}
- Use dramatic, attention-grabbing language that demands engagement
- Include specific timing pressure or competitive elements
- Create immediate urge to share, comment, or RT
- Content Type: ${randomViralType}
- End with clear engagement hooks (questions, challenges, CTAs)
${shouldIncludeGibbiCTA ? `- Include this CTA: ${selectedGibbiCTA}` : ""}`;

// Personality injection for natural voice
const personalityTraits = [
  "confident mentor who's been there",
  "encouraging coach celebrating small wins", 
  "wise strategist sharing battle-tested tactics",
  "supportive friend who gets the pressure",
  "experienced guide revealing shortcuts",
  "motivational teacher igniting potential"
];

const selectedPersonality = personalityTraits[Math.floor(Math.random() * personalityTraits.length)];

  // Persona-specific prompt generation
  let basePrompt: string;
  
  const hashtagInstruction = "\nInclude 2-3 VIRAL hashtags for maximum engagement (e.g., #QuestionOfTheDay, #30SecondChallenge, #SpotTheTrap, #TestTrap, #SolveThis, #ChallengeMeBack).";
  
  if (persona === "sat_coach") {
    basePrompt = `You are a ${selectedPersonality} creating VIRAL SAT content about: ${selectedTopic}

VIRAL CONTENT MISSION:
- Create tweets that students MUST share, comment on, and RT
- Use dramatic language that creates urgency and FOMO
- Make every tweet feel like a limited-time challenge or reveal

VIRAL SAT EXAMPLES:
- "🚨 BRUTAL SAT TRAP: 95% fall for this! If f(x) = x²-4x+3 and f(a) = f(3), what are ALL possible values of a? Most pick just ONE answer... #SATTrap #TestTrick"
- "⏱️ INSANE 30-SECOND CHALLENGE: Triangle ABC has sides 5, 12, 13. Point P inside creates triangles with areas 6, 8, and x. Find x in 30 seconds! #30SecondChallenge"
- "💥 SAT READING NIGHTMARE: 'The author's tone can best be described as...' - but there are TWO right answers. 99% miss the subtle distinction. Can you spot both? #SATReading"
- "🔥 EVIL SAT QUESTION: If 3^(x+1) + 3^(x+1) + 3^(x+1) = 27^x, find x. Looks easy? 9/10 students get -1. The real answer will SHOCK you. #QuestionOfTheDay"

${hashtagInstruction}

${contentQualityGuard}

Write ONLY the tweet:`;
  } else if (persona === "gre_master") {
    basePrompt = `You are a ${selectedPersonality} creating VIRAL GRE content about: ${selectedTopic}

VIRAL CONTENT MISSION:
- Create tweets that grad school hopefuls CANNOT ignore
- Use competitive language that challenges their intelligence
- Make every tweet feel like insider knowledge they need to share

VIRAL GRE EXAMPLES:
- "🚨 DIABOLICAL GRE TRAP: ENERVATE means to weaken, but 95% think it means energize. If you got that wrong, you'll HATE this: What does INFLAMMABLE mean? #GRETrap #VocabNightmare"
- "⚡ IMPOSSIBLE 45-SECOND CHALLENGE: If x@y = x²-y² and 3@a = a@3, find all values of a. Princeton Review says this is 'difficulty level 5.' #GREMath #BrainMelter"
- "💣 GRE QUANT DESTROYER: Set A = {1,2,3,4,5}, Set B = {3,4,5,6,7}. If you pick one number from each set, what's the probability their product is odd? Most get 40%. #GREQuant"
- "🔥 READING COMP FROM HELL: 'Paradoxically, the author's ostensible support actually undermines...' If this sentence doesn't make you panic, you're ready for 170V. #GREReading"

${hashtagInstruction}

${contentQualityGuard}

Write ONLY the tweet:`;
  } else if (persona === "gmat_pro") {
    basePrompt = `You are a ${selectedPersonality} creating VIRAL GMAT content about: ${selectedTopic}

VIRAL CONTENT MISSION:
- Create tweets that MBA candidates feel compelled to engage with
- Use high-stakes language that reflects business school pressure
- Make every tweet feel like executive-level insider information

VIRAL GMAT EXAMPLES:
- "🚨 GMAT DEATH TRAP: 'Revenue increased 200% but profits fell 50%.' Which weakens this paradox? A) Market share grew B) Costs tripled C) Competitors failed D) Both A&B. 95% pick wrong. #GMATTrap"
- "⏰ NIGHTMARE DATA SUFFICIENCY: Is |x-3| > |x+3|? (1) x < -3 (2) x² > 9. Wharton admits get this in 60 seconds. Can you? Timer starts NOW! #GMATChallenge"  
- "💼 BRUTAL QUANT REALITY: If 3^n × 9^(n+1) = 1/27, find n. Looks like high school math? 8/10 future MBAs get positive numbers. Dead wrong. #GMATQuant"
- "🔥 CRITICAL REASONING HELL: Premise has 3 assumptions, conclusion has 2 flaws, but only 1 answer choice addresses both. This is why 700+ scorers quit their jobs. #CriticalReasoning"

${hashtagInstruction}

${contentQualityGuard}

Write ONLY the tweet:`;
  } else {
    // Default fallback - should not happen with only 3 personas
    throw new Error(`Unknown persona: ${persona}`);
  }
  

try {
  console.log("🚀 Generating tweet...");
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "user", content: basePrompt }],
    max_tokens: Math.min(120, Math.ceil(maxLength / 2)),
    temperature: bulkIndex !== undefined ? 
      0.9 + (bulkIndex * 0.15) % 0.4 : // 0.9 to 1.3 range for bulk generation variety
      1.1, // Higher temperature for more creative and engaging content
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
  
  // Simplified hashtag validation - trust AI more
  const validHashtags = rawHashtags
    .filter(tag => {
      const cleanTag = tag.slice(1); // Remove #
      // Basic validation only
      return cleanTag.length >= 2 && 
             cleanTag.length <= 20 && 
             /^[A-Za-z][A-Za-z0-9]*$/.test(cleanTag) &&
             !cleanTag.match(/^(http|www|com|org)/i); // No URLs
    })
    .slice(0, 3); // Allow up to 3 hashtags
  
  return validHashtags;
}

// Import centralized persona configuration
import { VIRAL_PERSONAS, getPersonas } from './personas';

// Re-export for backward compatibility
export { VIRAL_PERSONAS as personas, getPersonas };


