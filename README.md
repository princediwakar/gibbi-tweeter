# 🤖 AI Tweet Bot

A powerful AI-powered tweet generation and scheduling bot with multi-persona support.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)

## ✨ Features

### 🎭 Multi-Persona AI
- **Unhinged Comedian** - Brutally honest, darkly funny takes
- **Quiz Expert** - Engaging trivia questions and facts
- **Motivational Whiz** - Uplifting inspiration and positivity

### 🚀 Tweet Generation
- **Single Tweets** - Generate individual tweets with custom prompts
- **Bulk Generation** - Create 5-20 tweets at once on any topic
- **Smart Scheduling** - Auto-schedule tweets at 1-24 hour intervals
- **Full Content Preview** - See complete tweet content before posting

### ⚡ Automation
- **Auto-Posting Scheduler** - Automatically post scheduled tweets
- **Batch Operations** - Select and schedule multiple tweets at once
- **Real-time Dashboard** - Track drafts, scheduled, and posted tweets

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** OpenAI/DeepSeek API
- **Social:** Twitter API v2 (OAuth 1.0a)
- **Scheduling:** Node-cron
- **Data:** JSON file storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Twitter Developer Account
- OpenAI/DeepSeek API Key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ai-tweet-bot.git
cd ai-tweet-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create `.env.local` with your API keys:
```env
# AI API (Choose one)
OPENAI_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here

# Twitter API v2 (Required)
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_secret
```

4. **Run the application**
```bash
npm run dev
```

Visit `http://localhost:3000` to start generating tweets!

## 📱 Usage

### Single Tweet Generation
1. Select persona (Comedian/Quiz Expert/Motivational)
2. Choose topic or write custom prompt
3. Click "Generate & Schedule" or "Draft"

### Bulk Tweet Generation
1. Write prompt like "Generate 10 tweets about coffee"
2. Select count (5-20 tweets)
3. Choose persona and scheduling interval
4. Review generated tweets and select which to schedule

### Auto-Posting
1. Click "Start Auto-Post" to enable scheduler
2. Scheduled tweets will be posted automatically
3. Monitor progress in the dashboard

## 🔧 Configuration

### Twitter App Permissions
Your Twitter app needs **Read and Write** permissions to post tweets. Update in Twitter Developer Console.

### AI Models
- **DeepSeek** (Recommended) - Cost-effective, high quality
- **OpenAI GPT** - Premium option, excellent results

## 📈 Dashboard

The dashboard shows:
- **Total Tweets** - All tweets in system
- **Drafts** - Unscheduled tweets ready to edit
- **Scheduled** - Tweets queued for posting
- **Posted** - Successfully published tweets

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
```bash
npx vercel
```

2. **Add Environment Variables**
Go to Vercel Dashboard → Project → Settings → Environment Variables
Add all variables from `.env.local`

3. **Deploy**
```bash
npx vercel --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This bot posts to Twitter automatically. Use responsibly and ensure compliance with Twitter's Terms of Service.

---

**Built with ❤️ using Next.js and AI**

🤖 *Generated with [Claude Code](https://claude.ai/code)*