# Tweeter App - AI-Powered Tweet Generation & Scheduling Bot ✨

**🚀 PRODUCTION-READY** - A fully functional Next.js application that generates and schedules tweets using AI with multi-persona support.

> **✅ LIVE STATUS**: This app is actively posting to Twitter/X with confirmed working API integration and successful tweet posting (Tweet IDs: 1957846241267667429, 1957847752706085296).

> **📝 Self-Updating Documentation**: This file should be updated whenever significant changes are made to the codebase. When adding new features, API routes, components, or configuration changes, please update the relevant sections below to keep this documentation current and useful for future development.

## Project Overview

This is an AI-powered tweet generation and scheduling bot built with Next.js 15, TypeScript, and Tailwind CSS. The app features three distinct AI personas that can generate tweets on various topics and automatically schedule them for posting to Twitter.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI API (configurable to use DeepSeek)
- **Social Media**: Twitter API v2 with OAuth 1.0a
- **Scheduling**: Node-cron for automated posting
- **Data Storage**: JSON file-based storage (`data/tweets.json`)

## Key Features

### 🎭 Multi-Persona AI System
- **Unhinged Satirist** (🃏) - Sharp Indian satirist with sophisticated uniqueness framework
  - 4 satirical devices: Exaggeration, Irony, Parody, Absurd Metaphors
  - 3 style variations: Dark Humor, Playful Meme, Absurd Exaggeration  
  - Anti-repetition protocol with freshness enforcement
  - Current Indian events and cultural references required

- **Vibe Coder** (💻) - Chill Indian developer sharing relatable coding life humor
  - Relatable tech culture references and developer experiences  
  - Mix of coding terminology with Indian cultural context
  - Focus on debugging, Stack Overflow, coding at odd hours
  - Tone: Relatable and witty, not cynical or bitter

- **Product Sage** (🎯) - Seasoned product leader with 9 years of experience revealing insights
  - Deep expertise in consumer internet and hardware product decisions
  - Reveals the "why" behind product features we use daily
  - Mix of product wisdom with Indian market context and user behavior
  - Focus on design psychology, user experience, and business strategy
  - Tone: Insightful and engaging, sharing knowledge that entrepreneurs bookmark

### 🚀 Tweet Generation
- Single tweet generation with custom prompts
- Bulk generation (5-20 tweets at once)
- **Unified Optimal Timing**: Both manual and auto-scheduling use identical IST optimal times
- Smart scheduling with 45-minute minimum spacing for bulk operations
- Full content preview before posting
- Hashtag inclusion options

### ⚡ Automation Features
- **Production**: External cron service (cron-job.org) triggers auto-chain API every 15 minutes
- **Development**: Self-triggering auto-chain system using setTimeout with HTTP requests
- Batch operations for multiple tweet selection
- Real-time dashboard tracking (drafts, scheduled, posted)
- Tweet status management (draft/scheduled/posted/failed)
- **Enhanced Error Handling** - Detailed error messages with actionable solutions
- **Retry Mechanisms** - Automatic retry with exponential backoff for server errors
- **Twitter URL Tracking** - Store and display direct links to posted tweets
- **Smart Prompt Handling** - Custom prompts override topic only, preserving persona voice/style
- **Optimal Posting Times** - Intelligent scheduling at maximum engagement times (9am, 12pm, 5pm, 7pm, 9pm)
- **Smart Scheduling Logic** - Replaces simple intervals with research-based optimal times
- **Unified Timing System** - Both auto-chain and manual scheduling use identical optimal IST times (8AM-10PM)
- **Intelligent Spacing** - 45-minute minimum intervals prevent spam and maximize engagement

## Project Structure

```
tweeter/
├── app/
│   ├── api/
│   │   ├── scheduler/route.ts     # Auto-posting scheduler endpoint
│   │   ├── tweets/
│   │   │   ├── route.ts           # CRUD operations for tweets
│   │   │   └── [id]/route.ts      # Individual tweet operations
│   │   └── test-twitter/route.ts  # Twitter API testing
│   ├── layout.tsx                 # Root layout with providers
│   └── page.tsx                   # Main dashboard page
├── components/
│   ├── ui/                        # shadcn/ui components
│   └── TweetDashboard.tsx         # Main dashboard component
├── data/
│   └── tweets.json                # Tweet data storage
└── .env.local                     # Environment variables
```

