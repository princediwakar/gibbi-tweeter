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

- **Desi Philosopher** (🧘‍♂️) - Ancient wisdom meets modern chaos with philosophical insights
  - Blends Vedantic wisdom with contemporary Indian reality
  - References: Bhagavad Gita, Buddha, Upanishads, Sufi mysticism
  - Modern applications: Tech addiction, career stress, relationships
  - Tone: Wise but accessible, gentle humor with profound insights

### 🚀 Tweet Generation
- Single tweet generation with custom prompts
- Bulk generation (5-20 tweets at once)
- Smart scheduling at 1-24 hour intervals
- Full content preview before posting
- Hashtag inclusion options

### ⚡ Automation Features
- **Production**: Vercel Cron Jobs handle all automated generation and posting (reliable & scalable)
- **Development**: In-memory scheduler using node-cron with IST timezone support
- Batch operations for multiple tweet selection
- Real-time dashboard tracking (drafts, scheduled, posted)
- Tweet status management (draft/scheduled/posted/failed)
- **Enhanced Error Handling** - Detailed error messages with actionable solutions
- **Retry Mechanisms** - Automatic retry with exponential backoff for server errors
- **Twitter URL Tracking** - Store and display direct links to posted tweets
- **Smart Prompt Handling** - Custom prompts override topic only, preserving persona voice/style
- **Optimal Posting Times** - Intelligent scheduling at maximum engagement times (9am, 12pm, 5pm, 7pm, 9pm)
- **Smart Scheduling Logic** - Replaces simple intervals with research-based optimal times

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

The app is configured for Vercel deployment with proper environment variable setup for production use.

### **Vercel Cron Jobs (Production)**

The app uses Vercel's reliable cron system with a SINGLE comprehensive job for all automation:

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-tweet",
      "schedule": "*/15 * * * 1-5"
    }
  ]
}
```

**Single Cron Job Details:**
- **Schedule**: `*/15 * * * 1-5` (Every 15 minutes, Monday-Friday)
- **Comprehensive Automation**: One job handles generation, scheduling, AND posting
- **Smart Logic**: Posts ready tweets immediately, generates new ones when needed
- **Optimal Timing**: Uses 15 IST time slots (8am-10pm) for maximum engagement
- **Persona Variety**: Alternates between Satirist and Philosopher personas
- **Environment**: Requires `CRON_SECRET` environment variable for security

**How It Works:**
1. **Phase 1**: Check for tweets ready to post (within 5-minute window)
2. **Phase 2**: Generate 3-8 new tweets if pipeline has < 5 tweets OR every 6 hours
3. **Intelligent Scheduling**: Uses optimal IST posting times with proper UTC conversion

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
- **Multi-Persona Support**: ✅ Working (4 personas available)
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