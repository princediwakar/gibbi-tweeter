import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getNextOptimalPostTime, formatOptimalTime, toDateTimeLocal, formatISTTime } from '@/lib/timing';
import { Tweet, GenerateFormState, AutoSchedulerStats, Persona } from '@/types/dashboard';

const PERSONAS: Persona[] = [
  {
    id: 'unhinged_satirist',
    name: 'Unhinged Satirist',
    description: 'Sharp Indian satirist with cultural references, exaggeration, and absurd metaphors',
    emoji: '🃏',
  },
];

const BULK_GENERATION_CONFIG = {
  count: 5,
  persona: 'unhinged_satirist' as const,
  includeHashtags: true,
  useTrendingTopics: true,
};

export function useTweetDashboard() {
  // State
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [latestTweet, setLatestTweet] = useState<Tweet | null>(null);
  const [selectedTweets, setSelectedTweets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [autoSchedulerRunning, setAutoSchedulerRunning] = useState(false);
  const [autoSchedulerStats, setAutoSchedulerStats] = useState<AutoSchedulerStats | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [generateForm, setGenerateForm] = useState<GenerateFormState>({
    persona: 'unhinged_satirist',
    includeHashtags: true,
    useTrendingTopics: true,
  });

  // API Functions
  const fetchTweets = useCallback(async () => {
    try {
      const response = await fetch('/api/tweets');
      const data = await response.json();
      setTweets(data.tweets || []);
    } catch (error) {
      console.error('Failed to fetch tweets:', error);
      toast.error('Failed to fetch tweets');
    }
  }, []);

  const fetchAutoSchedulerStats = useCallback(async () => {
    try {
      const response = await fetch('/api/auto-scheduler');
      if (response.ok) {
        const data = await response.json();
        setAutoSchedulerStats(data);
        setAutoSchedulerRunning(data?.isRunning || false);
      }
    } catch (error) {
      console.error('Failed to fetch auto-scheduler stats:', error);
    }
  }, []);

  const generateTweet = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          ...generateForm,
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLatestTweet(data.tweet);
        toast.success('Tweet generated!');
        await fetchTweets();
      } else {
        toast.error('Failed to generate tweet');
      }
    } catch (error) {
      console.error('Failed to generate tweet:', error);
      toast.error('Failed to generate tweet');
    } finally {
      setLoading(false);
    }
  }, [loading, generateForm, fetchTweets]);

  const generateAndScheduleTweet = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_and_schedule',
          ...generateForm,
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLatestTweet(data.tweet);
        toast.success('Tweet generated and scheduled!');
        await fetchTweets();
      } else {
        toast.error('Failed to generate and schedule tweet');
      }
    } catch (error) {
      console.error('Failed to generate and schedule tweet:', error);
      toast.error('Failed to generate and schedule tweet');
    } finally {
      setLoading(false);
    }
  }, [loading, generateForm, fetchTweets]);

  const bulkGenerateTweets = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_generate',
          count: BULK_GENERATION_CONFIG.count,
          ...generateForm,
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Generated ${data.tweets.length} tweets!`);
        await fetchTweets();
      } else {
        toast.error('Failed to bulk generate tweets');
      }
    } catch (error) {
      console.error('Failed to bulk generate tweets:', error);
      toast.error('Failed to bulk generate tweets');
    } finally {
      setLoading(false);
    }
  }, [loading, generateForm, fetchTweets]);

  const postTweet = useCallback(async (tweetId: string) => {
    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post' })
      });
      
      if (response.ok) {
        toast.success('Tweet posted!');
        await fetchTweets();
      } else {
        toast.error('Failed to post tweet');
      }
    } catch (error) {
      console.error('Failed to post tweet:', error);
      toast.error('Failed to post tweet');
    }
  }, [fetchTweets]);

  const deleteTweet = useCallback(async (tweetId: string) => {
    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Tweet deleted!');
        await fetchTweets();
      } else {
        toast.error('Failed to delete tweet');
      }
    } catch (error) {
      console.error('Failed to delete tweet:', error);
      toast.error('Failed to delete tweet');
    }
  }, [fetchTweets]);

  const updateTweetSchedule = useCallback(async (tweetId: string, newTime: Date) => {
    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          scheduledFor: newTime.toISOString(),
        })
      });
      
      if (response.ok) {
        await fetchTweets();
        toast.success('Schedule updated!');
      } else {
        toast.error('Failed to update schedule');
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      toast.error('Failed to update schedule');
    }
  }, [fetchTweets]);

  const scheduleSelectedTweets = useCallback(async () => {
    try {
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_selected',
          tweetIds: selectedTweets
        })
      });
      
      if (response.ok) {
        toast.success(`Scheduled ${selectedTweets.length} tweets!`);
        setSelectedTweets([]);
        await fetchTweets();
      } else {
        toast.error('Failed to schedule tweets');
      }
    } catch (error) {
      console.error('Failed to schedule tweets:', error);
      toast.error('Failed to schedule tweets');
    }
  }, [selectedTweets, fetchTweets]);

  const deleteSelectedTweets = useCallback(async () => {
    try {
      await Promise.all(selectedTweets.map(id => deleteTweet(id)));
      setSelectedTweets([]);
      toast.success(`Deleted ${selectedTweets.length} tweets!`);
    } catch (error) {
      console.error('Failed to delete tweets:', error);
      toast.error('Failed to delete tweets');
    }
  }, [selectedTweets, deleteTweet]);

  const toggleAutoScheduler = useCallback(async (action: 'start' | 'stop') => {
    try {
      const response = await fetch('/api/auto-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        setAutoSchedulerRunning(action === 'start');
        toast.success(`Scheduler ${action}ed!`);
        await fetchAutoSchedulerStats();
      } else {
        toast.error(`Failed to ${action} scheduler`);
      }
    } catch (error) {
      console.error(`Failed to ${action} scheduler:`, error);
      toast.error(`Failed to ${action} scheduler`);
    }
  }, [fetchAutoSchedulerStats]);

  const shareOnX = useCallback((tweet: Tweet) => {
    const tweetText = `${tweet.content}${tweet.hashtags.length > 0 ? ' ' + tweet.hashtags.join(' ') : ''}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
  }, []);

  // Utility functions
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-900 text-green-200';
      case 'scheduled': return 'bg-blue-900 text-blue-200';
      case 'failed': return 'bg-red-900 text-red-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const getQualityGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-yellow-400';
      case 'D': return 'text-orange-400';
      case 'F': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Effects
  useEffect(() => {
    fetchTweets();
    generateTweet();
    fetchAutoSchedulerStats();
    
    const interval = setInterval(fetchAutoSchedulerStats, 30000);
    return () => clearInterval(interval);
  }, [generateTweet, fetchTweets, fetchAutoSchedulerStats]);

  // Computed values
  const stats = {
    scheduled: tweets.filter(t => t.status === 'scheduled').length,
    posted: tweets.filter(t => t.status === 'posted').length,
  };

  return {
    // State
    tweets,
    latestTweet,
    selectedTweets,
    loading,
    schedulerRunning,
    autoSchedulerRunning,
    autoSchedulerStats,
    showHistory,
    generateForm,
    stats,
    
    // Actions
    setSelectedTweets,
    setShowHistory,
    setGenerateForm,
    generateTweet,
    generateAndScheduleTweet,
    bulkGenerateTweets,
    postTweet,
    deleteTweet,
    updateTweetSchedule,
    scheduleSelectedTweets,
    deleteSelectedTweets,
    toggleAutoScheduler,
    shareOnX,
    
    // Utilities
    getStatusBadgeColor,
    getQualityGradeColor,
    toDateTimeLocal,
    formatOptimalTime,
    formatISTTime,
    getNextOptimalPostTime,
    
    // Constants
    PERSONAS,
    BULK_GENERATION_CONFIG,
  };
}