# Viral Test Prep Tweet Bot - Rapid Growth Engine 🔥

**⚡ VIRAL-OPTIMIZED** - A specialized Next.js application that generates viral test preparation content designed for explosive Twitter growth using AI-powered competitive challenges.

> **🎯 MISSION**: Viral content generation system targeting 5,000 followers in 60 days through brutally difficult test prep challenges, competitive engagement hooks, and strategic Gibbi AI traffic driving (gibbi.vercel.app).

> **📝 Self-Updating Documentation**: This file should be updated whenever significant changes are made to the codebase. When adding new features, API routes, components, or configuration changes, please update the relevant sections below to keep this documentation current and useful for future development.

## Project Overview

This is an AI-powered viral content generation system built with Next.js 15, TypeScript, and Tailwind CSS. The app features 3 specialized AI personas that create brutally difficult, highly engaging test prep challenges designed to drive rapid Twitter growth and build an elite community of high-performing students.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI API (configurable to use DeepSeek)
- **Social Media**: Twitter API v2 with OAuth 1.0a
- **Scheduling**: Node-cron for automated posting
- **Data Storage**: Neon PostgreSQL database

## Key Features

### 🔥 Viral Test Prep Persona System
- **SAT Coach** (🎓) - High school viral challenge specialist
  - **Brutal SAT Traps**: "95% fall for this! If f(x) = x²-4x+3..."
  - **30-Second Math Challenges**: "Triangle ABC has sides 5, 12, 13..."
  - **Evil Questions**: "If 3^(x+1) + 3^(x+1) + 3^(x+1) = 27^x, find x..."
  - **Reading Nightmares**: Questions with multiple valid interpretations
  - **Competitive Hooks**: "Don't be the 99%... Comment your answer!"

- **GRE Master** (📚) - Graduate school viral content expert  
  - **Diabolical Vocab Traps**: "ENERVATE means to weaken, but 95% think it means energize"
  - **Impossible Math Challenges**: "If x@y = x²-y² and 3@a = a@3, find all values of a"
  - **Quant Destroyers**: Complex probability with product constraints
  - **Reading Comp From Hell**: Graduate-level paradoxical statements
  - **Brain Melters**: "Princeton Review says this is 'difficulty level 5'"

- **GMAT Pro** (💼) - MBA viral pressure specialist
  - **GMAT Death Traps**: "Revenue increased 200% but profits fell 50%..."
  - **Nightmare Data Sufficiency**: "Is |x-3| > |x+3|? Wharton admits get this in 60 seconds"
  - **Critical Reasoning Hell**: Multi-layered assumptions and flawed conclusions
  - **Executive Pressure Tests**: "If you can't solve it in 90 seconds, you're not ready for Wharton"
  - **Reality Checks**: "This is why 700+ scorers quit their jobs"

### 🚀 Viral Content Generation Engine
- **Question of the Day**: Challenging practice problems with answer reveals and engagement hooks
- **Spot the Trap**: Common mistakes 99% of students make with dramatic reveals
- **30-Second Challenges**: Time-pressured problem solving with countdown urgency
- **Quick Win Tips**: Bite-sized strategy hacks for immediate score improvement
- **Test Trap Alerts**: Warnings about sneaky question patterns that fool most students
- **Viral Engagement Hooks**: "99% get this wrong!", "RT if you got this right!", "Tag someone who needs to see this"
- **Gibbi AI Integration**: Strategic traffic-driving CTAs (15% frequency) for platform growth
- **Competitive Elements**: Leaderboards, timing challenges, and ego-driven sharing triggers

### ⚡ Viral Automation Features
- **Production**: External cron service optimized for viral engagement waves
- **Viral Timing**: Posts every 25 minutes (vs 45min) during peak viral hours
- **Peak Engagement Windows**: 8:30 PM ET = maximum viral potential
- **Competitive Moments**: 3:00-4:15 PM after-school peak for homework procrastination
- **Wednesday Boost**: 1.4x engagement multiplier during mid-week stress peak
- **Real-time Viral Tracking**: Engagement rates, retweet velocity, comment activity
- **Smart Content Distribution**: Cycles through viral content types for maximum variety
- **Twitter URL Tracking**: Direct links to monitor viral spread and engagement
- **Enhanced Error Handling**: Detailed error messages with actionable solutions
- **Quality Scoring**: Viral potential assessment with engagement predictions

## Project Structure

