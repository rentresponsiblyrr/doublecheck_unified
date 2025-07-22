# Claude AI Quick Start Guide

## ✅ Installation Complete!

The Claude AI SDK has been successfully installed in your STR Certified project.

## 🚀 Next Steps

### 1. Get Your Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-`)

### 2. Set Up Environment Variables

Create a `.env.local` file in your project root and add:

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

### 3. Test the Installation

Run the test script to verify everything works:

```bash
# Load Node.js and run test
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && node test-claude.js
```

### 4. Use Claude in Your App

#### Option A: Use the Example Component

```tsx
import { ClaudeIntegrationExample } from '@/components/ai/ClaudeIntegrationExample';

function YourPage() {
  return (
    <ClaudeIntegrationExample 
      inspectionId="your-inspection-id"
      onAnalysisComplete={(result) => console.log(result)}
    />
  );
}
```

#### Option B: Use the Service Directly

```tsx
import { createClaudeClient } from '@/lib/ai/claude-client';

const client = createClaudeClient();

// Text generation
const result = await client.generateText({
  prompt: 'Write a property inspection summary',
  context: { systemPrompt: 'You are an expert property inspector' }
});
```

#### Option C: Use the React Hook

```tsx
import { useClaudeAI } from '@/hooks/useClaudeAI';

function MyComponent() {
  const { isLoading, error, result, generateText } = useClaudeAI();
  
  const handleGenerate = async () => {
    await generateText('Write a safety compliance report');
  };
  
  return (
    <div>
      <button onClick={handleGenerate}>Generate Report</button>
      {isLoading && <div>Generating...</div>}
      {result && <div>{result.content}</div>}
    </div>
  );
}
```

## 🎯 Available Features

### 1. Photo Analysis
- Analyze property inspection photos for compliance
- Identify safety issues and provide recommendations
- Confidence scoring and detailed reasoning

### 2. Text Generation
- Generate inspection documentation
- Create reports and summaries
- Customizable system prompts

### 3. Code Review
- Review React/TypeScript code for best practices
- Security, performance, and accessibility analysis
- Detailed issue reporting with suggestions

## 🔧 Configuration

### Environment Variables

```bash
# Required
VITE_ANTHROPIC_API_KEY=your_api_key_here

# Optional
VITE_DEBUG_CLAUDE=true  # Enable debug logging
```

### Rate Limits

- **Photo Analysis**: 20 requests per minute
- **Text Generation**: 50 requests per minute
- **Code Review**: 10 requests per minute

## 📚 Documentation

- **Complete Guide**: `docs/CLAUDE_INTEGRATION.md`
- **Setup Summary**: `CLAUDE_SETUP_SUMMARY.md`
- **Example Component**: `src/components/ai/ClaudeIntegrationExample.tsx`

## 🚨 Troubleshooting

### Common Issues

1. **"No Anthropic API key found"**
   - Set `VITE_ANTHROPIC_API_KEY` in your `.env.local` file

2. **"Rate limit exceeded"**
   - Wait for rate limit window to reset (1 minute)
   - Reduce request frequency

3. **"Unauthorized"**
   - Check your API key is correct
   - Verify your Anthropic account has credits

4. **Node.js not found**
   - Run: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`

### Debug Mode

Enable debug logging by setting:
```bash
VITE_DEBUG_CLAUDE=true
```

## 🎉 You're Ready!

Your STR Certified project now has full Claude AI integration! 

- ✅ Claude SDK installed
- ✅ Services and components ready
- ✅ Documentation complete
- ⏳ Just need your API key to start using

Get your API key from [Anthropic Console](https://console.anthropic.com/) and start building amazing AI-powered features for your property inspection platform! 