# STR Certified - Railway Deployment Guide

This guide covers deploying STR Certified with OpenAI integration to Railway.

## Environment Variables

Set these environment variables in Railway for your deployed app:

### Required Variables

```bash
# Database
railway variables set DATABASE_URL="postgresql://..."

# Authentication
railway variables set NEXTAUTH_SECRET="your-secret-here"
railway variables set NEXTAUTH_URL="https://your-domain.com"

# OpenAI Integration
railway variables set OPENAI_API_KEY="your-openai-api-key"
railway variables set OPENAI_MODEL="gpt-4"
railway variables set OPENAI_VISION_MODEL="gpt-4-vision-preview"

# Feature Flags
railway variables set ENABLE_AI_VALIDATION="true"
```

### Optional Variables

```bash
# OAuth Providers
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"

# File Upload
railway variables set UPLOADTHING_SECRET="your-uploadthing-secret"
railway variables set UPLOADTHING_APP_ID="your-uploadthing-app-id"

# Email Configuration
railway variables set SMTP_HOST="smtp.example.com"
railway variables set SMTP_PORT="587"
railway variables set SMTP_USER="your-email@example.com"
railway variables set SMTP_PASS="your-email-password"
railway variables set SMTP_FROM="noreply@example.com"

# Redis (for production caching)
railway variables set REDIS_URL="redis://..."

# Monitoring
railway variables set SENTRY_DSN="your-sentry-dsn"

# OpenAI Organization (optional)
railway variables set OPENAI_ORG_ID="your-org-id"
```

## Deployment Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Link to Existing Project** (if applicable)
   ```bash
   railway link
   ```

5. **Set Environment Variables**
   Use the commands above to set all required environment variables.

6. **Deploy**
   ```bash
   railway up
   ```

## Verifying Deployment

After deployment, verify that:

1. **Database Connection**: Check that your app can connect to the PostgreSQL database
2. **Authentication**: Test login/signup functionality
3. **AI Features**: Test AI validation features (if ENABLE_AI_VALIDATION is true)
4. **File Upload**: Test image upload functionality

## Production Considerations

### Security
- Generate a strong `NEXTAUTH_SECRET` using:
  ```bash
  openssl rand -base64 32
  ```
- Keep your OpenAI API key secure and never commit it to version control
- Use Railway's environment variable management for all sensitive data

### Performance
- Consider adding Redis for caching in production
- Monitor OpenAI API usage to manage costs
- Use the built-in rate limiting (60 requests/minute per user)

### Monitoring
- Set up Sentry for error tracking
- Monitor OpenAI API usage through OpenAI's dashboard
- Use Railway's built-in logs and metrics

## Troubleshooting

### Common Issues

1. **OpenAI API Key Invalid**
   - Verify the API key is correctly set in Railway
   - Check that the key has not expired
   - Ensure proper billing is set up in OpenAI

2. **Database Connection Failed**
   - Verify DATABASE_URL is correctly formatted
   - Check Railway's database service is running
   - Ensure SSL mode is properly configured

3. **Authentication Issues**
   - Verify NEXTAUTH_URL matches your deployed domain
   - Ensure NEXTAUTH_SECRET is set
   - Check OAuth provider configurations

### Logs

View application logs:
```bash
railway logs
```

View logs with filtering:
```bash
railway logs --filter "error"
```

## Cost Management

### OpenAI API Costs
- GPT-4: ~$0.03/1K tokens (input), ~$0.06/1K tokens (output)
- GPT-4 Vision: ~$0.01/image + text generation costs
- Monitor usage through OpenAI dashboard
- Use caching to reduce API calls

### Railway Costs
- Check Railway's pricing for current rates
- Monitor resource usage through Railway dashboard
- Consider scaling based on actual usage

## Support

- Railway Documentation: https://docs.railway.app
- OpenAI Documentation: https://platform.openai.com/docs
- STR Certified Issues: https://github.com/your-repo/issues