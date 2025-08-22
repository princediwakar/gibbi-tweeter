import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";

// ─────────────────────────────────────────────
// 🔑 Types & Interfaces
// ─────────────────────────────────────────────
export interface TrendingTopic {
  title: string;
  hashtag: string;
  traffic: string;
  category?: string;
  tweetUrl?: string;
  author?: string;
}

interface Sources {
  twitter: {
    handles: string[];
  };
  reddit: {
    subreddits: string[];
  };
}

interface CacheEntry {
  data: TrendingTopic[];
  timestamp: number;
  ttl: number;
}

// RSS response type for xml2js
interface RSSResponse {
  rss?: {
    channel?: Array<{
      item?: Array<{
        title?: string[];
        link?: string[];
        "ht:approx_traffic"?: string[];
      }>;
    }>;
  };
}

// Atom feed response type
interface AtomResponse {
  feed?: {
    entry?: Array<{
      title?: string | string[];
      link?: string | string[];
    }>;
  };
}

// Combined response type
type FeedResponse = RSSResponse | AtomResponse;

// ─────────────────────────────────────────────
// 🔧 Constants
// ─────────────────────────────────────────────
const CACHE_KEY = "twitter_trends";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins
const MAX_TOPICS = 8;

// User agents for better disguise
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const trendsCache: Map<string, CacheEntry> = new Map();

// ─────────────────────────────────────────────
// 🧰 Utility Helpers
// ─────────────────────────────────────────────
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const createHashtagFromTitle = (title: string): string => {
  // Common stop words to remove for more meaningful hashtags
  const stopWords = new Set([
    // 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    // 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'will', 'would',
    // 'could', 'should', 'may', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
    // 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
    // 'her', 'its', 'our', 'their', 'says', 'said', 'after', 'new', 'how', 'why', 'what',
    // 'when', 'where', 'who', 
    'might'
  ]);

  // Extract meaningful words and prioritize key terms
  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word[0].toUpperCase() + word.slice(1));

  if (words.length === 0) {
    // Fallback to original method if no meaningful words found
    const cleaned = title
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2) // Take first 2 words
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join("");
    return "#" + (cleaned.length > 25 ? cleaned.slice(0, 25) : cleaned);
  }

  // Build hashtag with meaningful words, respecting 20 char limit
  let hashtag = "";
  const maxLength = 19; // 20 chars total including the #
  
  for (const word of words) {
    if ((hashtag + word).length <= maxLength) {
      hashtag += word;
    } else {
      // If the current word would exceed limit, try to fit a shortened version
      const remainingSpace = maxLength - hashtag.length;
      if (remainingSpace >= 3 && hashtag.length > 0) {
        // Only add abbreviated word if we have at least 3 chars space and already have content
        hashtag += word.slice(0, remainingSpace);
      }
      break;
    }
  }

  // If hashtag is still empty or too short, take first significant word
  if (hashtag.length < 3) {
    const firstWord = words[0] || title.replace(/[^\w]/g, "").slice(0, 10);
    hashtag = firstWord.slice(0, maxLength);
  }

  return "#" + hashtag;
};

// ─────────────────────────────────────────────
// 📦 Cache Logic
// ─────────────────────────────────────────────
function getCachedTrends(): TrendingTopic[] | null {
  const cached = trendsCache.get(CACHE_KEY);
  if (cached && Date.now() < cached.timestamp + cached.ttl) {
    console.log("📦 Using cached Twitter trending topics");
    return cached.data;
  }
  // Force refresh for debugging
  console.log("🔄 Cache expired or not found, fetching fresh data");
  return null;
}

function setCachedTrends(data: TrendingTopic[]): void {
  trendsCache.set(CACHE_KEY, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL_MS,
  });
  console.log(`💾 Cached ${data.length} Twitter topics for ${CACHE_TTL_MS / 60000} minutes`);
}

// ─────────────────────────────────────────────
// 🚨 Failure Logging
// ─────────────────────────────────────────────
async function logFailure(method: string, error: string): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method,
    error,
  };
  try {
    const fs = await import("fs/promises");
    await fs.appendFile("failures.log", JSON.stringify(logEntry) + "\n");
    console.warn(`📉 Logged failure for ${method}: ${error}`);
  } catch (e) {
    console.error("❌ Failed to log error to file:", e);
  }
}

