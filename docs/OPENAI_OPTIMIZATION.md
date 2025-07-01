# OpenAI Usage Optimization Guide

This guide provides best practices for cost-effective OpenAI API usage in STR Certified.

## Cost Optimization Strategies

### 1. Efficient Prompt Engineering

Instead of verbose prompts, use concise, structured formats:

```typescript
// ❌ Expensive - Verbose prompt
const expensivePrompt = `
Please analyze this comprehensive inspection report for a vacation rental property.
The report contains detailed information about various aspects of the property...
[200+ words of context]
`;

// ✅ Optimized - Concise prompt
const optimizedPrompt = `
Analyze inspection:
- Type: ${propertyType}
- Pass/Fail: ${passed}/${failed}
- Critical: ${criticalIssues.join(', ')}

Return: Score (1-100), Top 3 issues, Actions
`;
```

### 2. Data Compression

Compress data before sending to API:

```typescript
// Compress inspection data
const compressed = DataCompression.compressInspectionData(inspection);
// Reduces token usage by ~70%
```

### 3. Smart Model Selection

Use appropriate models for different tasks:

| Task | Model | Cost/1K tokens | Use Case |
|------|-------|----------------|----------|
| Simple validation | gpt-3.5-turbo | $0.001 | Basic scoring, lists |
| Complex analysis | gpt-4 | $0.03 | Detailed reports |
| Image analysis | gpt-4-vision | $0.03 + image | Photo inspections |

### 4. Aggressive Caching

Cache results to avoid repeated API calls:

```typescript
// 10-minute cache for validation results
const result = await aiCacheService.withCache(
  cacheKey,
  validateFn,
  600000 // 10 minutes
);
```

### 5. Batch Processing

Group similar requests:

```typescript
// Process multiple items in one request
const batchPrompt = items
  .slice(0, 5) // Limit batch size
  .map(item => `[${item.id}] ${item.data}`)
  .join('\n');
```

## Token Optimization Examples

### Before Optimization
```typescript
// ~500 tokens
const report = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{
    role: "user",
    content: JSON.stringify(fullInspectionData, null, 2) // Full data
  }],
  max_tokens: 2000 // Large response
});
```

### After Optimization
```typescript
// ~150 tokens (70% reduction)
const report = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{
    role: "user",
    content: optimizedPrompt // Compressed data
  }],
  max_tokens: 200 // Limited response
});
```

## Cost Tracking

Monitor your usage with the built-in cost tracker:

```typescript
import { generateCostDashboard } from './openai-cost-tracker';

const dashboard = generateCostDashboard(userId);
console.log(`Today's cost: $${dashboard.today.totalCost.toFixed(2)}`);
console.log(`Forecast (30 days): $${dashboard.forecast.estimatedCost.toFixed(2)}`);
```

## Response Optimization

### 1. Request Specific Formats
```typescript
// Request structured output
const prompt = `
Return JSON:
{
  "score": number,
  "issues": ["max 3"],
  "actions": ["max 3"]
}
`;
```

### 2. Limit Response Length
```typescript
// Use max_tokens to control costs
max_tokens: 200 // Instead of default 4096
```

### 3. Use Response Format
```typescript
// Force JSON responses
response_format: { type: "json_object" }
```

## Implementation Checklist

- [ ] Implement data compression for all API calls
- [ ] Use GPT-3.5-Turbo for simple tasks
- [ ] Set appropriate max_tokens for each operation
- [ ] Enable caching with proper TTL
- [ ] Batch similar requests when possible
- [ ] Monitor costs with tracking dashboard
- [ ] Review and optimize prompts monthly

## Cost Benchmarks

Expected costs per operation:

| Operation | Tokens (avg) | Cost (avg) | Cache Hit Rate |
|-----------|--------------|------------|----------------|
| Validation | 150 | $0.0045 | 80% |
| Condition Assessment | 250 | $0.0075 | 70% |
| Report Generation | 800 | $0.024 | 50% |
| Photo Analysis | 200 | $0.006 | 90% |

## Monitoring & Alerts

Set up cost alerts:

```typescript
const report = costTracker.getCostReport();
if (report.totalCost > 100) {
  console.warn('High API costs detected!');
  // Send alert notification
}
```

## Best Practices

1. **Always compress data** before sending to API
2. **Cache aggressively** - especially for validation
3. **Use cheaper models** when possible
4. **Limit response tokens** to necessary minimum
5. **Batch process** similar requests
6. **Monitor costs daily** to catch issues early
7. **Review prompts monthly** for optimization opportunities

## Example Savings

With optimization, typical cost reductions:

- Inspection Validation: 70% reduction
- Property Assessment: 60% reduction  
- Report Generation: 50% reduction
- Overall: 60-70% cost savings

## Advanced Techniques

### 1. Conditional Processing
```typescript
// Only run expensive analysis when needed
if (CostStrategies.requiresFullAnalysis(inspection)) {
  // Run full analysis
} else {
  // Use cached or simplified analysis
}
```

### 2. Progressive Enhancement
```typescript
// Start with cheap analysis, enhance if needed
const quickAnalysis = await analyzeWithGPT35(data);
if (quickAnalysis.confidence < 0.8) {
  const detailedAnalysis = await analyzeWithGPT4(data);
}
```

### 3. Smart Caching Keys
```typescript
// Cache-friendly keys that ignore volatile data
const key = CostStrategies.generateCacheKey('inspection', {
  propertyType,
  failureCount,
  // Exclude: timestamps, IDs
});
```

## Troubleshooting High Costs

If costs are higher than expected:

1. Check token usage in cost tracker
2. Review prompts for unnecessary verbosity
3. Verify caching is working properly
4. Check for retry loops on errors
5. Ensure rate limiting is active
6. Review model selection logic