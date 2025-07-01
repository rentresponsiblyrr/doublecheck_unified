# Railway Setup Guide for doublecheck_unified

## Step 1: Install Railway CLI

### macOS (using Homebrew):
```bash
brew install railway
```

### macOS/Linux (using curl):
```bash
curl -fsSL https://railway.app/install.sh | sh
```

### Using npm:
```bash
npm install -g @railway/cli
```

## Step 2: Login to Railway
```bash
railway login
```
This will open your browser to authenticate.

## Step 3: Navigate to Project Directory
```bash
cd /Users/ryanrabideau/doublecheck-field-view/lovable-extraction/str-certified-migration/str-certified
```

## Step 4: Initialize Railway Project
```bash
# Create new Railway project
railway init

# When prompted, choose:
# - "Empty Project" or "Create new project"
# - Name it: doublecheck_unified
```

## Step 5: Link to GitHub Repository
```bash
# Connect to your GitHub repo
railway link

# Or if creating from GitHub:
railway init --template https://github.com/rentresponsiblyrr/doublecheck_unified
```

## Step 6: Set Environment Variables
```bash
# Run the deployment script
./railway-deploy.sh
```

Or manually set each variable:
```bash
railway variables set OPENAI_API_KEY="your-openai-api-key-here"
railway variables set OPENAI_MODEL="gpt-4o-mini"
railway variables set OPENAI_VISION_MODEL="gpt-4o"
railway variables set ENABLE_AI_VALIDATION="true"
```

## Step 7: Deploy
```bash
railway up
```

## Alternative: Railway Dashboard

You can also set up via the Railway dashboard:

1. Go to https://railway.app/new
2. Choose "Deploy from GitHub repo"
3. Select `rentresponsiblyrr/doublecheck_unified`
4. Add environment variables in the dashboard:
   - OPENAI_API_KEY
   - OPENAI_MODEL = gpt-4o-mini
   - OPENAI_VISION_MODEL = gpt-4o
   - ENABLE_AI_VALIDATION = true
5. Deploy

## Verify Installation

After installing Railway CLI:
```bash
railway --version
```

## Common Issues

1. **"railway: command not found"**
   - Make sure to restart your terminal after installation
   - Or run: `source ~/.bashrc` or `source ~/.zshrc`

2. **"No project linked"**
   - Run `railway init` first
   - Then `railway link` if needed

3. **"Permission denied"**
   - Make sure you're logged in: `railway login`