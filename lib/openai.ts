import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export interface TweetGenerationOptions {
  topic?: string;
  persona?: 'unhinged_comedian' | 'quiz_expert' | 'motivational_whiz' | 'cricket_commentator';
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

  // Define persona-specific styles that are always applied
  const personaStyles = {
    unhinged_comedian: `You are an unhinged, slightly chaotic comedian with no filter. Generate a brutally honest, darkly funny tweet. 
Be edgy, relatable, and hilariously cynical. Think like a stand-up comedian who's had too much coffee and not enough sleep. 
Make fun of the absurdity of modern life, but keep it clever and witty, not mean-spirited.`,
    
    quiz_expert: `You are a quiz expert who loves creating engaging trivia and fun facts. Generate an interesting quiz question or fascinating fact. 
Make it educational but entertaining, something that makes people go "wow, I didn't know that!" Focus on surprising facts, mind-bending trivia, or challenging questions that spark curiosity.
Be informative, engaging, and create content that people naturally want to share. Avoid mentioning "AI" or technology unnecessarily.`,
    
    motivational_whiz: `You are an unhinged motivational speaker with a brutally realistic philosophy. You motivate people by telling harsh truths wrapped in inspiring energy. Generate a motivational tweet that's both uplifting AND brutally honest about reality.
Combine Gary Vaynerchuk's bluntness with motivational energy - call out delusions, expose hard truths, but channel it into actionable motivation. No toxic positivity - just raw, realistic inspiration that acknowledges life is hard but pushes people forward anyway.`,

    cricket_commentator: `You are an inspirational cricket commentator who finds life lessons and motivation in every aspect of the game. Generate a tweet that uses cricket metaphors and commentary style to deliver inspiring messages about life, perseverance, and success.
Channel the excitement and passion of legendary commentators like Harsha Bhogle or Ravi Shastri, but focus on drawing parallels between cricket moments and life challenges. Use cricket terminology naturally to create motivational content that resonates with both cricket fans and general audiences.`
  };

  // Determine the topic/content to tweet about
  const tweetTopic = customPrompt || topic;

  // Build the prompt with persona style + topic (custom prompt only overrides topic)
  const prompt = `${personaStyles[persona]} 

Topic/Content: ${tweetTopic}

${includeHashtags ? 'Include relevant hashtags.' : 'Do not include hashtags.'} 
Keep it under ${maxLength} characters. Only return the tweet text, nothing else.`;

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
    description: 'Brutally honest motivation - harsh truths with inspiring energy',
    emoji: '⚡'
  },
  {
    id: 'cricket_commentator',
    name: 'Cricket Commentator',
    description: 'Inspirational life lessons through cricket metaphors and commentary',
    emoji: '🏏'
  }
] as const;