// ─────────────────────────────────────────────
// 🐦 Twitter RSS Feed System
// ─────────────────────────────────────────────
async function loadSources(): Promise<Sources> {
  try {
    const sourcesPath = path.join(process.cwd(), 'lib', 'sources.json');
    const data = await fs.readFile(sourcesPath, 'utf8');
    const sources: Sources = JSON.parse(data);
    return sources;
  } catch {
    console.warn('⚠️ Could not load sources, using defaults');
    return {
      twitter: {
        handles: ['@Inc42', '@livemint', '@EconomicTimes', '@anandmahindra', '@udaykotak']
      },
      reddit: {
        subreddits: ['delhi', 'bengaluru', 'IndiaTech']
      }
    };
  }
}

function getRandomTwitterHandles(handles: string[], count: number = 5): string[] {
  // Prioritize certain handles that we know are active
  const priorityHandles = ['@Inc42', '@ETtech', '@paraschopra', '@livemint'];
  const prioritySelected = priorityHandles.filter(handle => handles.includes(handle));
  
  // Get remaining handles randomly
  const remainingHandles = handles.filter(handle => !priorityHandles.includes(handle));
  const shuffled = [...remainingHandles].sort(() => 0.5 - Math.random());
  const randomSelected = shuffled.slice(0, count - prioritySelected.length);
  
  const result = [...prioritySelected, ...randomSelected];
  console.log(`🎯 Priority handles included: ${prioritySelected.join(', ')}`);
  return result;
}

