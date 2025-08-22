import { NextRequest, NextResponse } from 'next/server';
import { generateTweet, TweetGenerationOptions } from '@/lib/openai';
import { saveTweet, generateTweetId } from '@/lib/db';
import { calculateQualityScore } from '@/lib/quality-scorer';
import { logIST, toIST } from '@/lib/timezone';

// Optimal posting times in IST (24-hour format)
const OPTIMAL_POSTING_TIMES = [
  { hour: 8, minute: 0 },   // 8:00 AM IST
  { hour: 9, minute: 30 },  // 9:30 AM IST
  { hour: 10, minute: 0 },  // 10:00 AM IST
  { hour: 11, minute: 30 }, // 11:30 AM IST
  { hour: 12, minute: 0 },  // 12:00 PM IST
  { hour: 13, minute: 30 }, // 1:30 PM IST
  { hour: 14, minute: 0 },  // 2:00 PM IST
  { hour: 15, minute: 0 },  // 3:00 PM IST
  { hour: 16, minute: 30 }, // 4:30 PM IST
  { hour: 17, minute: 0 },  // 5:00 PM IST
  { hour: 18, minute: 30 }, // 6:30 PM IST
  { hour: 19, minute: 0 },  // 7:00 PM IST
  { hour: 20, minute: 30 }, // 8:30 PM IST
  { hour: 21, minute: 0 },  // 9:00 PM IST
  { hour: 22, minute: 0 },  // 10:00 PM IST
];


export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logIST('🚀 Starting daily tweet generation and scheduling...');

    // const today = toIST(new Date()); // Reserved for future use
    const tweetsToGenerate = Math.floor(Math.random() * 6) + 10; // 10-15 tweets
    const selectedTimes = OPTIMAL_POSTING_TIMES.slice(0, tweetsToGenerate);

    logIST(`📅 Generating ${tweetsToGenerate} tweets for today`);

    const generatedTweets = [];

    for (let i = 0; i < tweetsToGenerate; i++) {
      try {
        // Use the unhinged satirist persona
        const personas = ['unhinged_satirist', 'desi_philosopher'] as const;
        const randomPersona = personas[Math.floor(Math.random() * personas.length)];
        
        const options: TweetGenerationOptions = {
          persona: randomPersona,
          includeHashtags: Math.random() > 0.3, // 70% chance of hashtags
          useTrendingTopics: Math.random() > 0.4, // 60% chance of using trending topics
        };

        logIST(`🎭 Generating tweet ${i + 1}/${tweetsToGenerate} with ${randomPersona} persona...`);

        const generatedTweet = await generateTweet(options, i);
        const qualityScore = calculateQualityScore(
          generatedTweet.content,
          generatedTweet.hashtags,
          randomPersona
        );

        // Calculate scheduled time for this tweet in IST
        const timeSlot = selectedTimes[i];
        
        // Create IST time for today
        const istToday = toIST(new Date());
        const scheduledIST = new Date(istToday.getFullYear(), istToday.getMonth(), istToday.getDate(), 
                                     timeSlot.hour, timeSlot.minute, 0, 0);
        
        // Convert IST to UTC for storage (subtract 5:30 hours)
        const utcTime = scheduledIST.getTime() - (5.5 * 60 * 60 * 1000);
        const scheduledFor = new Date(utcTime);

        // If the time has already passed today, schedule for tomorrow
        const now = toIST(new Date());
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
        const scheduledTimeMinutes = timeSlot.hour * 60 + timeSlot.minute;
        
        if (scheduledTimeMinutes <= currentTimeMinutes) {
          // Add 24 hours to schedule for tomorrow
          scheduledFor.setTime(scheduledFor.getTime() + 24 * 60 * 60 * 1000);
        }

        const tweet = {
          id: generateTweetId(),
          content: generatedTweet.content,
          hashtags: generatedTweet.hashtags,
          persona: randomPersona,
          scheduledFor,
          status: 'scheduled' as const,
          createdAt: new Date(),
          qualityScore,
        };

        await saveTweet(tweet);
        generatedTweets.push(tweet);

        logIST(`✅ Tweet ${i + 1} scheduled for ${scheduledFor.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);

        // Small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logIST(`⚠️ Failed to generate tweet ${i + 1}:`, error instanceof Error ? error.message : String(error));
        continue; // Continue with next tweet
      }
    }

    logIST(`🎉 Daily tweet generation completed! Generated ${generatedTweets.length}/${tweetsToGenerate} tweets`);

    return NextResponse.json({
      success: true,
      message: `Generated and scheduled ${generatedTweets.length} tweets for optimal posting times`,
      tweetsGenerated: generatedTweets.length,
      scheduledTimes: selectedTimes.map(t => `${t.hour}:${t.minute.toString().padStart(2, '0')}`),
      tweets: generatedTweets.map(t => ({
        id: t.id,
        content: t.content.substring(0, 50) + '...',
        persona: t.persona,
        scheduledFor: t.scheduledFor,
        qualityGrade: t.qualityScore?.grade
      }))
    });

  } catch (error) {
    logIST('❌ Daily tweet generation failed:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate daily tweets',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}