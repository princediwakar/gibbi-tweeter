interface QualityMetrics {
  engagement: number; // 0-1 based on emojis, questions, exclamation marks
  readability: number; // 0-1 based on sentence structure and length
  uniqueness: number; // 0-1 based on common phrases and repetition
  personaAlignment: number; // 0-1 based on persona-specific indicators
  viralPotential: number; // 0-1 based on shareability factors
  trendRelevance: number; // 0-1 based on trending topics/hashtags
}

interface QualityScore {
  overall: number; // 0-100 final score
  metrics: QualityMetrics;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  feedback: string[];
}

export function calculateQualityScore(content: string, hashtags: string[], persona: string): QualityScore {
  const metrics: QualityMetrics = {
    engagement: calculateEngagementScore(content),
    readability: calculateReadabilityScore(content),
    uniqueness: calculateUniquenessScore(content),
    personaAlignment: calculatePersonaAlignment(content, persona),
    viralPotential: calculateViralPotential(content),
    trendRelevance: calculateTrendRelevance(content, hashtags)
  };

  const weights = {
    engagement: 0.25,
    readability: 0.15,
    uniqueness: 0.2,
    personaAlignment: 0.2,
    viralPotential: 0.15,
    trendRelevance: 0.05
  };

  const overall = Math.round(
    (metrics.engagement * weights.engagement +
     metrics.readability * weights.readability +
     metrics.uniqueness * weights.uniqueness +
     metrics.personaAlignment * weights.personaAlignment +
     metrics.viralPotential * weights.viralPotential +
     metrics.trendRelevance * weights.trendRelevance) * 100
  );

  const grade = getGrade(overall);
  const feedback = generateFeedback(metrics, overall);

  return { overall, metrics, grade, feedback };
}

function calculateEngagementScore(content: string): number {
  let score = 0.6; // higher baseline for poetry
  
  // Positive indicators
  if (content.includes('?')) score += 0.25; // questions strongly engage
  if (content.match(/[!]{1,2}/)) score += 0.15; // enthusiasm
  if (content.match(/\b(you|your|we|our)\b/i)) score += 0.2; // direct address
  
  // Emoji scoring - reward restraint
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
  if (emojiCount === 0) score += 0.1; // no emojis is good
  if (emojiCount === 1) score += 0.05; // one emoji is acceptable
  if (emojiCount >= 2) score -= 0.15; // multiple emojis feel AI-generated
  
  // Poetic elements
  if (content.match(/\b\w+ing\b.*\b\w+ing\b/)) score += 0.1; // rhyming patterns
  if (content.match(/\b(\w)\w*\s+\1\w*/i)) score += 0.05; // alliteration
  
  // Length penalty for too long/short
  const length = content.length;
  if (length < 50) score -= 0.05; // reduced penalty
  if (length > 250) score -= 0.1; // reduced penalty
  
  return Math.min(1, Math.max(0, score));
}

function calculateReadabilityScore(content: string): number {
  let score = 0.7; // baseline
  
  // Sentence structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = content.length / sentences.length;
  
  if (avgSentenceLength > 100) score -= 0.2; // too complex
  if (avgSentenceLength < 20) score -= 0.1; // too fragmented
  
  // Word complexity
  const words = content.split(/\s+/);
  const longWords = words.filter(w => w.length > 8).length;
  const longWordRatio = longWords / words.length;
  
  if (longWordRatio > 0.3) score -= 0.15; // too complex vocabulary
  
  // Punctuation balance
  const punctMarks = (content.match(/[.!?]/g) || []).length;
  if (punctMarks === 0) score -= 0.2; // no proper endings
  
  return Math.min(1, Math.max(0, score));
}

function calculateUniquenessScore(content: string): number {
  let score = 0.8; // baseline assumption of uniqueness
  
  // Common/overused phrases that reduce uniqueness
  const cliches = [
    'at the end of the day',
    'think outside the box',
    'game changer',
    'it is what it is',
    'just saying',
    'going viral',
    'breaking the internet'
  ];
  
  const lowerContent = content.toLowerCase();
  cliches.forEach(cliche => {
    if (lowerContent.includes(cliche)) score -= 0.15;
  });
  
  // Repetitive patterns
  const words = content.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = 1 - (uniqueWords.size / words.length);
  
  if (repetitionRatio > 0.3) score -= 0.2; // too repetitive
  
  // Creative indicators
  if (content.match(/metaphor|like|as if|imagine/i)) score += 0.1;
  if (content.match(/🎭|🎪|🃏|🎨/)) score += 0.05; // creative emojis
  
  return Math.min(1, Math.max(0, score));
}

