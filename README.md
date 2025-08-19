# Multi-Persona AI Bot

An intelligent AI system with multiple personalities that generates unique tweets and automatically schedules them to post on X (Twitter). Choose from different AI personas: Unhinged Comedian 🎭, Quiz Expert 🧠, or Motivational Whiz ⚡

## Features

- 🤖 **Multiple AI Personas**: Choose from 3 distinct personalities with unique styles
  - 🎭 **Unhinged Comedian**: Brutally honest, darkly funny takes with no filter
  - 🧠 **Quiz Expert**: Engaging trivia questions and fascinating facts
  - ⚡ **Motivational Whiz**: Uplifting inspiration and positive energy
- ⏰ **Flexible Scheduling**: Set custom intervals (1-24 hours) for automatic posting
- ✍️ **Custom Prompts**: Override any persona with your own creative prompts
- #️⃣ **Smart Hashtags**: Automatically includes relevant hashtags for better reach
- 🎨 **Modern UI**: Built with Next.js 15, Tailwind CSS, and shadcn/ui
- 📊 **Management Dashboard**: Monitor, edit, and control all your AI-generated content
- 🎯 **Versatile Topics**: 15+ topics from daily life to science and technology

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd tweeter
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.local` and update with your API keys:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
   ```

3. **Get Twitter API credentials:**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/)
   - Create a new app and generate API keys
   - Make sure your app has write permissions

4. **Get OpenAI API key:**
   - Go to [OpenAI API](https://platform.openai.com/)
   - Create an API key in your dashboard

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3000`

3. **Generate comedy gold:**
   - Select a comedy topic (default: unhinged comedian tone)
   - Or write a custom prompt to override everything
   - Click "Generate Tweet" 
   - Watch the AI roast life's absurdities
   - Post immediately or schedule for maximum chaos

4. **Start automatic scheduling:**
   - Click "Start Scheduler" in the dashboard
   - Tweets will be generated and posted every 2 hours
   - Monitor progress in the dashboard

## Comedy Topics

- Daily Life Struggles
- Traffic and Commuting Nightmares
- Politics and Politicians
- Marriage and Relationships
- Dating in Your 30s/40s
- Career Burnout and Office Politics
- Social Media Addiction
- Parenting Chaos
- Adulting Failures
- Modern Technology Problems
- Gym and Fitness Lies
- Shopping and Consumerism
- Food Delivery Obsession
- Work From Home Reality
- Getting Older

## Available Tones

- **Unhinged Comedian** (Default): Brutally honest, darkly funny, no-filter comedy
- **Professional**: Formal, business-oriented content
- **Casual**: Relaxed, conversational style
- **Funny**: Light-hearted, humorous approach
- **Inspirational**: Motivational and uplifting
- **Custom Prompt**: Write your own prompt to override everything

## Architecture

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui for consistent design
- **AI**: OpenAI GPT-3.5-turbo for content generation
- **Social Media**: Twitter API v2 for posting
- **Scheduling**: node-cron for automated tasks
- **Storage**: JSON file-based storage (can be upgraded to database)

## API Endpoints

- `GET /api/tweets` - Fetch all tweets
- `POST /api/tweets` - Generate or schedule new tweet
- `PUT /api/tweets/[id]` - Update or post a specific tweet
- `DELETE /api/tweets/[id]` - Delete a tweet
- `POST /api/scheduler` - Control the scheduler (start/stop/generate)

## Security Notes

- Keep your API keys secure and never commit them to version control
- The Twitter API has rate limits - monitor your usage
- OpenAI API usage will incur costs based on tokens used
- Consider implementing user authentication for production use

## Deployment

For production deployment:
1. Deploy to Vercel, Netlify, or your preferred platform
2. Set environment variables in your deployment platform
3. Consider upgrading to a proper database (PostgreSQL, MongoDB)
4. Implement proper error handling and monitoring
5. Add user authentication and authorization

## License

MIT License - feel free to use and modify as needed.
