import cron from 'node-cron';
import { getScheduledTweets, saveTweet } from './db';
import { postTweet } from './twitter';
import { generateTweet, tweetTopics } from './openai';

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
        const result = await postTweet(tweet.content);
        
        tweet.status = 'posted';
        tweet.postedAt = new Date();
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
    const randomTopic = tweetTopics[Math.floor(Math.random() * tweetTopics.length)];
    const personas = ['unhinged_comedian', 'quiz_expert', 'motivational_whiz'] as const;
    const randomPersona = personas[Math.floor(Math.random() * personas.length)];
    
    console.log(`Generating tweet about ${randomTopic} with ${randomPersona} persona`);
    
    const generatedTweet = await generateTweet({
      topic: randomTopic,
      persona: randomPersona,
      includeHashtags: true,
    });

    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + 2);

    const tweet = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      content: generatedTweet.content,
      hashtags: generatedTweet.hashtags,
      topic: randomTopic,
      persona: randomPersona,
      scheduledFor,
      status: 'scheduled' as const,
      createdAt: new Date(),
    };

    await saveTweet(tweet);
    console.log(`Scheduled new tweet for ${scheduledFor.toLocaleString()}`);
    
    return tweet;
  } catch (error) {
    console.error('Error generating and scheduling tweet:', error);
  }
}

export { generateAndScheduleTweet };