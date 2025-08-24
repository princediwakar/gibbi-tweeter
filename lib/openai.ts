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

// Test prep teaching approaches for content variability
const teachingApproaches = [
  "practice question format - direct MCQ with clear answer explanation",
  "study tip approach - actionable strategy for test improvement",
  "concept clarification - breaking down complex topics simply",
  "motivation and mindset - encouraging persistence and confidence",
  "time management strategy - efficient study and test-taking techniques",
  "common mistake prevention - highlighting frequent errors to avoid",
  "memory technique - mnemonics and retention strategies",
  "test strategy - approach for different question types",
  "progress tracking - measuring improvement and setting goals",
  "real-world application - connecting concepts to practical use"
];
// Select teaching approach with better distribution for bulk generation
let randomApproach;
if (bulkIndex !== undefined) {
  // For bulk generation, ensure different approaches by cycling through them
  const approachIndex = (bulkIndex + Math.floor(Math.random() * 3)) % teachingApproaches.length;
  randomApproach = teachingApproaches[approachIndex];
} else {
  randomApproach = teachingApproaches[Math.floor(Math.random() * teachingApproaches.length)];
}

// Content quality and variety guidelines
const contentQualityGuard = `
📚 EDUCATIONAL CONTENT STANDARDS:

✅ CONTENT REQUIREMENTS:
- Use clear, educational language appropriate for students
- Provide accurate information relevant to US standardized tests
- Include helpful study strategies or practice questions
- Maintain encouraging and supportive tone
- Vary content format using: ${randomApproach}
- Make content engaging and actionable for test prep`;

// Removed overcomplicated creativity injection - let natural humor flow

  // Persona-specific prompt generation
  let basePrompt: string;
  
  const hashtagInstruction = "\nInclude 2-3 relevant hashtags for test prep engagement (e.g., #SAT2024, #TestPrep, #StudyTips).";
  
  if (persona === "sat_coach") {
    basePrompt = `Create an engaging SAT prep tweet about: ${selectedTopic}

TWEET FORMAT OPTIONS:
- Practice question with multiple choice answers
- Study tip for SAT success
- Motivational message for test-takers
- Test strategy or time management advice

APPROACH: ${randomApproach}

EXAMPLES:
- "📚 SAT Math: If 3x + 5 = 20, what's 6x + 10? A) 30 B) 40 C) 35 D) 45 Think it through... Answer: A! #SAT2024 #MathPrep"
- "⏰ SAT Strategy: Spend 30 seconds on easy questions, 1 minute on medium, 2+ on hard. Time management = higher scores! #SATPrep #TestStrategy"
- "💪 Remember: Every practice test brings you closer to your target score. Consistency beats cramming every time! #SAT2024 #StudyMotivation"

${hashtagInstruction}

${contentQualityGuard}

Write ONLY the tweet - no explanations:`;
  } else if (persona === "gre_master") {
    basePrompt = `Create an engaging GRE prep tweet about: ${selectedTopic}

TWEET FORMAT OPTIONS:
- Vocabulary word with definition and example
- Math practice question
- Graduate school prep advice
- Writing tips for analytical writing

APPROACH: ${randomApproach}

EXAMPLES:
- "📖 GRE Vocab: UBIQUITOUS means 'present everywhere' - like anxiety during grad school apps! Use it: 'Smartphones are ubiquitous in modern society.' #GRE #Vocabulary"
- "🧮 GRE Quant: What's 25% of 80% of 200? A) 30 B) 40 C) 50 D) 35 Break it down: 0.25 × 0.80 × 200 = 40! #GREMath #TestPrep"
- "✍️ GRE Writing tip: Start with a clear thesis, support with 2-3 examples, address counterarguments. Structure = higher scores! #GREWriting #GradSchool"

${hashtagInstruction}

${contentQualityGuard}

Write ONLY the tweet - no explanations:`;
  } else if (persona === "gmat_pro") {
    basePrompt = `Create an engaging GMAT prep tweet about: ${selectedTopic}

TWEET FORMAT OPTIONS:
- Critical reasoning practice question
- Data sufficiency problem
- MBA application strategy
- Business school prep advice

APPROACH: ${randomApproach}

EXAMPLES:
- "💼 GMAT Critical Reasoning: 'Sales increased 20% after hiring new manager.' What strengthens this? A) Manager has MBA B) Sales team expanded C) No other changes occurred D) Previous manager quit. Answer: C! #GMAT #CriticalReasoning"
- "📊 Data Sufficiency: Is x > 5? (1) x² > 25 (2) x + 3 > 8. Need both statements! x could be negative in (1), (2) gives x > 5 directly. #GMATMath #DataSufficiency"
- "🎯 MBA Strategy: Apply to 6-8 schools (2 reach, 4 target, 2 safety). Diversify your chances while staying focused! #MBA2024 #BusinessSchool"

${hashtagInstruction}

${contentQualityGuard}

Write ONLY the tweet - no explanations:`;
  } else {
    // Test Prep Guru - general test prep wisdom
    basePrompt = `Create an engaging test prep tweet about: ${selectedTopic}

TWEET FORMAT OPTIONS:
- General study strategy
- Test-taking mindset advice
- Time management tips
- Preparation motivation

APPROACH: ${randomApproach}

EXAMPLES:
- "🧠 Study Science: Spaced repetition beats cramming. Review material after 1 day, 3 days, 1 week, 2 weeks. Your brain will thank you! #StudyTips #TestPrep"
- "⚡ Test Day Mindset: Read questions twice, eliminate wrong answers first, guess strategically on tough ones. Confidence + strategy = success! #TestTaking #Mindset"
- "📈 Progress Tracking: Take a practice test every 2 weeks. Measure improvement, identify weak areas, adjust study plan. Data drives results! #TestPrep #Progress"

${hashtagInstruction}

${contentQualityGuard}

Write ONLY the tweet - no explanations:`;
  }
  

try {
  console.log("🚀 Generating tweet...");
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [{ role: "user", content: basePrompt }],
    max_tokens: Math.min(120, Math.ceil(maxLength / 2)),
    temperature: bulkIndex !== undefined ? 
      0.8 + (bulkIndex * 0.1) % 0.3 : // 0.8 to 1.1 range for bulk generation
      0.9, // Moderate temperature for educational consistency with some creativity
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
  { id: "sat_coach", name: "SAT Coach", emoji: "🎓" },
  { id: "gre_master", name: "GRE Master", emoji: "📚" },
  { id: "gmat_pro", name: "GMAT Pro", emoji: "💼" },
  { id: "test_prep_guru", name: "Test Prep Guru", emoji: "🧠" },
];

export function getPersonas() {
  return personas;
}