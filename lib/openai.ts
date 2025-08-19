import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface TweetGenerationOptions {
  topic?: string;
  persona?: 'unhinged_comedian' | 'quiz_expert' | 'motivational_whiz';
  includeHashtags?: boolean;
  maxLength?: number;
  customPrompt?: string;
}

export async function generateTweet(options: TweetGenerationOptions = {}) {
  const {
    topic = 'daily life struggles',
    persona = 'unhinged_comedian',
    includeHashtags = true,
    maxLength = 280,
    customPrompt
  } = options;

  let prompt: string;

  if (customPrompt) {
    prompt = `${customPrompt} 
${includeHashtags ? 'Include relevant hashtags.' : 'Do not include hashtags.'} 
Keep it under ${maxLength} characters. Only return the tweet text, nothing else.`;
  } else {
    const personaPrompts = {
      unhinged_comedian: `You are an unhinged, slightly chaotic comedian with no filter. Generate a brutally honest, darkly funny tweet about ${topic}. 
Be edgy, relatable, and hilariously cynical. Think like a stand-up comedian who's had too much coffee and not enough sleep. 
Make fun of the absurdity of modern life, but keep it clever and witty, not mean-spirited.`,
      
      quiz_expert: `You are a quiz expert who loves creating engaging trivia and fun facts. Generate an interesting quiz question or fascinating fact about ${topic}. 
Make it educational but entertaining, something that makes people go "wow, I didn't know that!" or "I need to test my friends with this." 
Be informative, engaging, and slightly competitive to encourage interaction.`,
      
      motivational_whiz: `You are an energetic motivational speaker who finds inspiration in everything. Generate an uplifting, motivational tweet about ${topic}. 
Be genuinely inspiring without being preachy, use relatable examples, and help people see the positive side or growth opportunity. 
Think Tony Robbins meets your best friend - enthusiastic but authentic.`
    };

    prompt = `${personaPrompts[persona]} 
${includeHashtags ? 'Include relevant hashtags.' : 'Do not include hashtags.'} 
Keep it under ${maxLength} characters. Only return the tweet text, nothing else.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'deepseek-chat',
      max_tokens: 100,
      temperature: 0.8,
    });

    const tweet = completion.choices[0]?.message?.content?.trim();
    if (!tweet) {
      throw new Error('No tweet generated');
    }

    return {
      content: tweet,
      hashtags: extractHashtags(tweet),
      length: tweet.length,
    };
  } catch (error) {
    console.error('Error generating tweet:', error);
    throw new Error('Failed to generate tweet');
  }
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[a-zA-Z0-9_]+/g;
  return text.match(hashtagRegex) || [];
}

export const tweetTopics = [
  'daily life struggles',
  'technology and gadgets', 
  'history and culture',
  'science and nature',
  'health and fitness',
  'career and success',
  'relationships and dating',
  'travel and adventure',
  'food and cooking',
  'sports and competition',
  'movies and entertainment',
  'books and learning',
  'money and finance',
  'productivity and habits',
  'creativity and art'
];

export const personas = [
  {
    id: 'unhinged_comedian',
    name: 'Unhinged Comedian',
    description: 'Brutally honest, darkly funny takes with no filter',
    emoji: '🎭'
  },
  {
    id: 'quiz_expert', 
    name: 'Quiz Expert',
    description: 'Engaging trivia questions and fascinating facts',
    emoji: '🧠'
  },
  {
    id: 'motivational_whiz',
    name: 'Motivational Whiz', 
    description: 'Uplifting inspiration and positive energy',
    emoji: '⚡'
  }
] as const;