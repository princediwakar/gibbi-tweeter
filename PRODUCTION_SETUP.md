# Production Setup Guide - Gibbi Tweeter

**🌐 Production URL:** https://gibbi-tweeter.vercel.app

## 🚀 Quick Setup for Auto-Posting

### 1. Configure External Cron Service

**Recommended: [cron-job.org](https://cron-job.org) (Free)**

1. **Create free account** at https://cron-job.org
2. **Add new cron job** with these settings:
   - **Title:** `Gibbi Tweeter Auto-Chain`
   - **URL:** `https://gibbi-tweeter.vercel.app/api/post-ready`
   - **Schedule:** `*/15 * * * *` (Every 15 minutes, 24/7)
   - **Method:** GET
   - **Request Headers:** 
     - `Authorization: Bearer YOUR_CRON_SECRET`
     - `User-Agent: CronJob-External-Trigger`

### 2. Test the Setup

**Manual API Test:**
```bash
# Test tweet generation
curl -X POST https://gibbi-tweeter.vercel.app/api/tweets \
  -H "Content-Type: application/json" \
  -d '{"action": "generate", "persona": "physics_master", "includeHashtags": true}'

# Test auto-chain system (requires CRON_SECRET)
curl -X GET https://gibbi-tweeter.vercel.app/api/generate-async \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Dashboard Access:**
- Visit: https://gibbi-tweeter.vercel.app
- Generate test tweets manually
- Monitor scheduled and posted tweets

### 3. Expected Daily Output

**Automated Educational Content:**
- **15-20 tweets per day** (every 15 minutes during active hours)
- **4 Test Prep Personas** rotating content
- **US Time Zone Optimization** (8 AM - 10 PM EST/PST)
- **Smart Scheduling** with 45-minute minimum spacing



### 4. Monitor Performance

**Key Metrics to Track:**
- **Tweet Generation Rate** (15-20 per day)
- **Posting Success Rate** (should be >95%)
- **Content Variety** (4 personas balanced)
- **Engagement Quality** (educational value)

**Monitoring URLs:**
- **Dashboard:** https://gibbi-tweeter.vercel.app
- **API Health:** https://gibbi-tweeter.vercel.app/api/test-twitter
- **Auto-Chain Status:** Check cron-job.org execution logs

### 5. Alternative Cron Services

**If cron-job.org doesn't work:**

**GitHub Actions (Free):**
```yaml
# .github/workflows/auto-post.yml
name: Auto Post Tweets
on:
  schedule:
    - cron: '*/15 * * * *'
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X GET https://gibbi-tweeter.vercel.app/api/post-ready \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**UptimeRobot (Free):**
- Create HTTP monitor
- URL: `https://gibbi-tweeter.vercel.app/api/generate-async`
- Interval: 5 minutes
- Add custom header: `Authorization: Bearer YOUR_CRON_SECRET`

## 🎯 Marketing Results



**Expected Growth:**
- **Week 1:** 50-100 followers (initial content)
- **Month 1:** 500+ followers (consistent value)
- **Month 3:** 2,000+ followers (authority building)
- **Month 6:** 5,000+ followers (established presence)

**Traffic to Gibbi AI:**
- **Month 1:** 100+ clicks to gibbi.vercel.app
- **Month 3:** 500+ monthly visitors
- **Month 6:** 2,000+ monthly qualified leads

---

**🎓 Your automated test prep marketing machine is now live and generating qualified leads for Gibbi AI!**