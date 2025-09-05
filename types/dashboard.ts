export interface Tweet {
  id: string;
  account_id: string; // Multi-account support
  content: string;
  hashtags: string[];
  persona: string;
  qualityScore?: {
    overall: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  status: 'ready' | 'posted' | 'failed';
  postedAt?: Date;
  twitterUrl?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface GenerateFormState {
  account_id: string; // Required for multi-account
  persona: string;
  includeHashtags: boolean;
  useTrendingTopics: boolean;
  customPrompt: string;
}

export interface Account {
  id: string;
  name: string;
  twitter_handle: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AutoSchedulerStats {
  totalGenerated: number;
  totalPosted: number;
  lastRun: Date | null;
  nextRun: Date | null;
  schedule: string;
  isRunning: boolean;
  note: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export interface DashboardStats {
  ready: number;
  posted: number;
}