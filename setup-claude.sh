#!/bin/bash

echo "🚀 Claude AI Setup for STR Certified"
echo "===================================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Loading NVM..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"
echo ""

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$VITE_ANTHROPIC_API_KEY" ]; then
    echo "❌ No Anthropic API key found!"
    echo ""
    echo "To set up your API key:"
    echo ""
    echo "1. Get your API key from: https://console.anthropic.com/"
    echo "2. Add it to your .env.local file:"
    echo "   VITE_ANTHROPIC_API_KEY=your_api_key_here"
    echo ""
    echo "3. Or set it temporarily:"
    echo "   export ANTHROPIC_API_KEY=your_api_key_here"
    echo ""
    echo "4. Then run this script again to test Claude"
    echo ""
    exit 1
fi

echo "✅ API key found!"
echo ""

# Test Claude
echo "🧪 Testing Claude AI..."
echo ""

node claude-test.js

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add your API key to .env.local for persistent use"
echo "2. Deploy the claude-analysis Edge Function"
echo "3. Use Claude in your STR Certified application"
echo ""
echo "📖 See CLAUDE_QUICK_START.md for complete instructions" 