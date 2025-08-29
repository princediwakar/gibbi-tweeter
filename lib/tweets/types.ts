export interface EnhancedTweet {
  content: string;
  hashtags: string[];
  persona: string;
  category: string;
  topic: string;
  engagementHooks: string[];
  gibibiCTA?: string;
  contentType: 'challenge' | 'trap' | 'quick_tip' | 'motivation' | 'question_reveal' | 'competitive';
}

export interface TweetJob {
  id: string;
  persona: string;
  generation_date: string;
  category: string;
  category_display_name: string;
  topic: string;
  topic_display_name: string;
  content_type: string;
  step: number;
  status: 'ready' | 'posted' | 'failed';
  data: {
    tweet: EnhancedTweet;
  };
  created_at: string;
  scheduled_for?: string;
  posted_at?: string;
  twitter_id?: string;
  twitter_url?: string;
  error_message?: string;
}

export interface VariationMarkers {
  time_marker: string;
  token_marker: string;
  generation_timestamp: number;
  content_hash: string;
}

export interface TweetGenerationConfig {
  persona?: string;
  category?: string;
  topic?: string;
  contentType?: 'challenge' | 'trap' | 'quick_tip' | 'motivation' | 'question_reveal' | 'competitive';
}

export interface GenerationResult {
  success: boolean;
  tweet?: EnhancedTweet;
  jobId?: string;
  error?: string;
}