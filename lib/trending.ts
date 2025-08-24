import { parseStringPromise } from "xml2js";
import fs from "fs/promises";
import path from "path";

// Use native fetch in Node.js 18+
const fetchFn = globalThis.fetch;

// ─────────────────────────────────────────────
// 🔑 Types & Interfaces
// ─────────────────────────────────────────────
export interface TrendingTopic {
  title: string;
  traffic: string;
  category?: string;
  hashtags: string[];
}

interface CacheEntry {
  data: TrendingTopic[];
  timestamp: number;
  ttl: number;
}

interface Sources {
  twitter: {
    handles: string[];
  };
  reddit: {
    subreddits: string[];
  };
}

interface RSSItem {
  title?: string[];
  link?: string[];
  pubDate?: string[];
  "ht:approx_traffic"?: string[];
}

interface RSSResponse {
  rss?: {
    channel?: Array<{
      item?: RSSItem[];
    }>;
  };
}

// ─────────────────────────────────────────────
// 🔧 Constants
// ─────────────────────────────────────────────
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins
const trendsCache: Map<string, CacheEntry> = new Map();

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─────────────────────────────────────────────
// 📦 Cache Logic
// ─────────────────────────────────────────────
function getCachedTrends(persona?: string): TrendingTopic[] | null {
  const cacheKey = persona ? `trends_${persona}` : "twitter_trends";
  const cached = trendsCache.get(cacheKey);
  if (cached && Date.now() < cached.timestamp + cached.ttl) {
    console.log(`📦 Using cached trending topics for ${persona || 'general'}`);
    return cached.data;
  }
  return null;
}

function setCachedTrends(topics: TrendingTopic[], persona?: string): void {
  const cacheKey = persona ? `trends_${persona}` : "twitter_trends";
  trendsCache.set(cacheKey, {
    data: topics,
    timestamp: Date.now(),
    ttl: CACHE_TTL_MS,
  });
  console.log(`💾 Cached ${topics.length} trending topics for ${persona || 'general'}`);
}

// ─────────────────────────────────────────────
// 📁 Source Loading
// ─────────────────────────────────────────────
async function loadSources(persona?: string): Promise<Sources> {
  let sourceFile = 'sources.json';
  
  if (persona) {
    // Map persona names to source file names
    const personaToFile: Record<string, string> = {
      'sat_coach': 'sources-sat.json',
      'gre_master': 'sources-gre.json',
      'gmat_pro': 'sources-gmat.json',
    };
    
    sourceFile = personaToFile[persona] || 'sources.json';
  }
  
  try {
    const sourcePath = path.join(process.cwd(), 'lib', sourceFile);
    const data = await fs.readFile(sourcePath, 'utf8');
    const sources: Sources = JSON.parse(data);
    console.log(`📁 Loaded sources from ${sourceFile} for ${persona || 'general'}`);
    return sources;
  } catch {
    console.warn(`⚠️ Could not load ${sourceFile}, using fallback sources.json`);
    
    // Fallback to general sources.json
    if (sourceFile !== 'sources.json') {
      try {
        const fallbackPath = path.join(process.cwd(), 'lib', 'sources.json');
        const fallbackData = await fs.readFile(fallbackPath, 'utf8');
        const fallbackSources: Sources = JSON.parse(fallbackData);
        console.log(`📁 Using fallback sources.json for ${persona || 'general'}`);
        return fallbackSources;
      } catch {
        console.warn('⚠️ Could not load fallback sources.json either, using defaults');
      }
    }
    
    // Final fallback to hardcoded defaults
    return {
      twitter: {
        handles: ["@CollegeBoard", "@ETS", "@KaplanTestPrep", "@PrincetonReview"]
      },
      reddit: {
        subreddits: ["SAT", "GRE", "GMAT", "college", "ApplyingToCollege"]
      }
    };
  }
}

// ─────────────────────────────────────────────
// 🐦 Google News RSS Fetching
// ─────────────────────────────────────────────
async function fetchFromGoogleNews(persona?: string): Promise<TrendingTopic[]> {
  console.log(`📡 Fetching Google News RSS feeds for ${persona || 'general'}...`);
  
  const userAgent = getRandomUserAgent();
  const sources = await loadSources(persona);
  const selectedHandles = getRandomTwitterHandles(sources.twitter.handles, 6);
  
  const allTopics: TrendingTopic[] = [];
  
  for (const handle of selectedHandles) {
    try {
      const cleanHandle = handle.replace('@', '');
      
      // Try multiple search strategies
      const searchUrls = [
        `https://news.google.com/rss/search?q=site:x.com/${cleanHandle}+when:3d&hl=en-US&gl=US&ceid=US:en`,
        `https://news.google.com/rss/search?q="${cleanHandle}"+education+test+prep+when:3d&hl=en-US&gl=US&ceid=US:en`,
        `https://news.google.com/rss/search?q=${cleanHandle}+college+university+when:3d&hl=en-US&gl=US&ceid=US:en`,
      ];
      
      for (const searchUrl of searchUrls) {
        try {
          const response = await fetchFn(searchUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'application/rss+xml,application/xml,text/xml',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(10000),
          });

          if (!response.ok) continue;

          const xml = await response.text();
          const parsed: RSSResponse = await parseStringPromise(xml);
          const items = parsed?.rss?.channel?.[0]?.item ?? [];
          
          if (items.length > 0) {
            const topics = items.slice(0, 3).map((item: RSSItem) => ({
              title: Array.isArray(item.title) ? item.title[0] : item.title || 'Breaking News',
              traffic: Array.isArray(item["ht:approx_traffic"]) ? item["ht:approx_traffic"][0] : Math.floor(Math.random() * 500 + 100) + 'K',
              category: 'News',
              hashtags: []
            }));
            
            allTopics.push(...topics);
            console.log(`✅ Found ${topics.length} topics from ${handle}`);
            break; // Success, move to next handle
          }
        } catch {
          continue; // Try next URL
        }
      }
    } catch {
      console.warn(`⚠️ Failed to fetch from ${handle}`);
      continue;
    }
  }
  
  return allTopics;
}

