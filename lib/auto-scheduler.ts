import * as cron from 'node-cron';
import { generateHighQualityTweets, selectBestTweetsForPosting, saveGeneratedTweets } from './auto-generator';
import { saveTweet, generateTweetId } from './db';
import { postToTwitter } from './twitter';
import { toIST, logIST } from './timezone';

interface AutoSchedulerState {
  isRunning: boolean;
  cronJobs: cron.ScheduledTask[];
  stats: {
    totalGenerated: number;
    totalPosted: number;
    lastRun: Date | null;
    nextRun: Date | null;
  };
}

class AutoScheduler {
  // ⚠️ IMPORTANT: On Vercel serverless, this scheduler only runs while there are active requests
  // For true background scheduling, consider using Vercel Cron Jobs or external services
  // Browser closing doesn't stop it, but serverless functions can hibernate without traffic
  private state: AutoSchedulerState = {
    isRunning: false,
    cronJobs: [],
    stats: {
      totalGenerated: 0,
      totalPosted: 0,
      lastRun: null,
      nextRun: null,
    },
  };

  async start(): Promise<void> {
    if (this.state.isRunning) {
      console.log('🤖 Auto-scheduler is already running');
      return;
    }

    console.log('🚀 Starting automated tweet scheduler...');

    // Multiple posting times throughout the day (10-15 posts daily)
    const schedules = [
      { time: '0 8 * * 1-5', slot: '8am' },     // 8 AM
      { time: '0 10 * * 1-5', slot: '10am' },   // 10 AM  
      { time: '0 12 * * 1-5', slot: '12pm' },   // 12 PM
      { time: '0 14 * * 1-5', slot: '2pm' },    // 2 PM
      { time: '0 15 * * 1-5', slot: '3pm' },    // 3 PM
      { time: '0 17 * * 1-5', slot: '5pm' },    // 5 PM
      { time: '0 19 * * 1-5', slot: '7pm' },    // 7 PM
      { time: '0 21 * * 1-5', slot: '9pm' },    // 9 PM
      { time: '30 9 * * 1-5', slot: '9:30am' }, // 9:30 AM
      { time: '30 11 * * 1-5', slot: '11:30am' }, // 11:30 AM
      { time: '30 13 * * 1-5', slot: '1:30pm' }, // 1:30 PM
      { time: '30 16 * * 1-5', slot: '4:30pm' }, // 4:30 PM
      { time: '30 18 * * 1-5', slot: '6:30pm' }, // 6:30 PM
      { time: '30 20 * * 1-5', slot: '8:30pm' }, // 8:30 PM
      { time: '0 22 * * 1-5', slot: '10pm' },   // 10 PM
    ];

    const jobs = schedules.map(({ time, slot }) => {
      const job = cron.schedule(time, async () => {
        await this.automatedTweetGeneration(slot);
      });
      
      return job;
    });

    this.state.cronJobs = jobs;
    this.state.isRunning = true;

    // Calculate next run time
    this.updateNextRunTime();

    console.log('✅ Auto-scheduler started successfully');
    console.log('📅 Schedule: 10-15 posts daily on weekdays (8am-10pm)');
  }

  async stop(): Promise<void> {
    if (!this.state.isRunning) {
      console.log('🤖 Auto-scheduler is not running');
      return;
    }

    console.log('⏹️ Stopping automated tweet scheduler...');

    // Stop all cron jobs
    this.state.cronJobs.forEach(job => {
      job.stop();
      job.destroy();
    });

    this.state.cronJobs = [];
    this.state.isRunning = false;
    this.state.stats.nextRun = null;

    console.log('✅ Auto-scheduler stopped successfully');
  }