## API Routes

- `GET/POST /api/tweets` - Fetch all tweets / Generate new tweets
- `PATCH/DELETE /api/tweets/[id]` - Update/delete specific tweets  
- `POST /api/scheduler` - Control auto-posting scheduler
- `GET/POST /api/test-twitter` - **Production-ready** Twitter API diagnostics and test posting

### **API Testing Endpoints (Production-Ready)**

**GET /api/test-twitter** - Comprehensive Twitter API diagnostics:
```json
{
  "status": "Twitter API Diagnostics",
  "timestamp": "2025-08-19T16:36:18.602Z",
  "connection": { "valid": true, "error": null },
  "environment": "development",
  "message": "✅ Twitter API connection successful! Ready for production."
}
```

**POST /api/test-twitter** - Test tweet posting:
```bash
curl -X POST /api/test-twitter -H "Content-Type: application/json" \
  -d '{"action": "test-post", "content": "Test tweet content"}'
```

> **🔧 Development Note**: When adding new API routes, update this section and ensure the route descriptions match the actual implementation. Consider adding request/response examples for complex endpoints.

## Environment Variables

```env
# AI API (Choose one)
OPENAI_API_KEY=your_openai_key_here

# Twitter API v2 (Required)
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_secret
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret

# Security (Production)
CRON_SECRET=your_random_secret_key_here  # Generate random string for API security
```

## Content Generation

### Persona-Based Generation
- **No Topic Selection**: Topics dropdown removed for cleaner interface
- **Pure Persona Voice**: Each persona generates content in their unique style
- **Enhanced Uniqueness**: Multiple prompt variations per persona prevent repetitive content
- **High Temperature**: AI temperature set to 1.0 for maximum creativity and variation
- **Custom Prompts**: Optional custom prompts for specific content needs

## Development Commands

```bash
npm run dev        # Start development server (with Turbopack)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

> **💡 Documentation Tip**: When adding new npm scripts, update this section and consider if the new commands affect testing or deployment procedures described below.

## Key Components

### TweetDashboard.tsx
Main component containing:
- Tweet generation forms (single & bulk)
- Tweet management table with status tracking
- Scheduler controls (start/stop auto-posting)
- Statistics dashboard (total, drafts, scheduled, posted)
- Batch selection and scheduling operations

### Data Model
```typescript
interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  persona: string;
  scheduledFor?: Date;
  postedAt?: Date;
  twitterId?: string; // Twitter/X tweet ID
  twitterUrl?: string; // Direct link to tweet
  errorMessage?: string; // Error message for failed tweets
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  createdAt: Date;
}
```

## Testing with Playwright MCP

This project is configured with Playwright MCP (Model Context Protocol) for direct browser testing. The configuration is in `.mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### ✅ **Confirmed Working Functionality** (Last Tested: 2025-08-19)

**Live Tweet Posting Verified:**
- **Posted Tweet 1**: ID 1957846241267667429 - Successfully generated and posted
- **Posted Tweet 2**: ID 1957847752706085296 - Successfully scheduled and auto-posted
- **Twitter URLs**: All posted tweets accessible via `https://x.com/user/status/{tweet_id}`

### How to Use Playwright MCP
1. Ensure the app is running: `npm run dev`
2. Use Claude Code with Playwright MCP to interact with the browser
3. Navigate to `http://localhost:3000` 
4. Test tweet generation, scheduling, and dashboard functionality
5. **CONFIRMED WORKING**: Twitter API integration and auto-posting features

### ✅ **Tested & Working Scenarios**
- ✅ Generate single tweets with different personas (Unhinged Comedian tested)
- ✅ Real Twitter/X posting (confirmed with live tweets)
- ✅ Scheduling functionality (2-minute scheduling tested)
- ✅ Auto-posting scheduler start/stop (cron-based system working)
- ✅ Tweet status transitions (draft → scheduled → posted)
- ✅ Error handling with detailed user guidance
- ✅ Twitter API diagnostics and connection testing
- ✅ Bulk generation capabilities
- ✅ Dashboard statistics and real-time updates

## Security Notes

- Twitter API credentials are required for posting functionality
- The app uses OAuth 1.0a for Twitter authentication
- Environment variables contain sensitive API keys
- Auto-posting runs server-side with node-cron