// ─────────────────────────────────────────────
// 🔴 Reddit RSS Fetching
// ─────────────────────────────────────────────
async function fetchFromReddit(persona?: string): Promise<TrendingTopic[]> {
  console.log(`🔴 Fetching Reddit RSS feeds for ${persona || 'general'}...`);
  
  const userAgent = getRandomUserAgent();
  const sources = await loadSources(persona);
  const selectedSubreddits = getRandomSubreddits(sources.reddit.subreddits, 4);
  
  const allTopics: TrendingTopic[] = [];
  
  for (const subreddit of selectedSubreddits) {
    try {
      const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=5`;
      
      const response = await fetchFn(redditUrl, {
        headers: {
          'User-Agent': userAgent,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const data = await response.json() as { data?: { children?: Array<{ data: { title: string; score: number } }> } };
      const posts = data?.data?.children || [];
      
      if (posts.length > 0) {
        const topics = posts.slice(0, 2).map((post) => ({
          title: post.data.title || 'Reddit Discussion',
          traffic: (post.data.score || Math.floor(Math.random() * 1000)) + ' upvotes',
          category: 'Discussion',
          hashtags: []
        }));
        
        allTopics.push(...topics);
        console.log(`✅ Found ${topics.length} topics from r/${subreddit}`);
      }
    } catch {
      console.warn(`⚠️ Failed to fetch from r/${subreddit}`);
      continue;
    }
  }
  
  return allTopics;
}

// ─────────────────────────────────────────────
// 🎯 Helper Functions
// ─────────────────────────────────────────────
function getRandomTwitterHandles(handles: string[], count: number = 5): string[] {
  const shuffled = [...handles].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomSubreddits(subreddits: string[], count: number = 5): string[] {
  const shuffled = [...subreddits].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getStaticFallbackTopics(): TrendingTopic[] {
  const fallbackTopics = [
    { title: "SAT Test Changes 2024", traffic: "500K", category: "SAT", hashtags: ["#SAT2024", "#TestPrep"] },
    { title: "College Application Deadlines", traffic: "800K", category: "College", hashtags: ["#CollegePrep", "#Applications"] },
    { title: "GRE Score Requirements", traffic: "300K", category: "GRE", hashtags: ["#GRE", "#GradSchool"] },
    { title: "GMAT vs GRE for MBA", traffic: "400K", category: "MBA", hashtags: ["#GMAT", "#MBA"] },
    { title: "Study Abroad Scholarships", traffic: "250K", category: "Education", hashtags: ["#Scholarships", "#StudyAbroad"] },
    { title: "US University Rankings 2024", traffic: "600K", category: "Universities", hashtags: ["#Rankings", "#College"] },
    { title: "Student Loan Updates", traffic: "350K", category: "Finance", hashtags: ["#StudentLoans", "#Education"] },
    { title: "Online Learning Trends", traffic: "450K", category: "EdTech", hashtags: ["#OnlineLearning", "#EdTech"] },
  ];

  return fallbackTopics;
}

// ─────────────────────────────────────────────
// 🎯 Main API
// ─────────────────────────────────────────────
export async function getTrendingTopics(persona?: string): Promise<TrendingTopic[]> {
  const cached = getCachedTrends(persona);
  if (cached) {
    return cached;
  }

  console.log(`🎯 Fetching real-time trending topics for ${persona || 'general'}...`);
  
  const allTopics: TrendingTopic[] = [];
  
  try {
    // Try to fetch from RSS sources with timeout
    const rssPromises = [
      fetchFromGoogleNews(persona),
      fetchFromReddit(persona)
    ];
    
    // Race with timeout to ensure we don't hang
    const results = await Promise.allSettled(
      rssPromises.map(promise => 
        Promise.race([
          promise,
          new Promise<TrendingTopic[]>((_, reject) => 
            setTimeout(() => reject(new Error('RSS fetch timeout')), 15000)
          )
        ])
      )
    );
    
    // Collect successful results
    results.forEach(result => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allTopics.push(...result.value);
      }
    });
    
    console.log(`📊 Fetched ${allTopics.length} topics from RSS sources`);
    
  } catch (error) {
    console.warn('⚠️ RSS fetching failed, using static fallback:', error);
  }
  
  // If we don't have enough topics, add static fallbacks
  if (allTopics.length < 5) {
    const staticTopics = getStaticFallbackTopics();
    const needed = 8 - allTopics.length;
    allTopics.push(...staticTopics.slice(0, needed));
    console.log(`📋 Added ${needed} static fallback topics`);
  }
  
  // Shuffle and limit to 8 topics
  const finalTopics = allTopics.sort(() => 0.5 - Math.random()).slice(0, 8);
  
  setCachedTrends(finalTopics, persona);
  return finalTopics;
}