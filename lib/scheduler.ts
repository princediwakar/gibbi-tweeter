import cron from 'node-cron';
import { getScheduledTweets, saveTweet } from './neon-db';
import { postTweet } from './twitter';
import { generateTweet } from './openai';

let schedulerRunning = false;

export function startScheduler() {
  if (schedulerRunning) {
    console.log('Scheduler already running');
    return;
  }

  console.log('Starting tweet scheduler...');
  schedulerRunning = true;

  // Run every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('Running scheduled tweet check...');
    await processScheduledTweets();
  });

  // Also generate and schedule new tweets every 2 hours
  cron.schedule('30 */2 * * *', async () => {
    console.log('Generating new scheduled tweet...');
    await generateAndScheduleTweet();
  });
}

export function stopScheduler() {
  schedulerRunning = false;
  console.log('Scheduler stopped');
}

async function processScheduledTweets() {
  try {
    const scheduledTweets = await getScheduledTweets();
    console.log(`Found ${scheduledTweets.length} tweets ready to post`);

    for (const tweet of scheduledTweets) {
      try {
        console.log(`Posting tweet: ${tweet.content.substring(0, 50)}...`);
        await postTweet(tweet.content);
        
        tweet.status = 'posted';
        tweet.posted_at = new Date().toISOString();
        await saveTweet(tweet);
        
        console.log(`Successfully posted tweet ${tweet.id}`);
      } catch (error) {
        console.error(`Failed to post tweet ${tweet.id}:`, error);
        tweet.status = 'failed';
        await saveTweet(tweet);
      }
    }
  } catch (error) {
    console.error('Error processing scheduled tweets:', error);
  }
}

async function generateAndScheduleTweet() {
  try {
    // Use test prep personas from openai.ts
    const personas = [
      { id: "sat_coach", name: "SAT Coach" },
      { id: "gre_master", name: "GRE Master" },
      { id: "gmat_pro", name: "GMAT Pro" },
      { id: "test_prep_guru", name: "Test Prep Guru" },
    ];
    
    const randomPersona = personas[Math.floor(Math.random() * personas.length)];
    
    console.log(`Generating tweet with ${randomPersona.id} persona`);
    
    const generatedTweet = await generateTweet({
      persona: randomPersona.id,
      includeHashtags: true,
    });

    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + 2);

    const tweet = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      content: generatedTweet.content,
      hashtags: generatedTweet.hashtags,
      persona: randomPersona.id,
      scheduled_for: scheduledFor.toISOString(),
      status: 'scheduled' as const,
      created_at: new Date().toISOString(),
    };

    await saveTweet(tweet);
    console.log(`Scheduled new tweet for ${scheduledFor.toLocaleString()}`);
    
    return tweet;
  } catch (error) {
    console.error('Error generating and scheduling tweet:', error);
  }
}

export { generateAndScheduleTweet };