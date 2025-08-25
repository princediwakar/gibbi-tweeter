import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getNextOptimalPostTime, formatOptimalTime, toDateTimeLocal } from '@/lib/timing';
import { formatForUserDisplay } from '@/lib/datetime';
import { Tweet, GenerateFormState, Persona } from '@/types/dashboard';
import { getPersonas } from '@/lib/personas';

// Use centralized persona configuration directly

const BULK_GENERATION_CONFIG = {
  count: 5,
  includeHashtags: true,
  useTrendingTopics: true,
};

// Helper function to parse dates from API response
function parseTweetDates(tweets: Tweet[]): Tweet[] {
  return tweets.map(tweet => ({
    ...tweet,
    scheduledFor: tweet.scheduledFor ? new Date(tweet.scheduledFor) : undefined,
    postedAt: tweet.postedAt ? new Date(tweet.postedAt) : undefined,
    createdAt: new Date(tweet.createdAt),
  }));
}

export function useTweetDashboard() {
  // State
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [latestTweet, setLatestTweet] = useState<Tweet | null>(null);
  const [selectedTweets, setSelectedTweets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Removed scheduler state - assuming always running
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [personas] = useState<Persona[]>(getPersonas()); // Initialize directly with centralized personas
  const [generateForm, setGenerateForm] = useState<GenerateFormState>({
    persona: getPersonas()[0]?.id || '', // Set default persona immediately
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
          setTweets(parseTweetDates(data.data || []));
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

  // Removed fetchAllTweets and fetchPersonas - now using centralized persona configuration directly

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

  // Removed auto-scheduler stats functionality

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
        setLatestTweet(parseTweetDates([data.tweet])[0]);
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
        setLatestTweet(parseTweetDates([data.tweet])[0]);
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

  // Removed toggleAutoScheduler - assuming always running

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
    setHasHydrated(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Initial data fetch
    fetchTweets();
  }, [fetchTweets]);


  // Manual refresh function
  const refreshData = useCallback(async () => {
    await fetchTweets();
  }, [fetchTweets]);

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
    showHistory,
    generateForm,
    pagination,
    stats,
    hasHydrated,
    
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
    formatForUserDisplay,
    getNextOptimalPostTime,
    
    // Constants
    personas,
    BULK_GENERATION_CONFIG,
  };
}