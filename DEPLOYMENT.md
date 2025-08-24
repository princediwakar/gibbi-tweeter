# Deployment Guide - Tweeter App

## Vercel Deployment (Recommended)

### 1. Prerequisites
- Vercel account
- GitHub repository with your code
- Twitter Developer Account with API keys

### 2. Environment Variables Setup

In your Vercel dashboard, add these environment variables:

```env
# AI API (Choose one)
OPENAI_API_KEY=your_openai_key_here

# Twitter API v2 (Required - all fields needed)
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret  
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
```

### 3. Twitter API Permissions Setup

**CRITICAL**: Your Twitter app must have "Read and Write" permissions:

1. Visit [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Select your app
3. Go to Settings > User authentication settings
4. Set App permissions to "Read and Write"
5. **IMPORTANT**: Regenerate your Access Token and Access Token Secret
6. Update your environment variables with the new tokens

### 4. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add TWITTER_API_KEY
# ... add all other variables

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration
1. Connect your GitHub repo to Vercel
2. Import the project
3. Add environment variables in Vercel dashboard
4. Deploy automatically on git push

### 5. Post-Deployment Testing

After deployment:

1. **Test API connection**: Visit `https://gibbi-tweeter.vercel.app/api/test-twitter`
2. **Generate a tweet**: Use the UI to create and post a test tweet
3. **Check scheduler**: Start the auto-posting scheduler
4. **Monitor logs**: Check Vercel function logs for any errors

### 6. Troubleshooting

#### Common Issues:

**403 Forbidden Error:**
- Your Twitter app lacks "Read and Write" permissions
- Access tokens need to be regenerated after permission change
- Follow step 3 above carefully

**API Timeout:**
- Increase maxDuration in vercel.json (already set to 60s)
- Check if OpenAI/Twitter APIs are responding slowly

**Environment Variables Not Working:**
- Ensure all variables are set in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

**Build Errors:**
- Run `npm run build` locally first
- Fix any TypeScript errors
- Ensure all dependencies are in package.json

### 7. Production Optimizations

#### Performance:
- Edge functions are enabled by default
- API routes have 60s timeout configured
- Responses are cached where appropriate

#### Monitoring:
- Enable Vercel Analytics
- Monitor function execution times
- Set up alerts for failed deployments

#### Security:
- Environment variables are encrypted
- API keys are not exposed to client
- CORS headers configured properly

### 8. Alternative Deployment Options

#### Netlify:
1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

#### Railway:
1. Connect GitHub repo
2. Add environment variables
3. Railway auto-detects Next.js
4. Deploy

#### Docker (Self-hosted):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 9. Scaling Considerations

For high-volume usage:
- Use Vercel Pro for better limits
- Consider database storage instead of JSON files
- Implement proper rate limiting
- Add Redis for caching
- Monitor Twitter API rate limits

### 10. Maintenance

Regular tasks:
- Monitor API key usage and limits
- Update dependencies monthly
- Check Vercel function logs
- Rotate API keys periodically
- Backup tweet data

---

**Quick Deployment Checklist:**
- ✅ Twitter app has "Read and Write" permissions
- ✅ All environment variables are set
- ✅ Access tokens regenerated after permission change
- ✅ Test API connection works
- ✅ Build succeeds locally
- ✅ Deploy to Vercel
- ✅ Test posting a tweet in production