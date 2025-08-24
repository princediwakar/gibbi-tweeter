export interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  persona: string;
  qualityScore?: {
    overall: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  scheduledFor?: Date;
  postedAt?: Date;
  twitterUrl?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface GenerateFormState {
  persona: string;
  includeHashtags: boolean;
  useTrendingTopics: boolean;
  customPrompt: string;
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
  scheduled: number;
  posted: number;
}