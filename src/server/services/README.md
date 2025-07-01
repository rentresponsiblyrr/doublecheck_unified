# STR Certified - OpenAI Integration

This directory contains the OpenAI API integration for STR Certified's AI-powered features.

## Services

### 1. OpenAI Service (`openai.service.ts`)
Core service for interacting with OpenAI API:
- Text generation using GPT-4
- Image analysis using GPT-4 Vision
- Content moderation
- Market insights generation

### 2. AI Validation Service (`aiValidation.service.ts`)
Implements AI-powered validation features:
- Inspection report validation
- Property condition assessment
- Checklist validation
- Photo analysis for maintenance issues
- Market benchmarking

### 3. AI Cache Service (`aiCache.service.ts`)
Provides caching and rate limiting:
- In-memory caching with TTL
- Rate limiting per user (60 requests/minute)
- Automatic cache cleanup
- Cache invalidation utilities

## Configuration

Add these environment variables to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-organization-id (optional)
OPENAI_MODEL_TEXT=gpt-4
OPENAI_MODEL_VISION=gpt-4-vision-preview

# Feature Flags
ENABLE_AI_VALIDATION=true
```

## Usage Examples

### Validate an Inspection

```typescript
import { aiValidationService } from '@/server/services';

const validation = await aiValidationService.validateInspection(
  {
    id: 'inspection-id',
    propertyId: 'property-id',
    checklistId: 'checklist-id',
    items: [...checklistItems]
  },
  propertyDetails
);
```

### Generate Inspection Report

```typescript
import { openAIService } from '@/server/services';

const report = await openAIService.generateInspectionReport(
  propertyData,
  checklistData,
  userId // for rate limiting
);
```

### Analyze Property Photos

```typescript
import { aiValidationService } from '@/server/services';

const analysis = await aiValidationService.analyzePropertyPhotos([
  { url: 'https://...', category: 'exterior' },
  { url: 'https://...', category: 'kitchen' }
]);
```

## Features

1. **Inspection Validation**
   - Completeness scoring
   - Missing item detection
   - Compliance checking
   - Improvement suggestions

2. **Property Condition Assessment**
   - Overall condition score
   - Category-based scoring (structural, interior, exterior, systems)
   - Maintenance recommendations
   - Priority issue identification

3. **Market Insights**
   - Location-based analysis
   - Occupancy rate benchmarks
   - Pricing recommendations
   - Seasonal patterns
   - Competition analysis

4. **Photo Analysis**
   - Damage detection
   - Cleanliness assessment
   - Safety concern identification
   - Maintenance need detection

## Performance Optimization

- **Caching**: Results are cached for 10-30 minutes depending on the operation
- **Rate Limiting**: 60 requests per minute per user
- **Batch Processing**: Photo analysis limited to 10 photos per request
- **Efficient Prompts**: Optimized prompt engineering for cost reduction

## Error Handling

All services include comprehensive error handling:
- API failures gracefully degrade
- Validation continues even if AI is unavailable
- Clear error messages for debugging
- Fallback responses for critical operations

## Security

- API keys stored in environment variables
- Content moderation for all generated text
- No sensitive data sent to OpenAI
- Rate limiting prevents abuse

## Future Enhancements

- Streaming responses for long reports
- Fine-tuned models for STR-specific tasks
- Multi-language support
- Advanced analytics dashboard
- Predictive maintenance scheduling