#!/bin/bash

# Railway Deployment Script for STR Certified with OpenAI
# Usage: ./railway-deploy.sh

echo "🚀 Deploying STR Certified to Railway with OpenAI Integration"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

echo "📦 Setting up Railway environment variables..."
echo ""

# Core configuration
railway variables set DATABASE_URL="postgresql://postgres:password@hostname:5432/railway"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
railway variables set NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# OpenAI Configuration (using gpt-4o-mini which is available)
railway variables set OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key-here}"
railway variables set OPENAI_MODEL="gpt-4o-mini"
railway variables set OPENAI_VISION_MODEL="gpt-4o"
railway variables set ENABLE_AI_VALIDATION="true"

echo "✅ Environment variables configured"
echo ""

echo "🔧 Deploying application..."
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Post-deployment checklist:"
echo "   1. Update DATABASE_URL with your actual PostgreSQL connection string"
echo "   2. Update NEXTAUTH_URL with your Railway app URL"
echo "   3. Run database migrations: railway run npm run db:migrate"
echo "   4. Seed database (optional): railway run npm run db:seed"
echo ""
echo "🔍 View logs: railway logs"
echo "🌐 Open app: railway open"