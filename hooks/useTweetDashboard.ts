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
  {
    id: 'desi_philosopher',
    name: 'Desi Philosopher',
    description: 'Ancient wisdom meets modern chaos - philosophical insights with desi context',
    emoji: '🧘‍♂️',
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
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [autoSchedulerRunning, setAutoSchedulerRunning] = useState(false);
  const [autoChainRunning, setAutoChainRunning] = useState(() => {
    // Check localStorage for persisted state (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autoChainRunning');
      return saved === 'true';
    }
    return false;
  });
  const [autoSchedulerStats, setAutoSchedulerStats] = useState<AutoSchedulerStats | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [generateForm, setGenerateForm] = useState<GenerateFormState>({
    persona: 'unhinged_satirist',
    includeHashtags: true,
    useTrendingTopics: true,
    customPrompt: '',
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Track if component is mounted to prevent updates after unmount
  const [isMounted, setIsMounted] = useState(false);

  // API Functions
  const fetchTweets = useCallback(async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`/api/tweets?page=${page}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setTweets(data.data || []);
          setPagination({
            page: data.page || 1,
            limit: data.limit || 10,
            total: data.total || 0,
            totalPages: data.totalPages || 0,
            hasNext: data.hasNext || false,
            hasPrev: data.hasPrev || false,
          });
          
          // Set the latest tweet to the most recently created one from current page
          if (data.data && data.data.length > 0) {
            const latest = data.data.sort((a: Tweet, b: Tweet) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            setLatestTweet(latest);
          }
        }
      } else {
        console.warn('Failed to fetch tweets:', response.status);
        // Only show toast for user-initiated actions, not polling
      }
    } catch (error) {
      console.warn('Failed to fetch tweets:', error);
      // Only show toast for user-initiated actions, not polling
    }
  }, [isMounted]);

  const fetchAllTweets = useCallback(async () => {
    try {
      const response = await fetch('/api/tweets?limit=1000'); // Get all tweets for operations that need them
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.warn('Failed to fetch all tweets:', error);
      return [];
    }
  }, []);

  // Pagination navigation functions
  const goToPage = useCallback(async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      await fetchTweets(page, pagination.limit);
    }
  }, [pagination.totalPages, pagination.limit, fetchTweets]);

  const nextPage = useCallback(async () => {
    if (pagination.hasNext) {
      await fetchTweets(pagination.page + 1, pagination.limit);
    }
  }, [pagination.hasNext, pagination.page, pagination.limit, fetchTweets]);

  const prevPage = useCallback(async () => {
    if (pagination.hasPrev) {
      await fetchTweets(pagination.page - 1, pagination.limit);
    }
  }, [pagination.hasPrev, pagination.page, pagination.limit, fetchTweets]);

  const changePageSize = useCallback(async (newLimit: number) => {
    await fetchTweets(1, newLimit); // Reset to first page when changing page size
  }, [fetchTweets]);

  // Auto-scheduler stats are no longer needed since we use the self-triggering chain system
  const fetchAutoSchedulerStats = useCallback(async () => {
    // No-op: Auto-chain system doesn't need polling stats
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
          action: 'generate-and-schedule',
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
        const errorData = await response.json();
        console.error('Delete error:', errorData);
        toast.error(errorData.error || 'Failed to delete tweet');
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
      if (selectedTweets.length === 0) {
        toast.error('No tweets selected for deletion');
        return;
      }

      // Use bulk deletion API for better performance
      const response = await fetch('/api/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_delete',
          tweetIds: selectedTweets
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedTweets([]);
        toast.success(`Deleted ${result.deletedCount} tweets!`);
        await fetchTweets(); // Refresh the list
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tweets');
      }
    } catch (error) {
      console.error('Failed to delete tweets:', error);
      toast.error('Failed to delete tweets');
    }
  }, [selectedTweets, fetchTweets]);

  const toggleAutoScheduler = useCallback(async (action: 'start-chain' | 'stop-chain') => {
    try {
      if (action === 'start-chain') {
        setAutoChainRunning(true);
        // Persist state to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('autoChainRunning', 'true');
        }
        
        // Start the intelligent auto-chain system
        const response = await fetch('/api/auto-chain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const result = await response.json();
          toast.success('🚀 Smart automation started successfully!');
          toast.info(`Generated ${result.firstExecution?.results?.generated || 0} tweets. System will run continuously with 15 daily posts at optimal times.`);
        } else {
          const error = await response.json();
          toast.error(`Failed to start automation: ${error.details || 'Unknown error'}`);
          setAutoChainRunning(false);
          if (typeof window !== 'undefined') {
            localStorage.setItem('autoChainRunning', 'false');
          }
        }
      } else if (action === 'stop-chain') {
        // Stop the automation by updating state
        setAutoChainRunning(false);
        // Persist state to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('autoChainRunning', 'false');
        }
        toast.success('⏹️ Automation paused successfully');
        toast.info('System will stop scheduling new posts. Existing scheduled tweets will still be posted.');
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error);
      toast.error(`Failed to ${action === 'start-chain' ? 'start' : 'stop'} automation system`);
      // Reset state on error
      const shouldBeRunning = action === 'start-chain';
      setAutoChainRunning(shouldBeRunning);
      if (typeof window !== 'undefined') {
        localStorage.setItem('autoChainRunning', shouldBeRunning.toString());
      }
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
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Initial data fetch
    fetchTweets();
    fetchAutoSchedulerStats();
    
    // Poll auto-scheduler stats every 5 minutes
    const interval = setInterval(fetchAutoSchedulerStats, 300000);
    return () => clearInterval(interval);
  }, [fetchTweets, fetchAutoSchedulerStats]);

  // Separate effect for auto-generation on mount
  useEffect(() => {
    if (isMounted) {
      // Auto-generate a tweet on load to show fresh content
      const autoGenerateOnLoad = async () => {
        setAutoGenerating(true);
        try {
          const response = await fetch('/api/tweets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'generate',
              persona: 'unhinged_satirist',
              includeHashtags: true,
              useTrendingTopics: true,
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            setLatestTweet(data.tweet);
            await fetchTweets();
          }
        } catch (error) {
          console.warn('Failed to auto-generate tweet on load:', error);
        } finally {
          setAutoGenerating(false);
        }
      };

      // Delay auto-generation slightly to ensure component is fully mounted
      const timer = setTimeout(autoGenerateOnLoad, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMounted, fetchTweets]);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    await Promise.all([fetchTweets(), fetchAutoSchedulerStats()]);
  }, [fetchTweets, fetchAutoSchedulerStats]);

  // Computed values
  const scheduledTweets = tweets.filter(t => t.status === 'scheduled');
  const nextScheduledTweet = scheduledTweets
    .filter(t => t.scheduledFor && new Date(t.scheduledFor) > new Date())
    .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())[0];

  const stats = {
    scheduled: scheduledTweets.length,
    posted: tweets.filter(t => t.status === 'posted').length,
    nextPostTime: nextScheduledTweet?.scheduledFor,
  };

  return {
    // State
    tweets,
    latestTweet,
    selectedTweets,
    loading,
    autoGenerating,
    schedulerRunning,
    autoSchedulerRunning,
    autoChainRunning,
    autoSchedulerStats,
    showHistory,
    generateForm,
    pagination,
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
    refreshData,
    
    // Pagination actions
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    
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