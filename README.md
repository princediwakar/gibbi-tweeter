# Gibbi Tweeter - US Test Prep Tweet Bot 🎓

**Automated US test preparation content generator targeting SAT, GRE, GMAT, and standardized test markets.**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.7-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000)](https://vercel.com/)

## 🎯 Overview

Gibbi Tweeter is a specialized AI-powered content generator that creates educational tweets for US students preparing for standardized tests. Built as a marketing channel for [Gibbi AI](https://gibbi.vercel.app), it targets the $4.5B US test prep industry with 3M+ annual test-takers.

**🌐 Live Demo:** [https://gibbi-tweeter.vercel.app](https://gibbi-tweeter.vercel.app)

## ✨ Features

### 🎓 Four Test Prep Personas
- **SAT Coach** (🎓) - High school test preparation specialist
- **GRE Master** (📚) - Graduate school preparation expert  
- **GMAT Pro** (💼) - MBA preparation specialist
- **Test Prep Guru** (🧠) - General study strategies and motivation

### 📚 Educational Content Types
- **Practice Questions** with MCQ format and explanations
- **Study Tips** and actionable test strategies
- **Motivational Content** for test-takers
- **Test Updates** about deadlines and score releases
- **Concept Explanations** breaking down complex topics

### ⚡ Automation Features
- **Smart Scheduling** optimized for US time zones
- **RSS Integration** with US education sources (College Board, ETS, universities)
- **Bulk Generation** (5-20 tweets at once)
- **Auto-posting** via external cron services
- **Quality Control** with educational accuracy prioritization

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** OpenAI/DeepSeek API (Educational prompts)
- **Social:** Twitter API v2 (OAuth 1.0a)
- **Scheduling:** Node-cron
- **Data:** Neon PostgreSQL database

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Twitter Developer Account with API v2 access
- OpenAI API key (or DeepSeek)
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/princediwakar/gibbi-tweeter.git
cd gibbi-tweeter

# Install dependencies  
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables (see below)

# Run development server
npm run dev
```

### Environment Variables

```env
# AI API
OPENAI_API_KEY=your_openai_key_here

# Twitter API v2
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_secret
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret

# Security (Production)
CRON_SECRET=your_random_secret_key_here
```

## 📊 Content Sources

### Specialized RSS Feeds by Persona
- **SAT Coach**: @CollegeBoard, @KaplanTestPrep, @PrincetonReview + Reddit SAT communities
- **GRE Master**: @ETS, @Manhattan_Prep, @Magoosh + Graduate school subreddits  
- **GMAT Pro**: @GMATofficial, @ManhattanGMAT + Business school Twitter feeds
- **Test Prep Guru**: General education sources + Test prep communities

## 🎯 Marketing Strategy

### Target Market
- **Primary**: 2.1M SAT test-takers annually
- **Secondary**: 500K GRE + 200K GMAT test-takers
- **Total Addressable Market**: 3M+ US students

### Content Marketing Approach
1. **Authority Building** in US test prep space
2. **Value-First Strategy** with genuine educational content
3. **Audience Development** of US test prep students
4. **Traffic Generation** to Gibbi AI platform

## 📈 Sample Generated Content

**SAT Coach:**
```
📝 SAT Reading Tip: Don't just pick the first answer that "sounds right." 
Find the exact text evidence that proves Choice A is the best answer! 
#CloseReading is key. #SATPrep #StudyTips
```

**GRE Master:**  
```
📚 GRE Vocab: UBIQUITOUS means 'present everywhere' - like anxiety during 
grad school apps! Use it: 'Smartphones are ubiquitous in modern society.' 
#GRE #Vocabulary
```

**GMAT Pro:**
```
🧠 GMAT Critical Reasoning: 'Sales increased 20% after hiring new manager.' 
What strengthens this? A) Manager has MBA B) Sales team expanded 
C) No other changes occurred D) Previous manager quit. Answer: C! 
#GMAT #CriticalReasoning
```

## 📁 Project Structure

```
gibbi-tweeter/
├── app/
│   ├── api/tweets/route.ts       # Tweet generation API
│   ├── api/scheduler/route.ts    # Auto-posting scheduler
│   └── layout.tsx                # App layout with test prep branding
├── components/
│   ├── dashboard/                # Dashboard components
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── sources-sat.json          # SAT-focused RSS sources
│   ├── sources-gre.json          # GRE-focused RSS sources
│   ├── sources-gmat.json         # GMAT-focused RSS sources
│   ├── openai.ts                 # AI content generation
│   └── trending.ts               # RSS feed processing
└── CLAUDE.md                     # Detailed documentation
```

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to Vercel
npm run build
vercel --prod
```

### Production Auto-Posting Setup
1. Create account at [cron-job.org](https://cron-job.org)
2. Configure cron job:
   - **URL**: `https://gibbi-tweeter.vercel.app/api/auto-chain`
   - **Schedule**: `*/15 * * * *` (Every 15 minutes)
   - **Headers**: `Authorization: Bearer ${CRON_SECRET}`

## 🛠️ Development

```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run start      # Start production server
npm run lint       # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[Gibbi AI](https://gibbi.vercel.app)** - AI-powered quiz creation platform for students
- **[Original Tweeter](https://github.com/princediwakar/tweeter-ai)** - Satirical tweet generator (parent project)

## 📞 Support

For questions about Gibbi Tweeter or integration with Gibbi AI:
- Create an issue in this repository
- Visit [Gibbi AI](https://gibbi.vercel.app) for the quiz platform

---

**Built for the US test prep market • Targeting 3M+ students annually • Marketing channel for Gibbi AI**