  private async automatedTweetGeneration(timeSlot: string): Promise<void> {
    logIST(`🌅 Starting automated tweet generation for ${timeSlot} slot...`);
    this.state.stats.lastRun = toIST(new Date());

    // Add randomization - sometimes skip a slot to vary posting frequency (85% chance to post)
    if (Math.random() > 0.85) {
      console.log(`🎲 Randomly skipping ${timeSlot} slot for natural variation`);
      return;
    }

    try {
      // Generate 3-8 high-quality tweets for selection
      const targetCount = Math.floor(Math.random() * 6) + 3; // 3-8 tweets
      console.log(`🎯 Generating ${targetCount} tweets for quality selection...`);

      const generatedTweets = await generateHighQualityTweets({
        count: targetCount,
        minQualityScore: 80, // High quality threshold
        maxAttempts: targetCount * 4, // Allow more attempts for quality
      });

      this.state.stats.totalGenerated += generatedTweets.length;

      if (generatedTweets.length === 0) {
        console.log('❌ No high-quality tweets generated, skipping posting');
        return;
      }

      // Select the best tweet for posting
      const bestTweets = await selectBestTweetsForPosting(generatedTweets, 1);

      if (bestTweets.length === 0) {
        console.log('❌ No tweets selected for posting');
        return;
      }

      const selectedTweet = bestTweets[0];

      // Randomize content presentation for posting
      const postingVariations = this.randomizePostingContent(selectedTweet);

      // Save the selected tweet and mark it for immediate posting
      const tweetToPost = {
        ...selectedTweet,
        content: postingVariations.finalContent, // Use potentially modified content
        hashtags: postingVariations.hashtagsToUse, // Use potentially filtered hashtags
        id: generateTweetId(),
        scheduledFor: new Date(), // Post immediately
        status: 'scheduled' as const,
      };

      await saveTweet(tweetToPost);

      // Post to Twitter with the randomized content
      try {
        console.log(`🎲 Posting randomized version:`);
        console.log(`📝 Content: ${tweetToPost.content}`);
        console.log(`#️⃣ Hashtags: ${tweetToPost.hashtags.length > 0 ? tweetToPost.hashtags.join(' ') : 'None'}`);
        
        const result = await postToTwitter(tweetToPost.content, tweetToPost.hashtags);
        
        // Update tweet with posting result
        const postedTweet = {
          ...tweetToPost,
          status: 'posted' as const,
          postedAt: new Date(),
          twitterId: result.data?.id,
          twitterUrl: result.data?.id ? `https://x.com/user/status/${result.data.id}` : undefined,
        };

        await saveTweet(postedTweet);
        this.state.stats.totalPosted++;

        console.log(`✅ Tweet posted successfully for ${timeSlot} slot!`);
        console.log(`📊 Quality: ${selectedTweet.qualityScore.overall}/100 (${selectedTweet.qualityScore.grade})`);
        console.log(`🐦 Content: ${selectedTweet.content}`);

        // Save remaining tweets as drafts for manual review
        const remainingTweets = generatedTweets.filter(t => t.id !== selectedTweet.id);
        if (remainingTweets.length > 0) {
          await saveGeneratedTweets(remainingTweets);
          console.log(`💾 Saved ${remainingTweets.length} additional tweets as drafts`);
        }

      } catch (postError) {
        console.error('❌ Failed to post tweet to Twitter:', postError);
        
        // Mark tweet as failed
        const failedTweet = {
          ...tweetToPost,
          status: 'failed' as const,
          errorMessage: postError instanceof Error ? postError.message : 'Unknown error',
        };
        await saveTweet(failedTweet);
      }

    } catch (error) {
      console.error(`❌ Automated tweet generation failed for ${timeSlot}:`, error);
    }

    this.updateNextRunTime();
  }

  private randomizePostingContent(tweet: { content: string; hashtags: string[] }): { finalContent: string; hashtagsToUse: string[] } {
    console.log(`🎲 Randomizing posting content...`);
    
    // Randomization probabilities
    const includeHashtags = Math.random() < 0.65; // 65% chance to include hashtags
    const removeSourceMentions = Math.random() < 0.4; // 40% chance to remove source references
    const shortenContent = Math.random() < 0.3; // 30% chance to slightly shorten content
    const addVariation = Math.random() < 0.25; // 25% chance to add small variations
    
    let finalContent = tweet.content;
    let hashtagsToUse = includeHashtags ? [...tweet.hashtags] : [];
    
    // Remove source mentions (Twitter handles, subreddit references)
    if (removeSourceMentions) {
      finalContent = finalContent
        .replace(/via @\w+/gi, '') // Remove "via @handle"
        .replace(/from r\/\w+/gi, '') // Remove "from r/subreddit"
        .replace(/\(source: [^)]+\)/gi, '') // Remove "(source: ...)"
        .replace(/- @\w+/gi, '') // Remove "- @handle"
        .replace(/h\/t @\w+/gi, '') // Remove "h/t @handle"
        .replace(/\s+/g, ' ') // Clean up extra spaces
        .trim();
      
      console.log(`🔄 Removed source mentions`);
    }
    
