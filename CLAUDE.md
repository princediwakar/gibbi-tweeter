# Viral NEET Tweet Bot - India Growth Engine 🔥

**⚡ VIRAL-OPTIMIZED** - A specialized Next.js application that generates viral NEET preparation content designed for explosive Twitter growth using AI-powered competitive challenges targeting Indian medical entrance aspirants.

> **🎯 MISSION**: Viral content generation system targeting 10,000 followers in 60 days through brutally difficult NEET challenges, competitive engagement hooks, and strategic Gibbi AI traffic driving (gibbi.vercel.app) in the Indian medical education market.

> **📝 Self-Updating Documentation**: This file should be updated whenever significant changes are made to the codebase. When adding new features, API routes, components, or configuration changes, please update the relevant sections below to keep this documentation current and useful for future development.

## Project Overview

This is an AI-powered viral content generation system built with Next.js 15, TypeScript, and Tailwind CSS. The app features 3 specialized AI personas that create brutally difficult, highly engaging NEET preparation challenges designed to drive rapid Twitter growth and build an elite community of high-performing Indian medical entrance aspirants.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI API (configurable to use DeepSeek)
- **Social Media**: Twitter API v2 with OAuth 1.0a
- **Scheduling**: Node-cron for automated posting
- **Data Storage**: Neon PostgreSQL database

## Key Features

### 🔥 Viral NEET Persona System
- **Physics Master** (⚗️) - NEET Physics viral challenge specialist
  - **Brutal Physics Traps**: "90% fall for this! A 2kg block slides down 30° incline..."
  - **30-Second Mechanics Challenges**: "Two masses connected by string over pulley..."
  - **Electromagnetic Nightmares**: "Current loop in magnetic field. Which direction is the force?"
  - **Thermodynamics Brain Teasers**: Questions with multiple valid interpretations
  - **Competitive Hooks**: "Don't be the 90%... Comment your answer!"

- **Chemistry Guru** (🧪) - NEET Chemistry viral content expert  
  - **Organic Chemistry Death Traps**: "SN1 vs SN2 mechanism. 95% get this wrong..."
  - **Reaction Mechanism Puzzles**: "Balance this equation: C₂H₆ + O₂ → CO₂ + H₂O"
  - **Periodic Table Destroyers**: Complex bonding and atomic property challenges
  - **Chemical Bonding Hell**: Graduate-level orbital theory questions
  - **Brain Melters**: "Allen Kota says this is 'difficulty level 5'"

- **Biology Pro** (🧬) - NEET Biology viral pressure specialist
  - **Human Physiology Nightmares**: "Which blood vessel has highest pressure..."
  - **Genetics Death Traps**: "AaBb × AaBb cross. AIIMS toppers get this in 60 seconds"
  - **Ecology Reasoning Hell**: Multi-layered ecosystem assumptions and classifications
  - **Medical Pressure Tests**: "If you can't solve it in 90 seconds, you're not ready for AIIMS"
  - **Reality Checks**: "This is why 650+ scorers get into government medical colleges"

### 🚀 Viral NEET Content Generation Engine
- **NEET Question of the Day**: Challenging physics/chemistry/biology practice problems with answer reveals
- **Spot the NEET Trap**: Common mistakes 99% of NEET aspirants make with dramatic reveals
- **30-Second Challenges**: Time-pressured NEET problem solving with countdown urgency
- **Quick Win Tips**: Bite-sized strategy hacks for immediate NEET score improvement
- **NEET Trap Alerts**: Warnings about sneaky question patterns that fool most students
- **Viral Engagement Hooks**: "90% get this wrong!", "RT if you're AIIMS material!", "Tag a future doctor!"
- **Gibbi AI Integration**: Strategic traffic-driving CTAs (15% frequency) for platform growth
- **Competitive Elements**: Medical college rankings, timing challenges, and ego-driven sharing triggers

### ⚡ Viral Automation Features (IST Optimized)
- **Production**: External cron service optimized for viral engagement waves in India
- **Viral Timing**: Posts every 25 minutes during IST peak hours (7 AM - 11 PM IST)
- **Peak Engagement Windows**: 9:00 PM IST = maximum viral potential (post-study relaxation time)
- **Competitive Moments**: 4:00-7:00 PM IST student peak for homework and coaching institute discussions
- **Sunday Boost**: 1.5x engagement multiplier during weekend NEET prep sessions
- **Real-time Viral Tracking**: Engagement rates, retweet velocity, comment activity
- **Smart Content Distribution**: Cycles through Physics/Chemistry/Biology for maximum variety
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