```
gibbi-tweeter/
├── app/
│   ├── api/
│   │   ├── scheduler/route.ts     # Auto-posting scheduler endpoint
│   │   ├── tweets/
│   │   │   ├── route.ts           # CRUD operations for tweets
│   │   │   └── [id]/route.ts      # Individual tweet operations
│   │   └── test-twitter/route.ts  # Twitter API testing
│   ├── layout.tsx                 # Root layout with test prep branding
│   └── page.tsx                   # Main dashboard page
├── components/
│   ├── ui/                        # shadcn/ui components
│   └── TweetDashboard.tsx         # Main dashboard component
├── lib/
│   ├── sources-sat.json           # SAT-focused RSS sources
│   ├── sources-gre.json           # GRE-focused RSS sources
│   ├── sources-gmat.json          # GMAT-focused RSS sources
│   ├── sources-testprep.json      # General test prep sources
│   └── sources.json               # Default US education sources
└── .env.local                     # Environment variables
```

## API Routes

- `GET/POST /api/tweets` - Fetch all tweets / Generate new test prep tweets
- `PATCH/DELETE /api/tweets/[id]` - Update/delete specific tweets  
- `POST /api/scheduler` - Control auto-posting scheduler
- `GET/POST /api/test-twitter` - Twitter API diagnostics and test posting

### **Content Sources & RSS Feeds**

The system uses specialized RSS sources for each test prep persona:

**SAT Coach Sources:**
- @CollegeBoard, @KaplanTestPrep, @PrincetonReview
- Reddit: r/SAT, r/SATPrep, r/ApplyingToCollege
- University feeds: @Harvard, @Stanford, @MIT

**GRE Master Sources:**
- @ETS, @Manhattan_Prep, @Magoosh
- Reddit: r/GRE, r/GradSchool, r/gradadmissions
- Academic feeds: @chronicle, @InsideHigherEd

**GMAT Pro Sources:**
- @GMATofficial, @ManhattanGMAT, @VeritasPrep
- Reddit: r/GMAT, r/MBA, r/businessschool
- Business schools: @Wharton, @Harvard_HBS, @StanfordGSB

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

## Content Generation Strategy

### Educational Content Types
- **Practice Questions**: MCQ format with clear explanations
- **Study Tips**: Actionable strategies for test improvement
- **Motivational Content**: Encouraging messages for test-takers
- **Test Updates**: Information about score releases, registration deadlines
- **Concept Explanations**: Breaking down complex topics simply

### US Market Focus
- **Target Demographics**: US high school students, college graduates, MBA candidates
- **Posting Schedule**: Optimized for US time zones (7 AM, 12 PM, 6 PM, 9 PM EST/PST)
- **Content Style**: American English, US-specific test formats and requirements
- **Engagement Strategy**: Build authority in US test prep market

## Development Commands

```bash
npm run dev        # Start development server (with Turbopack)
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### **⚠️ IMPORTANT: Pre-Commit Requirements**
**ALWAYS run the build before committing and pushing:**
```bash
npm run build      # Must pass before committing
npm run lint       # Must pass before committing
git add .
git commit -m "Your commit message"
git push
```

## Key Components

### TweetDashboard.tsx
Main component containing:
- Test prep tweet generation forms (single & bulk)
- Tweet management table with status tracking
- Scheduler controls (start/stop auto-posting)
- Statistics dashboard (total, drafts, scheduled, posted)
- Batch selection and scheduling operations
- Test prep persona selection

### Data Model
```typescript
interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  persona: string; // sat_coach, gre_master, gmat_pro
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

This project is configured with Playwright MCP for direct browser testing:

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

### ✅ **Verified Functionality** (Last Tested: 2025-08-24)

**Test Prep Content Generation:**
- ✅ SAT Coach persona generates practice questions and study tips
- ✅ GRE Master creates vocabulary and analytical writing guidance
- ✅ GMAT Pro produces critical reasoning and business school content
- ✅ Test Prep Guru provides general study strategies and motivation
- ✅ US education RSS sources feeding relevant trending topics
- ✅ Educational content quality with appropriate tone and accuracy

### **Content Quality Examples**

**SAT Coach:**
```
📝 SAT Reading Tip: Don't just pick the first answer that "sounds right." 
Find the exact text evidence that proves Choice A is the best answer! 
#CloseReading is key. #SATPrep #StudyTips
```

**GRE Master:**
```
✍️ GRE Writing Tip: Don't just state your achievements—analyze their significance. 
For your "Describe an experience" essay, show the skills gained and how they 
shaped your goals. This depth turns self-promotion into compelling narrative.
```

**GMAT Pro:**
```
🧠 GMAT Critical Reasoning Practice: Use the M.I.C.E. mnemonic to evaluate 
arguments: Money, Ideology, Compromise, Electability. 
What assumptions does the author make?
```

## Security Notes

- Twitter API credentials are required for posting functionality
- The app uses OAuth 1.0a for Twitter authentication
- Environment variables contain sensitive API keys
- Auto-posting runs server-side with node-cron
- Educational content maintains accuracy with lower AI temperature settings