## Deployment

The app is configured for Vercel deployment with external cron service for production automation.

### **Production Auto-Posting System**

Since Vercel's free tier allows only 1 cron job and setTimeout doesn't persist in serverless functions, the production system uses an external cron service:

#### **External Cron Service Setup (Recommended: cron-job.org)**

1. **Create free account** at https://cron-job.org
2. **Add new cron job**:
   - **URL**: `https://your-vercel-app.vercel.app/api/auto-chain`
   - **Schedule**: `*/15 * * * *` (Every 15 minutes, 24/7)
   - **Method**: GET
   - **Headers**: `Authorization: Bearer ${CRON_SECRET}`

3. **Set environment variables** in Vercel:
   ```env
   CRON_SECRET=your_random_secret_here  # Any secure random string
   ```

#### **Auto-Chain System Details:**
- **Trigger Frequency**: Every 15 minutes via external cron
- **Daily Posts**: 15 posts at optimal IST times (8AM-10PM)
- **Smart Logic**: Posts ready tweets immediately, generates new ones when needed
- **Optimal Timing**: Uses 15 IST time slots for maximum engagement
- **Persona Variety**: Rotates through 3 personas - Satirist, Vibe Coder, and Product Sage
- **Self-Triggering**: Works in development, requires external trigger in production

#### **How It Works:**
1. **Phase 1**: Check for tweets ready to post (within 15-minute window)
2. **Phase 2**: Generate 3-8 new tweets if pipeline has < 8 tweets
3. **Phase 3**: Schedule tweets for next optimal IST posting times
4. **Intelligent Scheduling**: Uses proper UTC conversion for IST optimal times

#### **Alternative Services:**
- **UptimeRobot** (Free): Monitor endpoint every 5 minutes
- **GitHub Actions** (Free): YAML workflow with cron schedule  
- **Zapier** (Free tier): Schedule webhook calls

## 🔄 Documentation Update Guidelines

When making changes to this project, please update this CLAUDE.md file accordingly:

### What to Update
- **New Features**: Add descriptions to the Key Features section
- **API Changes**: Update the API Routes section with new endpoints
- **New Components**: Add to Project Structure and Key Components sections
- **Environment Variables**: Update the Environment Variables section
- **Dependencies**: Update the Tech Stack section for new libraries
- **Configuration**: Update testing or deployment sections for new configs
- **Bug Fixes**: Update relevant sections if functionality changes

### How to Update
1. **Real-time Updates**: Update this file as part of your development workflow
2. **Feature Branches**: Include documentation updates in the same commit as code changes
3. **Pull Requests**: Review documentation changes alongside code changes
4. **Version Notes**: Consider adding a changelog section for major updates

### Auto-Update Reminders
```bash
# Before committing new features, check if CLAUDE.md needs updates:
git add . && echo "📝 Remember to update CLAUDE.md if needed!" && git commit
```

### AI-Assisted Updates
This file is designed to work with Claude Code and can be automatically updated using:
- File analysis tools to detect new components/routes
- Package.json scanning for dependency changes
- Git diff analysis to identify documentation gaps

---

## 🎯 **Production Status Summary**

### **✅ FULLY FUNCTIONAL** (as of 2025-08-19)
- **Twitter API Integration**: ✅ Working (confirmed with live posts)
- **AI Tweet Generation**: ✅ Working (OpenAI integration)  
- **Scheduling System**: ✅ Working (optimal timing implemented)
- **Multi-Persona Support**: ✅ Working (3 personas available)
- **Error Handling**: ✅ Robust (user-friendly guidance)
- **Production Deployment**: ✅ Ready (Vercel configured)
- **API Diagnostics**: ✅ Working (comprehensive testing endpoints)
- **Smart Scheduling**: ✅ Working (engagement-optimized posting times)

### **Live Tweet Evidence**
- Tweet ID: 1957846241267667429
- Tweet ID: 1957847752706085296
- Both tweets successfully posted to Twitter/X and accessible via web

---

*Last Updated: PRODUCTION-READY STATUS CONFIRMED - App successfully posting to Twitter/X with full scheduling functionality, enhanced error handling, retry mechanisms, and comprehensive testing via Playwright MCP - This documentation is designed to be self-maintaining and should be updated with each significant code change.*