│   └── sources.json               # Default US education sources
└── .env.local                     # Environment variables
```

## API Routes

- `GET/POST /api/tweets` - Fetch all tweets / Generate new test prep tweets
- `PATCH/DELETE /api/tweets/[id]` - Update/delete specific tweets  
- `POST /api/scheduler` - Control auto-posting scheduler
- `GET/POST /api/test-twitter` - Twitter API diagnostics and test posting

### **Content Sources & RSS Feeds**

The system uses specialized RSS sources for each NEET preparation persona:

**Physics Master Sources:**
- @NTAofficial, @aakash_edu, @allen_neet, @PhysicsWallah
- Reddit: r/NEET, r/JEEMain, r/physics, r/IndianAcademics
- Educational feeds: @unacademy, @vedantu, @byjus

**Chemistry Guru Sources:**
- @NTAofficial, @aakash_edu, @allen_neet, @PhysicsWallah  
- Reddit: r/NEET, r/chemistry, r/OrganicChemistry, r/NEETprep
- Educational feeds: @unacademy, @vedantu, @topperlearning

**Biology Pro Sources:**
- @NTAofficial, @aakash_edu, @allen_neet, @PhysicsWallah
- Reddit: r/NEET, r/biology, r/MedicalSchoolIndia, r/HumanBiology
- Medical colleges: @AIIMS_NewDelhi, @KMC_Manipal, @CMC_Vellore

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

### NEET Educational Content Types
- **Practice Questions**: MCQ format with clear explanations for Physics, Chemistry, Biology
- **Study Tips**: Actionable strategies for NEET score improvement
- **Motivational Content**: Encouraging messages for medical entrance aspirants
- **Test Updates**: Information about NEET registration, cutoffs, admission schedules
- **Concept Explanations**: Breaking down complex NEET topics simply

### Indian Market Focus
- **Target Demographics**: Indian Class 11-12 students, NEET aspirants, medical entrance candidates
- **Posting Schedule**: Optimized for India Standard Time (7 AM, 12 PM, 6 PM, 9 PM IST)
- **Content Style**: Indian English, NEET-specific question formats and NCERT curriculum
- **Engagement Strategy**: Build authority in Indian medical entrance prep market

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
- NEET preparation tweet generation forms (single & bulk)
- Tweet management table with status tracking
- Scheduler controls (start/stop auto-posting)
- Statistics dashboard (total, drafts, scheduled, posted)
- Batch selection and scheduling operations
- NEET persona selection (Physics Master, Chemistry Guru, Biology Pro)

### Data Model
```typescript
interface Tweet {
  id: string;
  content: string;
  hashtags: string[];
  persona: string; // physics_master, chemistry_guru, biology_pro
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

### ✅ **Verified Functionality** (Last Tested: 2025-08-29)

**NEET Content Generation:**
- ✅ Physics Master persona generates mechanics, thermodynamics, and electromagnetism challenges
- ✅ Chemistry Guru creates organic chemistry, periodic table, and reaction mechanism content
- ✅ Biology Pro produces human physiology, genetics, and ecology challenges
- ✅ Indian education RSS sources feeding relevant trending topics
- ✅ Educational content quality with appropriate tone and NEET exam accuracy

### **Content Quality Examples**

**Physics Master:**
```
🚨 PHYSICS TRAP: A 2kg block slides down a 30° incline. If friction coefficient is 0.3, 
what's the acceleration? 90% get this wrong! 
#NEETPhysics #PhysicsTrap #30SecondChallenge
```

**Chemistry Guru:**
```
💣 ORGANIC NIGHTMARE: SN1 vs SN2 mechanism. Which occurs with (CH₃)₃CBr + OH⁻? 
The answer reveals everything about carbocations! Most NEET aspirants miss this crucial detail.
#OrganicChemistry #NEETChemistry #ChemTrap
```

**Biology Pro:**
```
🧬 GENETICS CHALLENGE: AaBb × AaBb cross. What's probability of AaBB offspring? 
Most students mess up the calculation! AIIMS toppers solve this in 45 seconds.
#GeneticsChallenge #NEETBiology #MedicalEntrance
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
- **Frequency**: Every 25 minutes during peak viral hours (7AM-11PM IST)
- **Daily Output**: 20-28 viral NEET tweets optimized for maximum engagement
- **Content Variety**: Rotates through 3 NEET personas (Physics/Chemistry/Biology) + 6 content types
- **Quality Control**: Viral potential prioritized with engagement optimization

## 🎯 **Viral Growth Strategy for Gibbi AI**

This bot serves as a high-velocity marketing engine for Gibbi AI (gibbi.vercel.app):

### **Viral Marketing Approach**
- **Community Building**: Create elite community of high-performing NEET aspirants through difficult challenges
- **Ego-Driven Sharing**: Students share to prove medical entrance readiness and compete with peers
- **FOMO Generation**: Exclusive NEET insights and challenges that students MUST engage with
- **Traffic Funneling**: Strategic Gibbi mentions (15% frequency) during peak engagement

### **Current Integration Points**
- **Strategic CTAs**: "Want unlimited NEET practice questions? Check out gibbi.vercel.app"
- **Challenge Extensions**: "Ready for the full NEET quiz challenge? Try gibbi.vercel.app"
- **Platform Credits**: "Master more NEET questions like this at gibbi.vercel.app"
- **Custom Quiz Promotion**: "Create your own custom NEET quizzes at gibbi.vercel.app"

### **Viral Growth Metrics (Target: 10,000 followers in 60 days)**
- **Week 1-2**: 500-800 followers (viral NEET content establishment)
- **Week 3-4**: 1,200-2,500 followers (viral tipping point reached)
- **Week 5-6**: 3,000-6,000 followers (exponential growth phase)
- **Week 7-8**: 7,000-12,000 followers (target exceeded)
- **Daily Engagement Rate**: 4-6% for viral amplification (higher due to exam pressure)
- **Gibbi Traffic**: 25-40 qualified visitors per day from strategic CTAs

---

## 🔥 **Viral NEET System Status**

### **⚡ VIRAL-OPTIMIZED & PRODUCTION-READY** (as of 2025-08-29)
- **Twitter API Integration**: ✅ Working with viral content optimization
- **AI Content Generation**: ✅ Working (DeepSeek + viral prompt engineering)
- **IST Timing System**: ✅ Working (IST peak engagement windows, 25min spacing)
- **3-Persona NEET System**: ✅ Working (Physics Master, Chemistry Guru, Biology Pro)
- **Engagement Amplification**: ✅ Working (competitive hooks, sharing triggers)
- **Gibbi AI Integration**: ✅ Working (15% strategic CTA frequency)
- **Viral Growth Engine**: ✅ Ready (targeting 10,000 followers in 60 days)

### **Viral Content Examples**

**Physics Master:**
```
🚨 BRUTAL NEET PHYSICS TRAP: 90% fall for this! A 2kg block slides down a 30° incline. 
If friction coefficient is 0.3, what's the acceleration? Most forget THIS step... #NEETPhysics #PhysicsTrap
```

**Chemistry Guru:**
```
🚨 DIABOLICAL CHEMISTRY TRAP: Which has higher boiling point - HF or HCl? 95% say HF but forget THIS factor... 
The real answer will SHOCK NEET aspirants! #NEETChemistry #ChemTrap
```

**Biology Pro:**
```
🚨 BIOLOGY DEATH TRAP: Which blood vessel has highest pressure - aorta or pulmonary artery? 90% say aorta but forget THIS crucial detail... 
Future doctors MUST know this! #NEETBiology #BioTrap
```

### **Growth Projections & Market Impact**
- **Target Market**: 3M+ US test prep students annually ($4.5B industry)
- **Viral Growth Goal**: 5,000 engaged followers in 60 days
- **Expected Engagement**: 3-5% viral amplification rate
- **Gibbi Traffic**: 15-25 qualified daily visitors from strategic CTAs
- **Community Building**: Elite high-performer student network

---

*Last Updated: NEET VIRAL TRANSFORMATION COMPLETE - Successfully converted US test prep bot to Indian NEET viral growth engine with brutally difficult Physics/Chemistry/Biology challenges, competitive engagement hooks, and IST-optimized timing for rapid Twitter growth targeting 10,000 followers in 60 days while driving strategic traffic to Gibbi AI platform.*