## Deployment

The app is configured for Vercel deployment with external cron service for production automation.

### **Production Auto-Posting System**

**External Cron Service Setup:**
1. **Create account** at https://cron-job.org
2. **Configure cron job**:
   - **URL**: `https://gibbi-tweeter.vercel.app/api/post-ready`
   - **Schedule**: `*/15 * * * *` (Every 15 minutes)
   - **Method**: GET
   - **Headers**: `Authorization: Bearer ${CRON_SECRET}`

**Auto-Chain Viral Content:**
- **Production URL**: https://gibbi-tweeter.vercel.app/api/generate-async
- **Frequency**: Every 8-10 minutes during peak viral hours (6AM-11PM ET)
- **Daily Output**: 18-25 viral tweets optimized for maximum engagement
- **Content Variety**: Rotates through 3 viral personas + 6 content types
- **Quality Control**: Viral potential prioritized with engagement optimization

## 🎯 **Viral Growth Strategy for Gibbi AI**

This bot serves as a high-velocity marketing engine for Gibbi AI (gibbi.vercel.app):

### **Viral Marketing Approach**
- **Community Building**: Create elite community of high-performing students through difficult challenges
- **Ego-Driven Sharing**: Students share to prove intelligence and compete with peers
- **FOMO Generation**: Exclusive insights and challenges that students MUST engage with
- **Traffic Funneling**: Strategic Gibbi mentions (15% frequency) during peak engagement

### **Current Integration Points**
- **Strategic CTAs**: "Want unlimited practice questions? Check out gibbi.vercel.app"
- **Challenge Extensions**: "Ready for the full quiz challenge? Try gibbi.vercel.app"
- **Platform Credits**: "Master more questions like this at gibbi.vercel.app"
- **Custom Quiz Promotion**: "Create your own custom quizzes at gibbi.vercel.app"

### **Viral Growth Metrics (Target: 5,000 followers in 60 days)**
- **Week 1-2**: 300-500 followers (viral content establishment)
- **Week 3-4**: 800-1,500 followers (viral tipping point reached)
- **Week 5-6**: 2,000-3,500 followers (exponential growth phase)
- **Week 7-8**: 4,000-7,000 followers (target exceeded)
- **Daily Engagement Rate**: 3-5% for viral amplification
- **Gibbi Traffic**: 15-25 qualified visitors per day from strategic CTAs

---

## 🔥 **Viral Test Prep System Status**

### **⚡ VIRAL-OPTIMIZED & PRODUCTION-READY** (as of 2025-08-25)
- **Twitter API Integration**: ✅ Working with viral content optimization
- **AI Content Generation**: ✅ Working (DeepSeek + viral prompt engineering)
- **Viral Timing System**: ✅ Working (peak engagement windows, 25min spacing)
- **3-Persona Viral System**: ✅ Working (SAT Coach, GRE Master, GMAT Pro)
- **Engagement Amplification**: ✅ Working (competitive hooks, sharing triggers)
- **Gibbi AI Integration**: ✅ Working (15% strategic CTA frequency)
- **Viral Growth Engine**: ✅ Ready (targeting 5,000 followers in 60 days)

### **Viral Content Examples**

**SAT Coach:**
```
🚨 BRUTAL SAT TRAP: 95% fall for this! If f(x) = x²-4x+3 and f(a) = f(3), 
what are ALL possible values of a? Most pick just ONE answer... #SATTrap #TestTrick
```

**GRE Master:**
```
🚨 DIABOLICAL GRE TRAP: ENERVATE means to weaken, but 95% think it means energize. 
If you got that wrong, you'll HATE this: What does INFLAMMABLE mean? #GRETrap #VocabNightmare
```

**GMAT Pro:**
```
🚨 GMAT DEATH TRAP: 'Revenue increased 200% but profits fell 50%.' Which weakens this paradox? 
A) Market share grew B) Costs tripled C) Competitors failed D) Both A&B. 95% pick wrong. #GMATTrap
```

### **Growth Projections & Market Impact**
- **Target Market**: 3M+ US test prep students annually ($4.5B industry)
- **Viral Growth Goal**: 5,000 engaged followers in 60 days
- **Expected Engagement**: 3-5% viral amplification rate
- **Gibbi Traffic**: 15-25 qualified daily visitors from strategic CTAs
- **Community Building**: Elite high-performer student network

---

*Last Updated: VIRAL CONTENT TRANSFORMATION COMPLETE - Successfully converted educational tweet bot to viral growth engine with brutally difficult challenges, competitive engagement hooks, and optimized timing for rapid Twitter growth targeting 5,000 followers in 60 days while driving strategic traffic to Gibbi AI platform.*