# Claude AI Integration for STR Certified

This document outlines the comprehensive Claude AI integration added to the STR Certified platform, providing advanced AI capabilities for property inspection workflows.

## Overview

The Claude AI integration provides three main capabilities:
1. **Photo Analysis** - Analyze property inspection photos for compliance and safety issues
2. **Text Generation** - Generate documentation and analysis text
3. **Code Review** - Review code for security, performance, and best practices

## Architecture

### Components Added

1. **Claude Service** (`src/lib/ai/claude-service.ts`)
   - Core service for Claude AI interactions
   - Handles rate limiting and error management
   - Provides mock responses when SDK is not available

2. **Claude Client** (`src/lib/ai/claude-client.ts`)
   - Client-side integration with Supabase Edge Functions
   - Handles authentication and API calls
   - Includes utility functions for file handling

3. **Claude Edge Function** (`supabase/functions/claude-analysis/index.ts`)
   - Server-side Claude AI processing
   - Handles authentication and rate limiting
   - Processes different analysis types (photo, text, code)

4. **React Hook** (`src/hooks/useClaudeAI.ts`)
   - Easy-to-use React hook for Claude AI functionality
   - Manages loading states and error handling
   - Provides clean API for components

5. **UI Component** (`src/components/ai/ClaudeAnalysisPanel.tsx`)
   - Complete UI for Claude AI interactions
   - Tabbed interface for different analysis types
   - Real-time results display

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk
```

### 2. Environment Variables

Add the following environment variables:

```bash
# .env.local
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# For production (Railway/Railway)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Deploy Edge Function

```bash
# Deploy the Claude analysis function
supabase functions deploy claude-analysis
```

### 4. Database Schema

Ensure the `ai_usage_log` table exists in your Supabase database:

```sql
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  ai_provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(10,6) NOT NULL,
  inspection_id TEXT,
  checklist_item_id TEXT,
  analysis_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Examples

### 1. Using the React Hook

```tsx
import { useClaudeAI } from '@/hooks/useClaudeAI';

function InspectionComponent() {
  const { 
    isLoading, 
    error, 
    result, 
    analyzePhoto, 
    generateText, 
    reviewCode 
  } = useClaudeAI();

  const handlePhotoUpload = async (file: File) => {
    await analyzePhoto(file, 'Analyze this photo for safety compliance');
  };

  const handleTextGeneration = async () => {
    await generateText(
      'Write a summary of the inspection findings',
      'You are an expert property inspector'
    );
  };

  return (
    <div>
      {isLoading && <div>Processing...</div>}
      {error && <div>Error: {error}</div>}
      {result && <div>Result: {JSON.stringify(result)}</div>}
    </div>
  );
}
```

### 2. Using the Service Directly

```tsx
import { createClaudeClient, fileToBase64 } from '@/lib/ai/claude-client';

const claudeClient = createClaudeClient();

// Photo analysis
const analyzePhoto = async (file: File) => {
  const imageBase64 = await fileToBase64(file);
  const result = await claudeClient.analyzeInspectionPhoto({
    imageBase64,
    prompt: 'Analyze this property inspection photo',
    inspectionId: 'inspection-123',
    checklistItemId: 'item-456'
  });
  return result;
};

// Text generation
const generateText = async (prompt: string) => {
  const result = await claudeClient.generateText({
    prompt,
    context: { systemPrompt: 'You are an expert property inspector' }
  });
  return result;
};

// Code review
const reviewCode = async (code: string) => {
  const result = await claudeClient.reviewCode({
    prompt: code,
    context: {
      filePath: 'inspection-component.tsx',
      context: 'React component for property inspection'
    }
  });
  return result;
};
```

### 3. Using the UI Component

```tsx
import { ClaudeAnalysisPanel } from '@/components/ai/ClaudeAnalysisPanel';

