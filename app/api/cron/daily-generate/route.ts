import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { getAllTweets, saveTweet, generateTweetId } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { logIST, toIST } from '@/lib/timezone';

// Optimal posting times in IST (24-hour format) - FREE PLAN COMPATIBLE
const OPTIMAL_POSTING_TIMES = [
  { hour: 8, minute: 0 },   // 8:00 AM IST - Morning coffee
  { hour: 10, minute: 0 },  // 10:00 AM IST - Mid-morning  
  { hour: 12, minute: 0 },  // 12:00 PM IST - Lunch break
  { hour: 15, minute: 0 },  // 3:00 PM IST - Afternoon break
  { hour: 17, minute: 0 },  // 5:00 PM IST - End of workday
  { hour: 19, minute: 0 },  // 7:00 PM IST - Evening engagement
  { hour: 21, minute: 0 },  // 9:00 PM IST - Prime time
];

export async function GET(request: NextRequest) {
  try {
    // Verify authorization  
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logIST('🚀 Starting daily tweet generation for FREE PLAN...');
    
    const now = toIST(new Date());
    
    // Check existing scheduled tweets
    const allTweets = await getAllTweets();
    const scheduledTweets = allTweets.filter(t => t.status === 'scheduled');
    const draftTweets = allTweets.filter(t => t.status === 'draft');
    
    logIST(`📊 Current status: ${scheduledTweets.length} scheduled, ${draftTweets.length} drafts`);
    
    // Generate 7 tweets for the next day (one for each optimal time slot)
    const tweetsToGenerate = 7;
    const generatedTweets = [];
    
    logIST(`🎯 Generating ${tweetsToGenerate} tweets for tomorrow's posting...`);

    for (let i = 0; i < tweetsToGenerate; i++) {
      try {
        // Rotate through all personas for variety
        const personas = ['unhinged_satirist', 'vibe_coder', 'product_sage'] as const;
        const persona = personas[i % personas.length];
        
        const options: TweetGenerationOptions = {
          persona,
          includeHashtags: Math.random() > 0.3, // 70% chance of hashtags
          useTrendingTopics: Math.random() > 0.4, // 60% chance of trending topics
        };

        logIST(`🎭 Generating tweet ${i + 1}/${tweetsToGenerate} with ${persona} persona...`);

        const generatedTweet = await generateTweet(options, i);
        const qualityScore = calculateQualityScore(generatedTweet.content, generatedTweet.hashtags, persona);

        // Schedule for optimal time slot TOMORROW
        const tomorrow = toIST(new Date());
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const timeSlot = OPTIMAL_POSTING_TIMES[i];
        const scheduledIST = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 
                                     timeSlot.hour, timeSlot.minute, 0, 0);
        
        // Convert IST to UTC for storage
        const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
        const scheduledFor = new Date(utcTime);

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
        generatedTweets.push(tweet);

        logIST(`✅ Tweet ${i + 1} generated and scheduled for ${scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
        logIST(`📝 Content preview: ${tweet.content.substring(0, 80)}...`);

        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        logIST(`❌ Failed to generate tweet ${i + 1}:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} IST`,
      generated: generatedTweets.length,
      totalScheduled: scheduledTweets.length + generatedTweets.length,
      personas: {
        satirist: generatedTweets.filter(t => t.persona === 'unhinged_satirist').length,
        coder: generatedTweets.filter(t => t.persona === 'vibe_coder').length,
        product: generatedTweets.filter(t => t.persona === 'product_sage').length
      },
      nextPostingTimes: OPTIMAL_POSTING_TIMES.map(t => `${t.hour}:${t.minute.toString().padStart(2, '0')}`),
      message: `✅ FREE PLAN: Generated ${generatedTweets.length} tweets for tomorrow. Use dashboard to post manually at optimal times.`,
      note: "🆓 Free Plan Mode: Daily generation only. Manual posting required via dashboard."
    };

    logIST(`🎉 Daily generation completed! Generated ${generatedTweets.length} tweets for tomorrow`);
    logIST(`📱 Next step: Visit dashboard to manually post tweets at optimal times`);

    return NextResponse.json(summary);

  } catch (error) {
    logIST('❌ Daily tweet generation failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Daily tweet generation failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}