    // Shorten content by removing some filler words/phrases
    if (shortenContent && finalContent.length > 180) {
      const fillerPatterns = [
        /\bactually\b/gi,
        /\bobviously\b/gi,
        /\bbasically\b/gi,
        /\byou know\b/gi,
        /\bI mean\b/gi,
        /\bto be honest\b/gi,
        /\bfrankly\b/gi,
      ];
      
      fillerPatterns.forEach(pattern => {
        finalContent = finalContent.replace(pattern, '');
      });
      
      finalContent = finalContent
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`✂️ Shortened content`);
    }
    
    // Add small variations to make content feel more natural
    if (addVariation) {
      const variations = [
        { from: /\!/g, to: Math.random() < 0.5 ? '!' : '.' },
        { from: /\?/g, to: Math.random() < 0.7 ? '?' : '.' },
        { from: /lol/gi, to: Math.random() < 0.5 ? 'lol' : '' },
        { from: /haha/gi, to: Math.random() < 0.5 ? 'haha' : '' },
      ];
      
      variations.forEach(({ from, to }) => {
        if (Math.random() < 0.6) { // 60% chance to apply each variation
          finalContent = finalContent.replace(from, to);
        }
      });
      
      finalContent = finalContent
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`🎨 Added content variations`);
    }
    
    // Limit hashtags even if included (sometimes use only 1-2 instead of all)
    if (includeHashtags && hashtagsToUse.length > 2) {
      const hashtagLimit = Math.random() < 0.5 ? 1 : 2; // 50% chance for 1 hashtag, 50% for 2
      hashtagsToUse = hashtagsToUse
        .sort(() => Math.random() - 0.5) // Randomize order
        .slice(0, hashtagLimit);
      
      console.log(`🔢 Limited to ${hashtagLimit} hashtags`);
    }
    
    console.log(`✅ Randomization complete:`);
    console.log(`  - Include hashtags: ${includeHashtags}`);
    console.log(`  - Remove sources: ${removeSourceMentions}`);
    console.log(`  - Shorten content: ${shortenContent}`);
    console.log(`  - Add variations: ${addVariation}`);
    console.log(`  - Final hashtag count: ${hashtagsToUse.length}`);
    
    return {
      finalContent,
      hashtagsToUse
    };
  }

  private updateNextRunTime(): void {
    // Get current time in IST
    const istNow = toIST(new Date());
    const currentTime = istNow.getHours() * 60 + istNow.getMinutes();
    
    // All posting times in minutes from midnight (weekdays only)
    const postingTimes = [
      8 * 60,      // 8:00 AM
      9 * 60 + 30, // 9:30 AM
      10 * 60,     // 10:00 AM
      11 * 60 + 30, // 11:30 AM
      12 * 60,     // 12:00 PM
      13 * 60 + 30, // 1:30 PM
      14 * 60,     // 2:00 PM
      15 * 60,     // 3:00 PM
      16 * 60 + 30, // 4:30 PM
      17 * 60,     // 5:00 PM
      18 * 60 + 30, // 6:30 PM
      19 * 60,     // 7:00 PM
      20 * 60 + 30, // 8:30 PM
      21 * 60,     // 9:00 PM
      22 * 60,     // 10:00 PM
    ];

    let nextRun: Date | null = null;

    // If it's a weekday in IST, find next posting time today
    if (istNow.getDay() >= 1 && istNow.getDay() <= 5) {
      const nextTimeToday = postingTimes.find(time => time > currentTime);
      
      if (nextTimeToday) {
        nextRun = new Date(istNow);
        nextRun.setHours(Math.floor(nextTimeToday / 60), nextTimeToday % 60, 0, 0);
      }
    }

    // If no time today or it's weekend, find next Monday 8 AM IST
    if (!nextRun) {
      nextRun = new Date(istNow);
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(8, 0, 0, 0);
      
      // Find next Monday
      while (nextRun.getDay() !== 1) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    }

    this.state.stats.nextRun = nextRun;
  }

  getStatus(): AutoSchedulerState {
    return { ...this.state };
  }

  getStats() {
    return {
      ...this.state.stats,
      isRunning: this.state.isRunning,
      schedule: '10-15 posts daily on weekdays (8am-10pm IST)',
      note: 'Note: On Vercel, use Vercel Cron Jobs for reliable background scheduling. This in-memory scheduler may hibernate.',
    };
  }
}

// Singleton instance
const autoScheduler = new AutoScheduler();

export { autoScheduler };
export type { AutoSchedulerState };