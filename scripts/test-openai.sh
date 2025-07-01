#!/bin/bash

# Test OpenAI API Connection Script
# Usage: ./scripts/test-openai.sh

echo "🔧 Testing OpenAI API Connection..."
echo ""

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env.local"
else
    echo "⚠️  .env.local not found, using current environment"
fi

# Check if API key exists
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not found in environment variables"
    echo "Please set OPENAI_API_KEY in your .env.local file or environment"
    exit 1
fi

echo "✅ API Key found: ${OPENAI_API_KEY:0:10}...${OPENAI_API_KEY: -4}"
echo "📦 Using model: ${OPENAI_MODEL:-gpt-4}"
echo ""

# Test connection with curl
echo "🚀 Testing API connection..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "'"${OPENAI_MODEL:-gpt-4}"'",
    "messages": [{"role": "user", "content": "Test connection. Reply with OK."}],
    "max_tokens": 10,
    "temperature": 0
  }')

# Extract HTTP status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📡 HTTP Status: $HTTP_CODE"
echo ""

# Check response
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Connection successful!"
    echo ""
    echo "📝 Response:"
    echo "$BODY" | jq -r '.choices[0].message.content' 2>/dev/null || echo "$BODY"
    echo ""
    
    # Extract token usage if available
    TOKENS=$(echo "$BODY" | jq -r '.usage.total_tokens' 2>/dev/null)
    if [ ! -z "$TOKENS" ] && [ "$TOKENS" != "null" ]; then
        COST=$(echo "scale=4; $TOKENS * 0.03 / 1000" | bc)
        echo "💰 Tokens used: $TOKENS (~\$$COST)"
    fi
else
    echo "❌ Connection failed!"
    echo ""
    
    case "$HTTP_CODE" in
        401)
            echo "🔑 Authentication failed. Please check your API key."
            ;;
        404)
            echo "📦 Model not found. Make sure you have access to ${OPENAI_MODEL:-gpt-4}."
            ;;
        429)
            echo "⏱️  Rate limit exceeded. Please try again later."
            ;;
        *)
            echo "Error details:"
            echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
            ;;
    esac
    exit 1
fi

echo ""
echo "🧪 Testing JSON response mode..."

JSON_RESPONSE=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "'"${OPENAI_MODEL:-gpt-4}"'",
    "messages": [{"role": "user", "content": "Return JSON: {\"status\": \"ok\", \"test\": true}"}],
    "max_tokens": 50,
    "response_format": {"type": "json_object"}
  }')

JSON_STATUS=$(echo "$JSON_RESPONSE" | jq -r '.choices[0].message.content' 2>/dev/null | jq -r '.status' 2>/dev/null)

if [ "$JSON_STATUS" = "ok" ]; then
    echo "✅ JSON mode working correctly"
else
    echo "⚠️  JSON mode test inconclusive"
fi

echo ""
echo "✅ All tests completed!"
echo ""
echo "📋 Configuration Summary:"
echo "   Model: ${OPENAI_MODEL:-gpt-4}"
echo "   Vision Model: ${OPENAI_VISION_MODEL:-gpt-4-vision-preview}"
echo "   AI Validation: ${ENABLE_AI_VALIDATION:-false}"
echo "   Organization: ${OPENAI_ORG_ID:-Not set}"