function getRandomSubreddits(subreddits: string[], count: number = 5): string[] {
  const shuffled = [...subreddits].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function fetchFromTwitterRSS(): Promise<TrendingTopic[]> {
  console.log('🐦 Fetching Twitter RSS feeds via Google News...');
  
  const userAgent = getRandomUserAgent();
  const sources = await loadSources();
  const selectedHandles = getRandomTwitterHandles(sources.twitter.handles, 8);
  console.log(`🐦 Selected handles for RSS fetching: ${selectedHandles.join(', ')}`);
  
  const allTopics: TrendingTopic[] = [];
  
  for (const handle of selectedHandles) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      // Clean handle (remove @ if present)
      const cleanHandle = handle.replace('@', '');
      
      // Try multiple URL formats for better coverage - relaxed time windows
      const searchUrls = [
        // Primary: Recent content (3 days) for better chances
        `https://news.google.com/rss/search?q=site:x.com/${cleanHandle}+when:3d&hl=en-IN&gl=IN&ceid=IN:en`,
        `https://news.google.com/rss/search?q=site:twitter.com/${cleanHandle}+when:3d&hl=en-IN&gl=IN&ceid=IN:en`,
        `https://news.google.com/rss/search?q="${cleanHandle}"+when:3d&hl=en-IN&gl=IN&ceid=IN:en`,
        // Fallback: No time filter for maximum coverage
        `https://news.google.com/rss/search?q=site:x.com/${cleanHandle}&hl=en-IN&gl=IN&ceid=IN:en`,
        `https://news.google.com/rss/search?q=site:twitter.com/${cleanHandle}&hl=en-IN&gl=IN&ceid=IN:en`,
        `https://news.google.com/rss/search?q="${cleanHandle}"&hl=en-IN&gl=IN&ceid=IN:en`,
        // Additional broad searches
        `https://news.google.com/rss/search?q=${cleanHandle}+india&hl=en-IN&gl=IN&ceid=IN:en`,
        `https://news.google.com/rss/search?q=${cleanHandle}+tech&hl=en-IN&gl=IN&ceid=IN:en`
      ];
      
      console.log(`🔍 Searching Twitter content for ${handle}...`);
      
      // Special debugging for known active handles
      if (cleanHandle.toLowerCase() === 'inc42') {
        console.log(`🔍 Special attention: ${handle} is known to be active`);
      }
      
      let items: Array<{
        title?: string[];
        link?: string[];
        "ht:approx_traffic"?: string[];
      }> = [];
      let success = false;
      
      // Try multiple URL formats
      for (let i = 0; i < searchUrls.length; i++) {
        const searchUrl = searchUrls[i];
        try {
          const response = await fetch(searchUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'application/rss+xml,application/xml,text/xml',
              'Accept-Language': 'en-IN,en;q=0.9',
            },
            signal: controller.signal,
          });

          if (!response.ok) {
            if (cleanHandle.toLowerCase() === 'inc42') {
              console.log(`⚠️ URL ${i + 1} failed for ${handle}: ${response.status} - ${searchUrl.split('?q=')[1]?.split('&')[0]}`);
            }
            continue; // Try next URL format
          }

          const xml = await response.text();
          const parsed: RSSResponse = await parseStringPromise(xml);
          const fetchedItems = parsed?.rss?.channel?.[0]?.item ?? [];
          
          if (Array.isArray(fetchedItems) && fetchedItems.length > 0) {
            items = fetchedItems;
            success = true;
            console.log(`✅ Found content using URL format ${i + 1}: ${searchUrl.split('?q=')[1]?.split('&')[0]}`);
            break; // Use this successful result
          } else {
            if (cleanHandle.toLowerCase() === 'inc42') {
              console.log(`⚠️ URL ${i + 1} returned empty results for ${handle}: ${searchUrl.split('?q=')[1]?.split('&')[0]}`);
            }
          }
        } catch (err) {
          if (cleanHandle.toLowerCase() === 'inc42') {
            console.log(`⚠️ URL ${i + 1} threw error for ${handle}: ${err instanceof Error ? err.message : String(err)}`);
          }
          // Continue to next URL format
          continue;
        }
      }
      
      if (!success) {
        console.log(`📭 No content found for ${handle} with any URL format`);
        
        // Try one more fallback: direct Twitter RSS (if available)
        try {
          const twitterRssUrl = `https://nitter.net/${cleanHandle}/rss`;
          const response = await fetch(twitterRssUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'application/rss+xml,application/xml,text/xml',
            },
            signal: controller.signal,
          });
          
          if (response.ok) {
            const xml = await response.text();
            const parsed: RSSResponse = await parseStringPromise(xml);
            const fetchedItems = parsed?.rss?.channel?.[0]?.item ?? [];
            
            if (Array.isArray(fetchedItems) && fetchedItems.length > 0) {
              items = fetchedItems;
              success = true;
              console.log(`✅ Found content using Nitter RSS for ${handle}`);
            }
          }
        } catch {
          // Ignore this fallback error
        }
        
        if (!success) {
          continue; // Move to next handle
        }
      }

      if (Array.isArray(items) && items.length > 0) {
        const topics: TrendingTopic[] = items
          .slice(0, 3) // Take max 3 per handle
          .filter((item) => {
            const title = item.title?.[0]?.trim();
            // More lenient filtering for Twitter content
            return title && 
                   title.length > 10 && // Further reduced minimum length
                   title.length < 300 && // Increased maximum length
                   !title.startsWith('http') && // Exclude URLs
                   !title.match(/^https?:\/\//) && // Exclude URLs more thoroughly
                   !title.includes('support.') && // Exclude support pages
                   !title.includes('help.') && // Exclude help pages
                   !title.includes('docs.') && // Exclude documentation
                   !title.includes('api.') && // Exclude API pages
                   !title.toLowerCase().includes('cookie') && // Exclude cookie notices
                   !title.toLowerCase().includes('privacy') && // Exclude privacy notices
                   title.split(' ').length > 1; // Just need more than 1 word
          })
          .map((item) => {
            const title = item.title?.[0]?.trim() ?? "Twitter Update";
            // Clean the title from news formatting
            const cleanTitle = title
              .replace(/^.*?:\s*/, '') // Remove news source prefix
              .replace(/\s*-\s*(Twitter|X\.com).*$/i, '') // Remove Twitter suffix
              .replace(/\s*\.\.\.$/, '') // Remove trailing ellipsis
              .replace(/^["']|["']$/g, '') // Remove quotes
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            // Very lenient validation for Twitter content
            if (!cleanTitle || cleanTitle.length < 5 || cleanTitle.length > 250) {
              return null;
            }
            
            const topic: TrendingTopic = {
              title: cleanTitle,
              hashtag: createHashtagFromTitle(cleanTitle),
              traffic: `${randomInt(10, 100)}K`,
              category: `Twitter via ${handle}`,
              author: handle,
              tweetUrl: item.link?.[0] || `https://x.com/${cleanHandle}`,
            };
            return topic;
          })
          .filter((topic): topic is TrendingTopic => topic !== null); // Remove null entries with proper typing

        allTopics.push(...topics);
        if (topics.length > 0) {
          console.log(`✅ Found ${topics.length} tweets from ${handle}`);
          console.log(`📝 Sample topics from ${handle}:`, topics.slice(0, 2).map(t => t.title.substring(0, 60) + '...'));
        }
      } else {
        console.log(`📭 No recent tweets found for ${handle}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`⚠️ Twitter RSS failed for ${handle}: ${message}`);
      await logFailure(`TwitterRSS-${handle}`, message);
    } finally {
      clearTimeout(timeoutId);
    }
    
    // Small delay between requests to be respectful
    await delay(randomInt(1000, 2000));
  }
  
  if (allTopics.length > 0) {
    // Shuffle and take top topics
    const shuffled = allTopics.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, MAX_TOPICS);
    console.log(`✅ Twitter RSS successful - ${selected.length} topics from ${selectedHandles.length} handles`);
    return selected;
  }
  
  throw new Error('No Twitter content found from any handles');
}

// ─────────────────────────────────────────────
// 🔴 Reddit RSS Feed System
// ─────────────────────────────────────────────
async function fetchFromRedditRSS(): Promise<TrendingTopic[]> {
  console.log('🔴 Fetching Reddit RSS feeds...');
  
  const userAgent = getRandomUserAgent();
  const sources = await loadSources();
  const selectedSubreddits = getRandomSubreddits(sources.reddit.subreddits, 6);
  
  const allTopics: TrendingTopic[] = [];
  
  for (const subreddit of selectedSubreddits) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased timeout
    
    try {
      // Try multiple Reddit RSS formats for better reliability
      const rssUrls = [
        `https://www.reddit.com/r/${subreddit}.rss`,
        `https://www.reddit.com/r/${subreddit}/hot.rss`,
        `https://www.reddit.com/r/${subreddit}/new.rss`,
        `https://old.reddit.com/r/${subreddit}.rss`
      ];
      
      console.log(`🔍 Fetching content from r/${subreddit}...`);
      
      let response;
      let xml;
      let success = false;
      
      // Try different Reddit RSS URLs
      for (const rssUrl of rssUrls) {
        try {
          response = await fetch(rssUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'application/rss+xml,application/xml,text/xml',
              'Accept-Language': 'en-IN,en;q=0.9',
            },
            signal: controller.signal,
          });

          if (response.ok) {
            xml = await response.text();
            success = true;
            console.log(`✅ Successfully fetched from ${rssUrl}`);
            break;
          }
        } catch (err) {
          console.log(`⚠️ Failed to fetch ${rssUrl}: ${err instanceof Error ? err.message : String(err)}`);
          continue;
        }
      }
      
      if (!success || !xml) {
        throw new Error(`All Reddit RSS URLs failed for r/${subreddit}`);
      }

      const parsed: FeedResponse = await parseStringPromise(xml);
      // Handle both RSS and Atom feeds
      const items = ('rss' in parsed ? parsed?.rss?.channel?.[0]?.item : (parsed as AtomResponse)?.feed?.entry) ?? [];

      if (Array.isArray(items) && items.length > 0) {
        const topics: TrendingTopic[] = items
          .slice(0, 5) // Take max 5 per subreddit for better variety
          .filter((item) => {
            // Handle both RSS and Atom feed formats
            const title = Array.isArray(item.title) ? item.title[0]?.trim() : typeof item.title === 'string' ? item.title.trim() : '';
            // More lenient filtering for Reddit content
            return title && 
                   title.length > 10 && // Reduced minimum length
                   title.length < 300 && // Increased maximum length
                   !title.includes('[deleted]') && 
                   !title.includes('[removed]') &&
                   !title.toLowerCase().includes('nsfw') &&
                   !title.startsWith('http') && // Exclude URLs
                   !title.match(/^https?:\/\//) && // Exclude URLs more thoroughly
                   !title.match(/^\[.*\]$/) && // Skip posts that are just [category] tags
                   title.split(' ').length > 2; // Must have at least 3 words
          })
          .map((item) => {
            // Handle both RSS and Atom feed formats
            const title = Array.isArray(item.title) ? item.title[0]?.trim() : typeof item.title === 'string' ? item.title.trim() : "Reddit Post";
            // Clean the title from Reddit formatting
            const cleanTitle = title
              .replace(/^submitted by .*? to .*?$/i, '') // Remove submission info
              .replace(/\s*\[.*?\]\s*/g, '') // Remove category tags
              .replace(/^r\/.*?:\s*/, '') // Remove subreddit prefix
              .replace(/\s*\.\.\.$/, '') // Remove trailing ellipsis
              .replace(/^["']|["']$/g, '') // Remove quotes
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();
            
            // More lenient validation
            if (!cleanTitle || cleanTitle.length < 8 || cleanTitle.length > 200) {
              return null;
            }
            
            const topic: TrendingTopic = {
              title: cleanTitle,
              hashtag: createHashtagFromTitle(cleanTitle),
              traffic: `${randomInt(5, 50)}K`, // Reddit traffic is generally lower
              category: `Reddit r/${subreddit}`,
              author: `r/${subreddit}`,
              tweetUrl: (Array.isArray(item.link) ? item.link[0] : item.link) || `https://www.reddit.com/r/${subreddit}`,
            };
            return topic;
          })
          .filter((topic): topic is TrendingTopic => topic !== null); // Remove null entries with proper typing

        allTopics.push(...topics);
        if (topics.length > 0) {
          console.log(`✅ Found ${topics.length} posts from r/${subreddit}`);
        }
      } else {
        console.log(`📭 No recent posts found for r/${subreddit}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`⚠️ Reddit RSS failed for r/${subreddit}: ${message}`);
      await logFailure(`RedditRSS-${subreddit}`, message);
    } finally {
      clearTimeout(timeoutId);
    }
    
    // Small delay between requests to be respectful
    await delay(randomInt(1000, 2000));
  }
  
  if (allTopics.length > 0) {
    // Shuffle and take top topics
    const shuffled = allTopics.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, MAX_TOPICS);
    console.log(`✅ Reddit RSS successful - ${selected.length} topics from ${selectedSubreddits.length} subreddits`);
    return selected;
  }
  
  throw new Error('No Reddit content found from any subreddits');
}

// ─────────────────────────────────────────────
// 🏗️ Static Fallback Topics  
// ─────────────────────────────────────────────
function getStaticFallbackTopics(): TrendingTopic[] {
  const fallbackTopics = [
    { title: "Indian Startup Ecosystem", traffic: "500K", category: "Business" },
    { title: "Digital India Initiatives", traffic: "800K", category: "Technology" },
    { title: "Bollywood Industry Updates", traffic: "300K", category: "Entertainment" },
    { title: "Cricket Season Highlights", traffic: "400K", category: "Sports" },
    { title: "Tech Innovation in India", traffic: "250K", category: "Technology" },
    { title: "Indian Political Landscape", traffic: "600K", category: "Politics" },
    { title: "Economic Policy Changes", traffic: "350K", category: "Economy" },
    { title: "Social Media Trends", traffic: "450K", category: "Social" },
  ];

  return fallbackTopics.map(topic => ({
    ...topic,
    hashtag: createHashtagFromTitle(topic.title),
  }));
}

// ─────────────────────────────────────────────
// 🎯 Main API
// ─────────────────────────────────────────────
export async function getTrendingTopics(): Promise<TrendingTopic[]> {
  const cached = getCachedTrends();
  if (cached) {
    return cached;
  }

  console.log("🚀 Attempting to fetch from multiple RSS sources...");
  
  const allTopics: TrendingTopic[] = [];

  // Try Twitter RSS feeds first
  try {
    console.log("🐦 Attempting Twitter RSS feeds...");
    const twitterTopics = await fetchFromTwitterRSS();
    if (twitterTopics.length > 0) {
      console.log(`✅ Twitter RSS successful - ${twitterTopics.length} topics`);
      allTopics.push(...twitterTopics.slice(0, Math.floor(MAX_TOPICS / 2))); // Take half from Twitter
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`⚠️ Twitter RSS failed: ${message}`);
    await logFailure('TwitterRSS-Main', message);
  }

  // Try Reddit RSS feeds
  try {
    console.log("🔴 Attempting Reddit RSS feeds...");
    const redditTopics = await fetchFromRedditRSS();
    if (redditTopics.length > 0) {
      console.log(`✅ Reddit RSS successful - ${redditTopics.length} topics`);
      allTopics.push(...redditTopics.slice(0, MAX_TOPICS - allTopics.length)); // Fill remaining slots
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`⚠️ Reddit RSS failed: ${message}`);
    await logFailure('RedditRSS-Main', message);
  }

  // If we got some topics from either source, use them
  if (allTopics.length > 0) {
    console.log(`✅ Combined RSS successful - ${allTopics.length} topics from multiple sources`);
    console.log(`📊 Sample topics:`, allTopics.slice(0, 3).map(t => `${t.title} (${t.category})`));
    setCachedTrends(allTopics);
    return allTopics;
  }

  // Final fallback: Static topics
  console.log("📋 All RSS sources failed, using static fallback topics");
  const staticTopics = getStaticFallbackTopics();
  setCachedTrends(staticTopics);
  return staticTopics;
}