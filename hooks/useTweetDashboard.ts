import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { formatForUserDisplay, toDateTimeLocal } from '@/lib/datetime';
import { Tweet, GenerateFormState, Persona } from '@/types/dashboard';
import { PERSONAS } from '@/lib/personas';

// Use centralized persona configuration directly

const BULK_GENERATION_CONFIG = {
  count: 5,
  includeHashtags: true,
  useTrendingTopics: false,
};

// Helper function to parse dates from API response
function parseTweetDates(tweets: Tweet[]): Tweet[] {
  return tweets.map(tweet => ({
    ...tweet,
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
  const [personas] = useState<Persona[]>(PERSONAS); // Initialize directly with centralized personas
  const [generateForm, setGenerateForm] = useState<GenerateFormState>({
    persona: PERSONAS[0]?.id || '', // Set default persona immediately
    includeHashtags: true,
    useTrendingTopics: false,
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
      case 'ready': return 'bg-blue-900 text-blue-200';
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
  const readyTweets = tweets.filter(t => t.status === 'ready');

  const stats = {
    ready: readyTweets.length,
    posted: tweets.filter(t => t.status === 'posted').length,
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
    bulkGenerateTweets,
    postTweet,
    deleteTweet,
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
    formatForUserDisplay,
    toDateTimeLocal,
    
    // Constants
    personas,
    BULK_GENERATION_CONFIG,
  };
}