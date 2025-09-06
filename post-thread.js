const axios = require('axios');

const BASE_URL = 'http://localhost:3002';
const PRINCE_ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';
const THREAD_ID = '8f75a9a0-ce30-4685-a04e-fb044a4b2437';
const FIRST_TWEET_ID = '1964035280418867286';

// Tweet sequence data extracted from API response
const tweets = [
  {
    id: "3q74mlgc9xvcquup1trsj9",
    sequence: 2,
    content: "The patriarch, Rahul Bajaj, built an empire from his grandfather's 1926 startup. Bajaj Auto became 'Hamara Bajaj,' a symbol of Indian middle-class aspiration. The scooter was in every home, but the family was at a crossroads. 2/7 🧵",
    hashtags: ["#IndianBusiness","#BusinessStories","#Entrepreneurship","#Leadership"]
  },
  {
    id: "fhlx3wurkx4297fbvrn1ru", 
    sequence: 3,
    content: "The challenge? Two capable sons with competing visions. Rajiv, the elder, was a cost-cutter & operations maestro. Sanjiv, the younger, was a visionary who saw future in finance. One company, two heirs, one inevitable clash. 3/7 🧵",
    hashtags: ["#IndianBusiness","#BusinessStories","#Entrepreneurship","#Leadership"]
  },
  {
    id: "kik25nzq4yqwkfi96zpnsd",
    sequence: 4, 
    content: "Emotions ran high. Rajiv's 'Bajaj Pulsar' was a roaring success, but Sanjiv's 'Bajaj Finance' idea seemed risky. Traditional manufacturing vs. modern finance. The father had to choose between his children's dreams. 4/7 🧵",
    hashtags: ["#IndianBusiness","#BusinessStories","#Entrepreneurship","#Leadership"]
  },
  {
    id: "1e6h8yyfubywf45euo2m8",
    sequence: 5,
    content: "Rahul's masterstroke? He didn't choose. In 2007, he demerged the company. Rajiv got Bajaj Auto. Sanjiv got Bajaj Finserv. It was a bold bet—splitting the golden goose to build two future giants. A lesson in strategic division. 5/7 🧵",
    hashtags: ["#IndianBusiness","#BusinessStories","#Entrepreneurship","#Leadership"]
  },
  {
    id: "bn6zw9utujjcz131w0iwwi",
    sequence: 6,
    content: "The outcome? Spectacular. Bajaj Auto's mcap grew from $3bn to $25bn+. Bajaj Finserv became a fintech behemoth worth $40bn+. The split created 2x the value, proving that sometimes division is the best multiplication. 6/7 🧵", 
    hashtags: ["#IndianBusiness","#BusinessStories","#Entrepreneurship","#Leadership"]
  },
  {
    id: "cioi8omh9mlulueyxsdm2b",
    sequence: 7,
    content: "Universal lesson: True succession isn't about preserving a throne—it's about building new kingdoms. The greatest legacy a leader can leave is not a unified empire, but empowered successors who create their own. 7/7 🧵",
    hashtags: ["#IndianBusiness","#BusinessStories","#Entrepreneurship","#Leadership"] 
  }
];

async function postReplyTweet(content, replyToId) {
  try {
    console.log(`Posting reply to ${replyToId}: ${content.substring(0, 50)}...`);
    
    const response = await axios.post(`${BASE_URL}/api/tweets`, {
      account_id: PRINCE_ACCOUNT_ID,
      content: content,
      reply_to_tweet_id: replyToId
    });
    
    console.log(`✅ Posted! Twitter ID: ${response.data.twitter_id}`);
    return response.data.twitter_id;
    
  } catch (error) {
    console.error(`❌ Error posting tweet:`, error.response?.data || error.message);
    return null;
  }
}

async function postCompleteThread() {
  console.log('🧵 Starting thread posting...\n');
  
  let previousTweetId = FIRST_TWEET_ID;
  
  for (const tweet of tweets) {
    console.log(`\n📝 Tweet ${tweet.sequence}/7:`);
    
    const fullContent = `${tweet.content}\n\n${tweet.hashtags.join(' ')}`;
    const postedId = await postReplyTweet(fullContent, previousTweetId);
    
    if (postedId) {
      previousTweetId = postedId;
      console.log(`⏱️  Waiting 2 seconds before next tweet...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('❌ Failed to post tweet, stopping thread');
      break;
    }
  }
  
  console.log('\n✅ Thread posting complete!');
}

postCompleteThread().catch(console.error);