function InspectionPage() {
  const handleAnalysisComplete = (result: any) => {
    console.log('Analysis completed:', result);
    // Handle the analysis result
  };

  return (
    <div>
      <h1>Property Inspection</h1>
      <ClaudeAnalysisPanel
        inspectionId="inspection-123"
        checklistItemId="item-456"
        onAnalysisComplete={handleAnalysisComplete}
      />
    </div>
  );
}
```

## API Reference

### Claude Analysis Request

```typescript
interface ClaudeAnalysisRequest {
  imageBase64?: string;        // Required for photo analysis
  prompt: string;              // Required - the prompt or code to analyze
  inspectionId?: string;       // Optional - for tracking
  checklistItemId?: string;    // Optional - for tracking
  context?: Record<string, unknown>; // Optional - additional context
  maxTokens?: number;          // Optional - max tokens (default: 1000)
  temperature?: number;        // Optional - creativity (default: 0.3)
  analysisType: 'photo' | 'text' | 'code'; // Required - type of analysis
}
```

### Claude Analysis Response

```typescript
interface ClaudeAnalysisResponse {
  analysis?: {                 // For photo analysis
    status: 'pass' | 'fail' | 'needs_review';
    confidence: number;
    reasoning: string;
    issues: string[];
    recommendations: string[];
  };
  content?: string;            // For text generation
  review?: {                   // For code review
    score: number;
    issues: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      category: 'security' | 'performance' | 'maintainability' | 'accessibility' | 'type-safety';
      description: string;
      line?: number;
      suggestion?: string;
    }>;
    suggestions: string[];
    summary: string;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata: {
    model: string;
    processingTime: number;
    timestamp: string;
  };
}
```

## Rate Limiting

The integration includes built-in rate limiting:

- **Photo Analysis**: 20 requests per minute
- **Text Generation**: 50 requests per minute  
- **Code Review**: 10 requests per minute

Rate limits are enforced both client-side and server-side.

## Error Handling

The integration provides comprehensive error handling:

1. **Authentication Errors** - User must be logged in
2. **Rate Limit Errors** - Too many requests
3. **Validation Errors** - Invalid input data
4. **API Errors** - Claude API failures
5. **Network Errors** - Connection issues

All errors are logged and provide user-friendly messages.

## Cost Tracking

All Claude AI usage is tracked in the `ai_usage_log` table with:
- User ID
- AI provider (claude)
- Model used
- Token usage
- Cost calculation
- Analysis type
- Timestamp

## Security Considerations

1. **API Key Protection** - API keys are stored server-side only
2. **Authentication Required** - All requests require user authentication
3. **Input Validation** - All inputs are validated before processing
4. **Rate Limiting** - Prevents abuse and controls costs
5. **Error Sanitization** - Sensitive information is not exposed in errors

## Performance Optimization

1. **Client-side Caching** - Rate limiting prevents excessive API calls
2. **Server-side Caching** - Edge function can be extended with caching
3. **Image Optimization** - Images are validated and optimized before processing
4. **Async Processing** - All operations are non-blocking

## Monitoring and Analytics

The integration provides monitoring through:

1. **Usage Logging** - All requests are logged to database
2. **Error Tracking** - Errors are logged with context
3. **Performance Metrics** - Processing times are tracked
4. **Cost Monitoring** - Token usage and costs are calculated

## Troubleshooting

### Common Issues

1. **"Anthropic API key is required"**
   - Ensure `VITE_ANTHROPIC_API_KEY` is set in environment variables

2. **"Rate limit exceeded"**
   - Wait for rate limit window to reset (1 minute)
   - Reduce request frequency

3. **"Image data is required for photo analysis"**
   - Ensure a valid image file is provided
   - Check file type and size limits

4. **"Unauthorized"**
   - Ensure user is logged in
   - Check authentication token

### Debug Mode

Enable debug logging by setting:

```bash
VITE_DEBUG_CLAUDE=true
```

This will log all Claude API requests and responses to the console.

## Future Enhancements

1. **Streaming Responses** - Real-time response streaming
2. **Batch Processing** - Process multiple images at once
3. **Custom Models** - Support for fine-tuned models
4. **Advanced Caching** - Intelligent response caching
5. **Analytics Dashboard** - Usage analytics and insights

## Support

For issues with Claude AI integration:

1. Check the troubleshooting section above
2. Review error logs in Supabase dashboard
3. Verify environment variables are set correctly
4. Ensure Edge Function is deployed and accessible

## License

This Claude AI integration is part of the STR Certified platform and follows the same licensing terms. 