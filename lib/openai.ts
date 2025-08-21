import OpenAI from 'openai';
import { getRandomTrendingTopic } from './trending';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface TweetGenerationOptions {
  persona?: 'unhinged_satirist';
  includeHashtags?: boolean;
  maxLength?: number;
  customPrompt?: string;
}

export async function generateTweet(options: TweetGenerationOptions = {}) {
  const {
    persona = 'unhinged_satirist',
    includeHashtags = true,
    maxLength = 280,
    customPrompt
  } = options;

  const timestamp = Date.now();
  const randomSeed = Math.random().toString(36).substring(7);

  // Fetch trending topic
  let trendingContext = '';
  if (persona === 'unhinged_satirist' && !customPrompt) {
    try {
      const trendingTopic = await getRandomTrendingTopic();
      trendingContext = `\n\nTRENDING NOW: "${trendingTopic.title}" (${trendingTopic.traffic} searches) - Use ${trendingTopic.hashtag} and create satirical commentary about this trending topic.`;
    } catch (error) {
      console.log('⚠️ Using fallback trending topics');
    }
  }

  // Satirical devices + tones
  const satiricalDevices = [
    'exaggeration',
    'irony',
    'parody',
    'absurd_metaphor'
  ];

  const satiricalTones = [
    'roast',
    'dark_humor',
    'absurd_exaggeration'
  ];

  const deviceInstructions: Record<string, string> = {
    exaggeration: "Use EXTREME EXAGGERATION: e.g. 'If potholes were startups, India would be a unicorn factory.'",
    irony: "Use SHARP IRONY: e.g. 'India is developing at light speed. That’s why the lights go out every evening.'",
    parody: "Use CLEVER PARODY: e.g. 'Govt launches Digital India 3.0: Now even corruption is available as an app.'",
    absurd_metaphor: "Use ABSURD METAPHORS: e.g. 'Our democracy is like Indian trains: everyone shouting, no one moving.'"
  };

  const toneInstructions: Record<string, string> = {
    roast: "Tone: ROAST — short, savage burns, like an Indian Twitter roast.",
    dark_humor: "Tone: DARK HUMOR — cynical and biting, but witty.",
    absurd_exaggeration: "Tone: ABSURD — physics-defying ridiculous, surreal metaphors."
  };

  // Generate variation
  const generateSatiristVariations = () => {
    const device = satiricalDevices[Math.floor(Math.random() * satiricalDevices.length)];
    const tone = satiricalTones[Math.floor(Math.random() * satiricalTones.length)];

    const basePrompt = "You are an unhinged Indian satirist. Write a ONE-LINER satirical tweet on today's trending topic in India. \
Be sharp, sarcastic, and punchy — like a stand-up comic dropping a killer line. \
Must be under 280 characters, culturally specific, and feel fresh. \
Always exaggerate, parody, or twist reality into absurd metaphors. \
Think of it like the sharpest Indian Twitter roast: quick, witty, and bite-sized.";

    return [
      `${basePrompt}${trendingContext}\n\n${deviceInstructions[device]}\n${toneInstructions[tone]}\n\nCRITICAL: Must be ONE line only. \
No paragraphs. No setup-explanation-punchline — just the punchline. \
Must reference a CURRENT Indian event, politician, policy, or trending meme. \
No clichés, no generalities, always feel like it was written TODAY.`,
    ];
  };

  const personaVariations = {
    unhinged_satirist: generateSatiristVariations(),
  };

  const selectedVariation = personaVariations[persona][0];

  const antiRepetitionInstructions = `
ANTI-REPETITION PROTOCOL:
- Must always be a NEW one-liner
- Never recycle metaphors, structures, or old jokes
- Must reference specific Indian news, culture, or politics of today
- Must feel like a fresh roast, not a timeless observation
- No paragraphs, no explanations — ONLY the satirical one-liner tweet
`;

  const basePrompt = customPrompt
    ? `${selectedVariation} Focus on this topic/content: ${customPrompt}`
    : selectedVariation;

  let prompt = `${basePrompt}${antiRepetitionInstructions}


UNIQUENESS REQUIREMENT: Make this tweet completely different from any previous tweets. Use fresh angles, new perspectives, and avoid repetitive patterns or phrases.

Randomization seed: ${randomSeed} | Timestamp: ${timestamp}

${includeHashtags ? 'Include relevant hashtags.' : 'Do not include hashtags.'}

FINAL INSTRUCTION: Your response must be a complete tweet that is ${maxLength} characters or fewer. No exceptions. Only return the tweet text, nothing else.`;

  try {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'deepseek-chat',
        max_tokens: Math.min(120, Math.ceil(maxLength / 2)),
        temperature: 1.0,
      });

      let tweet = completion.choices[0]?.message?.content?.trim();
      if (!tweet) {
        throw new Error('No tweet generated');
      }

      if (tweet.length <= maxLength) {
        console.log(`✅ Generated tweet within limit: ${tweet.length}/${maxLength} chars`);
        return {
          content: tweet,
          hashtags: extractHashtags(tweet),
          length: tweet.length,
        };
      }

      attempts++;
      console.log(`⚠️ Tweet too long (${tweet.length}/${maxLength} chars), attempt ${attempts}/${maxAttempts}`);

      if (attempts === maxAttempts) {
        console.log(`🔧 Final attempt - truncating tweet`);

        const truncated = tweet.substring(0, maxLength - 3);
        const lastSpaceIndex = truncated.lastIndexOf(' ');

        if (lastSpaceIndex > maxLength * 0.7) {
          tweet = truncated.substring(0, lastSpaceIndex) + '...';
        } else {
          tweet = truncated + '...';
        }

        return {
          content: tweet,
          hashtags: extractHashtags(tweet),
          length: tweet.length,
        };
      }

      prompt = prompt + `\n\nPREVIOUS ATTEMPT WAS ${tweet.length} CHARACTERS - TOO LONG! Generate a shorter one-liner tweet that is MAXIMUM ${maxLength} characters.`;
    }

    throw new Error('Failed to generate tweet within character limit');
  } catch (error) {
    console.error('Error generating tweet:', error);
    throw new Error('Failed to generate tweet');
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  return text.match(hashtagRegex) || [];
}

export const personas = [
  {
    id: 'unhinged_satirist',
    name: 'Unhinged Satirist',
    description: 'Sharp Indian satirist with punchy one-liners, exaggeration, and absurd metaphors',
    emoji: '🃏'
  },
] as const;
