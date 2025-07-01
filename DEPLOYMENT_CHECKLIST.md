# Railway Deployment Checklist for STR Certified

## Pre-Deployment Verification ✅

### OpenAI Integration Status
- ✅ API Key validated: Working with `gpt-4o-mini` model
- ✅ Test successful: Connection verified
- ✅ Cost optimization: Using efficient prompts and caching
- ✅ Models configured: 
  - Text: `gpt-4o-mini` (ultra low cost)
  - Vision: `gpt-4o` (when available)

### Environment Configuration
```bash
# Core Settings
DATABASE_URL="postgresql://..." # Update with Railway PostgreSQL
NEXTAUTH_URL="https://your-app.railway.app" # Update with your Railway URL
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# OpenAI Settings (Ready to use)
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_VISION_MODEL="gpt-4o"
ENABLE_AI_VALIDATION="true"
```

## Deployment Steps

### 1. Quick Deploy (Automated)
```bash
# Run the deployment script
./railway-deploy.sh
```

### 2. Manual Deploy
```bash
# Login to Railway
railway login

# Initialize/Link project
railway init

# Set environment variables
railway variables set OPENAI_API_KEY="your-openai-api-key-here"
railway variables set OPENAI_MODEL="gpt-4o-mini"
railway variables set OPENAI_VISION_MODEL="gpt-4o"
railway variables set ENABLE_AI_VALIDATION="true"

# Deploy
railway up
```

### 3. Post-Deployment Setup
```bash
# Run database migrations
railway run npm run db:migrate

# Seed database (optional)
railway run npm run db:seed

# View logs
railway logs

# Open app
railway open
```

## Cost Estimates with GPT-4o-mini

| Operation | Tokens | Cost per Request |
|-----------|--------|------------------|
| Validation | ~150 | $0.00003 |
| Assessment | ~250 | $0.00005 |
| Report Gen | ~800 | $0.00016 |
| Photo Analysis | ~200 | $0.00004 |

**Monthly estimate (1000 operations): ~$0.08**

## Testing After Deployment

1. **Test OpenAI Connection**
   ```bash
   railway run tsx scripts/test-openai.ts
   ```

2. **Check API Endpoint**
   ```bash
   curl https://your-app.railway.app/api/ai/testConnection
   ```

3. **Monitor Costs**
   - View cost dashboard in the app
   - Check Railway logs for token usage

## Troubleshooting

### If OpenAI fails after deployment:
1. Check environment variables: `railway variables`
2. Verify API key is set correctly
3. Check logs: `railway logs --filter "OpenAI"`
4. Test with curl using the deployed URL

### Common Issues:
- **Model not found**: Already fixed - using `gpt-4o-mini`
- **Rate limits**: Implemented caching and rate limiting
- **High costs**: Using optimized prompts and cheapest model

## Security Notes
- ✅ API key is stored securely in Railway environment
- ✅ Rate limiting prevents abuse (60 req/min per user)
- ✅ Content moderation enabled
- ✅ Costs tracked and monitored

## Ready to Deploy! 🚀

The OpenAI integration is fully configured and tested. Simply run:
```bash
./railway-deploy.sh
```

Or use the manual commands above. The app will be live with AI features enabled!