function calculatePersonaAlignment(content: string, persona: string): number {
  let score = 0.7; // higher baseline for poetic satirist
  
  switch (persona) {
    case 'unhinged_satirist':
      // Hinglish and Indian cultural elements
      if (content.match(/yaar|bhai|beta|ji|arrey|kya|hai|na|bilkul|ekdum|tension|jugaad|shaadi|ghar|mummy|papa/i)) score += 0.2; // transliterated Hindi
      if (content.match(/india|indian|desi|bollywood|mumbai|delhi|bangalore/i)) score += 0.1;
      if (content.match(/😂|🤣|💀|🔥|⚡/)) score += 0.05; // appropriate emojis (reduced weight)
      
      // Poetic devices bonus
      if (content.match(/\b\w+ing\b.*\b\w+ing\b/)) score += 0.1; // rhyme
      if (content.match(/\b(\w)\w*\s+\1\w*/i)) score += 0.05; // alliteration
      
      // Generational bridges
      if (content.match(/dadi|nani|generation|millennial|gen z|boomer|parents/i)) score += 0.15; // generational content
      if (content.match(/whatsapp|instagram|facebook|social media|memes/i)) score += 0.1; // modern references
      
      // Birbal-style wisdom
      if (content.match(/like|as if|imagine|picture this/i)) score += 0.1; // metaphorical language
      if (content.match(/paradox|irony|while|yet|but|though/i)) score += 0.1; // complexity
      
      // Cultural universality
      if (content.match(/family|relatives|wedding|festival|traffic|food delivery|office/i)) score += 0.1; // universal experiences
      
      // Reduce penalty for seriousness in poetic context
      if (!content.match(/[!?]/) && !content.match(/😂|🤣|😭/)) score -= 0.05;
      break;

    case 'desi_philosopher':
      // Philosophical and spiritual terminology
      if (content.match(/dharma|karma|maya|samsara|moksha|meditation|zen|buddha|gita|upanishad|vedanta|sufi|atman/i)) score += 0.25;
      
      // Sanskrit/Hindi philosophical terms
      if (content.match(/satsang|prasad|guru|ashram|yogi|sadhana|tapas|bhakti|jnana|seva/i)) score += 0.15;
      
      // Modern philosophical concepts
      if (content.match(/mindfulness|consciousness|awareness|enlightenment|wisdom|truth|reality|illusion/i)) score += 0.2;
      
      // Indian philosophical references
      if (content.match(/krishna|arjuna|vishnu|shiva|ganesh|hanuman|ram|osho|vivekananda|tagore/i)) score += 0.15;
      
      // Contemplative emojis and tone
      if (content.match(/🧘|🕉️|🙏|🌸|🌊|✨|🌅|🕯️|📿/)) score += 0.1;
      
      // Philosophical structure - questions and reflections
      if (content.match(/\?/)) score += 0.1; // philosophical questions
      if (content.match(/perhaps|maybe|what if|consider|reflect|ponder/i)) score += 0.1;
      
      // Wisdom connecting past and present
      if (content.match(/ancient.*modern|old.*new|tradition.*technology|past.*present|yesterday.*today/i)) score += 0.15;
      
      // Gentle humor rather than harsh satire
      if (content.match(/gently|softly|whispers|smiles|chuckles/i)) score += 0.05;
      
      // Modern life references with philosophical spin
      if (content.match(/notification|smartphone|instagram|linkedin|zoom|meeting|traffic|metro|uber|zomato/i)) score += 0.1;
      
      break;
      
    default:
      score = 0.7; // higher default for poetry
  }
  
  return Math.min(1, Math.max(0, score));
}

function calculateViralPotential(content: string): number {
  let score = 0.4; // baseline
  
  // Shareability factors
  if (content.match(/relatable|mood|me irl|this is me/i)) score += 0.2;
  if (content.match(/😂|🤣|💀|🔥/)) score += 0.15;
  if (content.includes('RT') || content.includes('share')) score += 0.1;
  
  // Emotional triggers
  if (content.match(/hilarious|amazing|shocking|unbelievable/i)) score += 0.15;
  
  // Optimal length for sharing (80-180 chars)
  const length = content.length;
  if (length >= 80 && length <= 180) score += 0.1;
  
  // Current events/trending topics boost
  if (content.match(/trending|viral|breaking|news/i)) score += 0.1;
  
  return Math.min(1, Math.max(0, score));
}

function calculateTrendRelevance(content: string, hashtags: string[]): number {
  let score = 0.3; // baseline
  
  // Hashtag quality check
  const validHashtags = hashtags.filter(hashtag => {
    const tag = hashtag.slice(1);
    // Penalize malformed hashtags heavily
    if (/^(http|www|com|org|net|co|in|ly|bit|tco|youtu|HttpsYoutu)/i.test(tag)) return false;
    if (tag.length > 8 && !/[aeiouAEIOU]/.test(tag)) return false;
    if (/^\d+$/.test(tag)) return false;
    return true;
  });
  
  // Penalize bad hashtags severely
  if (hashtags.length > validHashtags.length) {
    score -= 0.3; // Heavy penalty for malformed hashtags
  }
  
  // Reward good hashtags
  if (validHashtags.length > 0 && validHashtags.length <= 3) score += 0.2;
  if (validHashtags.length > 3) score -= 0.1; // Too many hashtags
  
  // Time-sensitive content
  if (content.match(/today|now|currently|this week/i)) score += 0.15;
  
  // Pop culture references
  if (content.match(/twitter|instagram|tiktok|social media/i)) score += 0.1;
  
  // Indian context (for this specific bot)
  if (content.match(/india|mumbai|delhi|bangalore|ipl|bollywood/i)) score += 0.15;
  
  return Math.min(1, Math.max(0, score));
}

function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateFeedback(metrics: QualityMetrics, overall: number): string[] {
  const feedback: string[] = [];
  
  if (overall >= 85) {
    feedback.push('🔥 Excellent tweet! High viral potential');
  } else if (overall >= 75) {
    feedback.push('👍 Good quality tweet with strong engagement');
  } else if (overall >= 65) {
    feedback.push('✅ Decent tweet, room for improvement');
  } else {
    feedback.push('⚠️ Needs work to increase impact');
  }
  
  if (metrics.engagement < 0.6) {
    feedback.push('💡 Add questions or direct engagement to boost interaction');
  }
  
  if (metrics.readability < 0.6) {
    feedback.push('📖 Simplify language for better readability');
  }
  
  if (metrics.uniqueness < 0.6) {
    feedback.push('🎨 Use more creative and unique expressions');
  }
  
  if (metrics.personaAlignment < 0.6) {
    feedback.push('🎭 Better align content with persona voice');
  }
  
  if (metrics.viralPotential < 0.5) {
    feedback.push('📈 Add relatable or emotional elements for shareability');
  }
  
  return feedback;
}