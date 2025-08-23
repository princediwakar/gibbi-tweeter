import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { logIST, toIST } from '@/lib/timezone';
import { OPTIMAL_POSTING_TIMES } from '@/lib/timing';

// In-memory job tracking (in production, use Redis or database)
const activeJobs = new Map<string, { status: 'running' | 'completed' | 'failed', generated: number, total: number, errors: string[] }>();

export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = toIST(new Date());
    logIST(`🎯 Async generation check...`);

    // Get current tweet pipeline
    const allTweets = await getAllTweets();
    const pendingTweets = allTweets.filter(t => t.status === 'scheduled' || t.status === 'draft');
    
    logIST(`📊 Current pipeline: ${pendingTweets.length} pending tweets`);

    // Only generate if pipeline is low
    if (pendingTweets.length >= 4) {
      return NextResponse.json({
        success: true,
        message: `✅ Pipeline is healthy with ${pendingTweets.length} tweets. No generation needed.`,
        currentPipeline: pendingTweets.length,
        generated: 0,
        timestamp: now.toISOString()
      });
    }

    // Create job ID
    const jobId = `gen_${Date.now()}`;
    const tweetsToGenerate = Math.min(3, 6 - pendingTweets.length);
    
    // Start job tracking
    activeJobs.set(jobId, { status: 'running', generated: 0, total: tweetsToGenerate, errors: [] });
    
    logIST(`🚀 Starting async generation job ${jobId} for ${tweetsToGenerate} tweets`);
    
    // Return immediately - generation happens in background
    const response = NextResponse.json({
      success: true,
      message: `🚀 Generation started for ${tweetsToGenerate} tweets`,
      jobId,
      tweetsToGenerate,
      currentPipeline: pendingTweets.length,
      timestamp: now.toISOString()
    });

    // Start background generation (don't await)
    backgroundGeneration(jobId, tweetsToGenerate, now).catch(error => {
      logIST(`❌ Background generation job ${jobId} failed:`, error);
      const job = activeJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.errors.push(error instanceof Error ? error.message : String(error));
      }
    });

    return response;

  } catch (error) {
    logIST('❌ Async generation check failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to start generation',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Background generation function
async function backgroundGeneration(jobId: string, tweetsToGenerate: number, now: Date) {
  const job = activeJobs.get(jobId);
  if (!job) return;

  logIST(`🤖 Background job ${jobId}: Generating ${tweetsToGenerate} tweets...`);

  for (let i = 0; i < tweetsToGenerate; i++) {
    try {
      // Rotate through all personas
      const personas = ['unhinged_satirist', 'vibe_coder', 'product_sage'] as const;
      const persona = personas[i % personas.length];
      
      const options: TweetGenerationOptions = {
        persona,
        includeHashtags: Math.random() > 0.3,
        useTrendingTopics: Math.random() > 0.4,
      };

      logIST(`📝 Job ${jobId}: Generating tweet ${i + 1}/${tweetsToGenerate} with ${persona}...`);

      const generatedTweet = await generateTweet(options, i);
      const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);

      // Find next available optimal time slot
      const currentTime = now.getHours() * 60 + now.getMinutes();
      let scheduledFor: Date;
      
      const nextSlots = OPTIMAL_POSTING_TIMES.filter(slot => {
        const slotTime = slot.hour * 60 + slot.minute;
        return slotTime > currentTime; // Future slots today
      });

      if (nextSlots.length > i) {
        // Use slot today
        const timeSlot = nextSlots[i];
        const scheduledIST = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                     timeSlot.hour, timeSlot.minute, 0, 0);
        const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
        scheduledFor = new Date(utcTime);
      } else {
        // Schedule for tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const timeSlot = OPTIMAL_POSTING_TIMES[i % OPTIMAL_POSTING_TIMES.length];
        const scheduledIST = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(),
                                     timeSlot.hour, timeSlot.minute, 0, 0);
        const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
        scheduledFor = new Date(utcTime);
      }

      const tweet = {
        id: generateTweetId(),
        content: generatedTweet.content,
        hashtags: generatedTweet.hashtags,
        persona,
        scheduledFor,
        status: 'scheduled' as const,
        createdAt: new Date(),
        qualityScore,
      };

      await saveTweet(tweet);
      job.generated++;

      logIST(`✅ Job ${jobId}: Generated tweet ${i + 1} - ${tweet.content.substring(0, 50)}... (scheduled for ${scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logIST(`❌ Job ${jobId}: Failed to generate tweet ${i + 1}: ${errorMsg}`);
      job.errors.push(`Tweet ${i + 1}: ${errorMsg}`);
    }
  }

  job.status = 'completed';
  logIST(`🎉 Job ${jobId} completed: ${job.generated}/${tweetsToGenerate} tweets generated, ${job.errors.length} errors`);
  
  // Clean up job after 1 hour
  setTimeout(() => {
    activeJobs.delete(jobId);
    logIST(`🧹 Cleaned up job ${jobId}`);
  }, 60 * 60 * 1000);
}

// GET with jobId to check status
export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();
    const job = activeJobs.get(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      jobId,
      status: job.status,
      progress: `${job.generated}/${job.total}`,
      generated: job.generated,
      total: job.total,
      errors: job.errors,
      isComplete: job.status === 'completed' || job.status === 'failed'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check job status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}