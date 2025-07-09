# 🤖 AI PROMPT TEMPLATES FOR STR CERTIFIED

*Standard prompt templates for common development tasks and AI-assisted coding*

## **🎯 PROMPT PHILOSOPHY**

Effective AI prompts are the key to productive AI-assisted development. Our prompt templates are designed to:

- **Maximize Clarity** - Clear, specific instructions that minimize ambiguity
- **Ensure Consistency** - Standardized approaches across all AI interactions
- **Include Context** - Provide relevant background information and constraints
- **Optimize for Quality** - Generate production-ready code that follows our standards
- **Facilitate Learning** - Include explanations that help developers understand the output

## **📋 PROMPT STRUCTURE**

### **Standard Prompt Format**
```
[ROLE] - Define the AI's role and expertise level
[CONTEXT] - Provide relevant background information
[TASK] - Clearly define what needs to be accomplished
[CONSTRAINTS] - List any limitations or requirements
[OUTPUT FORMAT] - Specify the desired output format
[EXAMPLES] - Include relevant examples when helpful
```

### **Quality Indicators**
Every prompt should include these quality indicators:
- **Code Quality**: Production-ready, well-documented code
- **Testing**: Include tests where applicable
- **Performance**: Consider performance implications
- **Security**: Follow security best practices
- **Accessibility**: Ensure WCAG compliance
- **Mobile**: Optimize for mobile devices

## **🔧 COMPONENT DEVELOPMENT TEMPLATES**

### **Template 1: Create New React Component**

```
**ROLE:** You are a senior React developer specializing in TypeScript and modern React patterns.

**CONTEXT:** 
- Project: STR Certified - AI-powered inspection platform
- Tech Stack: React 18, TypeScript, Tailwind CSS, Zustand, React Query
- Architecture: Domain-driven design with inspection, audit, and property domains
- Standards: Follow our component patterns from COMPONENT_PATTERNS.md

**TASK:** Create a new React component for [COMPONENT_NAME] that [COMPONENT_PURPOSE].

**CONSTRAINTS:**
- Use TypeScript with strict type checking
- Follow our accessibility guidelines (WCAG 2.1 AA)
- Implement proper error handling and loading states
- Optimize for mobile devices (touch targets 44px minimum)
- Use Tailwind CSS for styling
- Include proper ARIA attributes
- Follow our naming conventions (PascalCase for components)

**OUTPUT FORMAT:**
1. Component interface definition
2. Component implementation with JSDoc comments
3. Usage example
4. Basic unit tests
5. Accessibility considerations
6. Performance optimizations applied

**EXAMPLE:**
```typescript
/**
 * InspectionCard - Display inspection summary with actions
 * 
 * @param inspection - The inspection data to display
 * @param onEdit - Callback when user clicks edit
 * @param onDelete - Callback when user clicks delete
 */
interface InspectionCardProps {
  inspection: Inspection;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({ ... }) => {
  // Implementation
};
```

**ADDITIONAL REQUIREMENTS:**
- Component must be memoized if it receives complex props
- Include proper error boundaries
- Implement keyboard navigation
- Add loading skeleton variant
- Consider offline functionality
```

### **Template 2: Create Custom Hook**

```
**ROLE:** You are a senior React developer specializing in custom hooks and state management.

**CONTEXT:**
- Project: STR Certified inspection platform
- State Management: Zustand for global state, React Query for server state
- Patterns: Follow our custom hook patterns from COMMON_PATTERNS.md
- Error Handling: Use Result pattern for consistent error handling

**TASK:** Create a custom hook `use[HOOK_NAME]` that [HOOK_PURPOSE].

**CONSTRAINTS:**
- Use TypeScript with proper type definitions
- Implement proper cleanup (useEffect cleanup functions)
- Handle loading and error states
- Provide optimistic updates where appropriate
- Include proper dependency arrays
- Follow our error handling patterns

**OUTPUT FORMAT:**
1. Hook interface definition
2. Hook implementation with JSDoc comments
3. Usage examples in components
4. Unit tests for the hook
5. Error handling scenarios
6. Performance considerations

**EXAMPLE:**
```typescript
/**
 * useInspections - Manage inspection data with caching and optimistic updates
 * 
 * @param filters - Optional filters for inspection data
 * @returns Inspection data, loading state, and mutation functions
 */
export const useInspections = (filters?: InspectionFilters) => {
  // Implementation
};
```

**ADDITIONAL REQUIREMENTS:**
- Hook must handle race conditions
- Include proper error recovery
- Implement request deduplication
- Add offline support where applicable
- Consider memory leak prevention
```

### **Template 3: Create Service Layer**

```
**ROLE:** You are a senior software architect specializing in service layer design and API integration.

**CONTEXT:**
- Project: STR Certified with Supabase backend
- Architecture: Domain-driven design with clean service layers
- Error Handling: Use Result pattern for consistent error handling
- Security: All inputs must be validated and sanitized

**TASK:** Create a service class `[SERVICE_NAME]Service` that [SERVICE_PURPOSE].

**CONSTRAINTS:**
- Use TypeScript with comprehensive type definitions
- Implement proper error handling with Result pattern
- Include input validation using Zod schemas
- Add proper logging and monitoring
- Handle network failures gracefully
- Follow our security guidelines

**OUTPUT FORMAT:**
1. Service interface definition
2. Service class implementation
3. Error types and handling
4. Input validation schemas
5. Usage examples
6. Unit tests with mocking
7. Integration test examples

**EXAMPLE:**
```typescript
interface InspectionService {
  create(data: CreateInspectionRequest): Promise<Result<Inspection, InspectionError>>;
  update(id: string, data: UpdateInspectionRequest): Promise<Result<Inspection, InspectionError>>;
  delete(id: string): Promise<Result<void, InspectionError>>;
}

class InspectionServiceImpl implements InspectionService {
  // Implementation
}
```

**ADDITIONAL REQUIREMENTS:**
- Service must be easily mockable for testing
- Include proper authentication handling
- Implement request/response logging
- Add performance monitoring
- Consider caching strategies
```

## **🧪 TESTING TEMPLATES**

### **Template 4: Create Unit Tests**

```
**ROLE:** You are a senior QA engineer specializing in comprehensive testing strategies.

**CONTEXT:**
- Testing Framework: Vitest with React Testing Library
- Standards: Follow our testing patterns from TESTING_STANDARDS.md
- Coverage: Aim for 80% code coverage minimum
- Test Types: Unit, integration, accessibility, and performance tests

**TASK:** Create comprehensive unit tests for [COMPONENT_OR_FUNCTION] that [TEST_PURPOSE].

**CONSTRAINTS:**
- Use React Testing Library for component testing
- Test user interactions, not implementation details
- Include accessibility testing with jest-axe
- Test error scenarios and edge cases
- Mock external dependencies appropriately
- Follow AAA pattern (Arrange, Act, Assert)

**OUTPUT FORMAT:**
1. Test setup and mocking
2. Component/function rendering tests
3. User interaction tests
4. Error handling tests
5. Accessibility tests
6. Performance tests
7. Edge case coverage

**EXAMPLE:**
```typescript
describe('InspectionCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('renders inspection information correctly', () => {
      // Test implementation
    });
  });
  
  describe('User Interactions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      // Test implementation
    });
  });
});
```

**ADDITIONAL REQUIREMENTS:**
- Include snapshot tests for UI components
- Test keyboard navigation
- Verify ARIA attributes
- Test responsive behavior
- Check performance metrics
```

### **Template 5: Create Integration Tests**

```
**ROLE:** You are a senior QA engineer specializing in integration testing and API testing.

**CONTEXT:**
- Testing Framework: Vitest with MSW for API mocking
- Integration Points: React components with API services
- Real-world Scenarios: Test complete user workflows

**TASK:** Create integration tests for [FEATURE_OR_WORKFLOW] that [TEST_PURPOSE].

**CONSTRAINTS:**
- Use MSW (Mock Service Worker) for API mocking
- Test complete user workflows end-to-end
- Include error scenarios and network failures
- Test optimistic updates and rollbacks
- Verify loading states and error handling
- Test offline functionality where applicable

**OUTPUT FORMAT:**
1. MSW server setup and handlers
2. Test environment configuration
3. Happy path integration tests
4. Error scenario tests
5. Network failure tests
6. Offline behavior tests
7. Performance integration tests

**EXAMPLE:**
```typescript
describe('Inspection Creation Flow', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  
  it('creates inspection successfully', async () => {
    // Test implementation
  });
  
  it('handles API errors gracefully', async () => {
    // Test implementation
  });
});
```

**ADDITIONAL REQUIREMENTS:**
- Test data consistency across components
- Verify cache invalidation
- Test real-time updates
- Include performance assertions
- Test security scenarios
```

## **🚀 FEATURE DEVELOPMENT TEMPLATES**

### **Template 6: Implement New Feature**

```
**ROLE:** You are a senior full-stack developer with expertise in React, TypeScript, and modern web development.

**CONTEXT:**
- Project: STR Certified inspection platform
- Architecture: Domain-driven design with React frontend and Supabase backend
- Standards: Follow all our coding standards and patterns
- User Experience: Mobile-first, accessible, and performant

**TASK:** Implement a new feature for [FEATURE_NAME] that [FEATURE_PURPOSE].

**CONSTRAINTS:**
- Follow domain-driven design principles
- Create components in the appropriate domain folder
- Implement proper state management (Zustand + React Query)
- Include comprehensive error handling
- Add proper TypeScript types
- Ensure WCAG 2.1 AA accessibility compliance
- Optimize for mobile devices
- Include proper testing

**OUTPUT FORMAT:**
1. Feature architecture overview
2. Type definitions
3. Component implementations
4. Service layer implementations
5. State management integration
6. Testing suite
7. Documentation updates
8. Performance considerations

**EXAMPLE:**
```
Feature: Photo Comparison Tool
Domain: inspection
Components: PhotoComparison, PhotoViewer, ComparisonResults
Services: PhotoAnalysisService, ComparisonService
State: usePhotoComparison hook
Tests: Unit, integration, accessibility
```

**ADDITIONAL REQUIREMENTS:**
- Create todo list for implementation phases
- Consider API changes needed
- Plan for incremental rollout
- Include analytics tracking
- Consider internationalization
```

### **Template 7: Fix Bug or Issue**

```
**ROLE:** You are a senior developer specializing in debugging and issue resolution.

**CONTEXT:**
- Project: STR Certified with existing codebase
- Issue: [ISSUE_DESCRIPTION]
- Debugging: Follow our debugging guide from DEBUGGING_GUIDE.md
- Standards: Maintain all existing code quality standards

**TASK:** Debug and fix the issue where [ISSUE_DESCRIPTION].

**CONSTRAINTS:**
- Identify root cause, not just symptoms
- Ensure fix doesn't break existing functionality
- Add tests to prevent regression
- Update documentation if needed
- Consider performance implications
- Follow our error handling patterns

**OUTPUT FORMAT:**
1. Root cause analysis
2. Fix implementation
3. Regression tests
4. Performance impact assessment
5. Documentation updates
6. Deployment considerations

**EXAMPLE:**
```
Issue: Inspection photos not loading on mobile devices
Root Cause: Image optimization service not handling mobile viewport sizes
Fix: Update image service to generate responsive images
Tests: Add mobile-specific image loading tests
```

**ADDITIONAL REQUIREMENTS:**
- Verify fix in multiple environments
- Check for similar issues elsewhere
- Update monitoring/alerting if needed
- Consider user communication
- Plan for hotfix deployment
```

## **🛠️ REFACTORING TEMPLATES**

### **Template 8: Refactor Existing Code**

```
**ROLE:** You are a senior developer specializing in code refactoring and technical debt reduction.

**CONTEXT:**
- Project: STR Certified with evolving codebase
- Target: [CODE_TO_REFACTOR]
- Goals: Improve maintainability, performance, and code quality
- Standards: Follow all our coding standards

**TASK:** Refactor [CODE_TO_REFACTOR] to [REFACTORING_GOAL].

**CONSTRAINTS:**
- Maintain existing functionality (no breaking changes)
- Improve code readability and maintainability
- Enhance performance where possible
- Add proper TypeScript types
- Include comprehensive tests
- Follow our architectural patterns

**OUTPUT FORMAT:**
1. Current code analysis
2. Refactoring plan
3. Step-by-step implementation
4. Before/after comparison
5. Test coverage improvements
6. Performance improvements
7. Documentation updates

**EXAMPLE:**
```
Refactoring: Convert class component to functional component with hooks
Before: InspectionFormClass (180 lines, complex state management)
After: InspectionForm (120 lines, custom hooks, better separation)
Benefits: Better testability, improved performance, modern patterns
```

**ADDITIONAL REQUIREMENTS:**
- Ensure backward compatibility
- Update all related tests
- Check for performance improvements
- Update documentation
- Consider incremental refactoring
```

### **Template 9: Performance Optimization**

```
**ROLE:** You are a senior performance engineer specializing in React and web performance optimization.

**CONTEXT:**
- Project: STR Certified with performance targets
- Target: [PERFORMANCE_ISSUE]
- Goals: Meet our performance standards from PERFORMANCE_STANDARDS.md
- Metrics: Core Web Vitals, bundle size, runtime performance

**TASK:** Optimize [PERFORMANCE_ISSUE] to achieve [PERFORMANCE_GOAL].

**CONSTRAINTS:**
- Maintain existing functionality
- Follow our performance standards
- Consider mobile device limitations
- Ensure accessibility is not compromised
- Include performance monitoring
- Provide measurable improvements

**OUTPUT FORMAT:**
1. Performance analysis (before metrics)
2. Optimization strategy
3. Implementation details
4. Performance monitoring setup
5. After metrics and comparison
6. Testing for performance regressions
7. Documentation updates

**EXAMPLE:**
```
Optimization: Reduce bundle size for inspection module
Before: 450KB initial bundle, 3.2s load time
Target: 200KB initial bundle, 1.8s load time
Strategy: Code splitting, lazy loading, tree shaking
After: 180KB initial bundle, 1.5s load time
```

**ADDITIONAL REQUIREMENTS:**
- Use performance profiling tools
- Test on various devices/networks
- Monitor long-term performance
- Update performance budgets
- Consider user experience impact
```

## **📚 DOCUMENTATION TEMPLATES**

### **Template 10: Technical Documentation**

```
**ROLE:** You are a senior technical writer specializing in developer documentation.

**CONTEXT:**
- Project: STR Certified with comprehensive documentation needs
- Audience: Current and future developers working on the project
- Standards: Follow our documentation standards

**TASK:** Create technical documentation for [FEATURE_OR_COMPONENT] that [DOCUMENTATION_PURPOSE].

**CONSTRAINTS:**
- Write clear, concise, and accurate documentation
- Include code examples and usage patterns
- Provide troubleshooting guidance
- Consider different skill levels
- Include visual aids where helpful
- Keep documentation up-to-date

**OUTPUT FORMAT:**
1. Overview and purpose
2. Prerequisites and setup
3. API/Interface documentation
4. Usage examples
5. Common patterns and best practices
6. Troubleshooting guide
7. Related resources

**EXAMPLE:**
```
# Photo Capture Component

## Overview
The PhotoCapture component provides mobile-optimized camera functionality...

## Installation
```typescript
import { PhotoCapture } from '@/components/PhotoCapture';
```

## Usage
```typescript
<PhotoCapture
  onCapture={handleCapture}
  referenceImage={referenceImage}
  quality={0.8}
/>
```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onCapture | function | - | Callback when photo is captured |
```

**ADDITIONAL REQUIREMENTS:**
- Include accessibility considerations
- Add performance notes
- Provide migration guides
- Include version history
- Add search-friendly content
```

## **🔍 CODE REVIEW TEMPLATES**

### **Template 11: Code Review Request**

```
**ROLE:** You are a senior developer preparing code for review.

**CONTEXT:**
- Project: STR Certified with high code quality standards
- Review Process: Follow our code review guidelines from CODE_REVIEW.md
- Changes: [DESCRIPTION_OF_CHANGES]

**TASK:** Prepare a comprehensive code review request for [PULL_REQUEST_CHANGES].

**CONSTRAINTS:**
- Provide clear description of changes
- Include testing evidence
- Highlight potential risks
- Reference related issues/tickets
- Include deployment considerations
- Follow our PR template

**OUTPUT FORMAT:**
1. Change summary
2. Testing performed
3. Performance impact
4. Security considerations
5. Accessibility verification
6. Deployment notes
7. Review focus areas

**EXAMPLE:**
```
## Summary
Added photo compression feature to reduce upload sizes by 60% while maintaining quality.

## Changes Made
- Added `ImageOptimizationService` with compression algorithms
- Updated `PhotoCapture` component to use compression
- Added compression quality settings to user preferences

## Testing
- ✅ Unit tests for compression service (95% coverage)
- ✅ Integration tests for photo upload flow
- ✅ Performance testing on various devices
- ✅ Accessibility testing with screen readers

## Performance Impact
- 60% reduction in upload size
- 40% faster upload times
- Minimal CPU impact on compression

## Security Considerations
- Input validation for compression parameters
- File type validation maintained
- No sensitive data exposure

## Deployment Notes
- Feature flag: `enable_photo_compression`
- Backward compatible with existing photos
- Requires cache invalidation for photo service
```

**ADDITIONAL REQUIREMENTS:**
- Include before/after screenshots
- Provide rollback plan
- Test on multiple devices
- Verify browser compatibility
- Check for breaking changes
```

### **Template 12: Code Review Response**

```
**ROLE:** You are a senior developer responding to code review feedback.

**CONTEXT:**
- Project: STR Certified with constructive code review culture
- Review Feedback: [FEEDBACK_RECEIVED]
- Goal: Address all feedback professionally and thoroughly

**TASK:** Respond to code review feedback for [PULL_REQUEST] addressing [FEEDBACK_POINTS].

**CONSTRAINTS:**
- Address all feedback points
- Provide clear explanations for decisions
- Make requested changes or explain why not
- Maintain professional tone
- Update tests if needed
- Update documentation if changed

**OUTPUT FORMAT:**
1. Feedback acknowledgment
2. Changes made
3. Explanations for decisions
4. Additional testing performed
5. Documentation updates
6. Follow-up actions needed

**EXAMPLE:**
```
## Feedback Response

### @reviewer1: "Consider memoizing the expensive calculation in line 45"
**Response:** Good catch! Added `useMemo` to the calculation. This reduced re-renders by 40% in testing.
**Changes:** Updated `calculateCompletionPercentage` with proper memoization and dependencies.

### @reviewer2: "Missing error handling for API failure"
**Response:** Added comprehensive error handling with user-friendly messages.
**Changes:** 
- Added try-catch blocks around API calls
- Implemented fallback UI for error states
- Added error logging for debugging

### @reviewer3: "Accessibility concern with color-only status indication"
**Response:** Added icons and text labels alongside colors for better accessibility.
**Changes:**
- Added status icons to all status indicators
- Included screen reader text for status changes
- Tested with NVDA and VoiceOver

## Additional Changes
- Updated unit tests to cover new error scenarios
- Added JSDoc comments for new functions
- Updated README with new configuration options
```

**ADDITIONAL REQUIREMENTS:**
- Test all changes thoroughly
- Update PR description if needed
- Verify no regressions introduced
- Check code style consistency
- Update related documentation
```

## **🚨 EMERGENCY RESPONSE TEMPLATES**

### **Template 13: Hotfix Development**

```
**ROLE:** You are a senior developer handling a critical production issue.

**CONTEXT:**
- Project: STR Certified with production system down/degraded
- Issue: [CRITICAL_ISSUE_DESCRIPTION]
- Urgency: High priority fix needed immediately
- Constraints: Minimal testing time, high risk

**TASK:** Develop a hotfix for [CRITICAL_ISSUE] that [HOTFIX_PURPOSE].

**CONSTRAINTS:**
- Minimal, surgical change only
- Preserve all existing functionality
- Include basic testing
- Provide rollback plan
- Consider immediate deployment
- Document thoroughly for post-incident review

**OUTPUT FORMAT:**
1. Issue analysis
2. Minimal fix implementation
3. Risk assessment
4. Testing performed
5. Rollback plan
6. Deployment procedure
7. Monitoring plan

**EXAMPLE:**
```
## Critical Issue
Photo uploads failing for 100% of users due to CORS policy change.

## Root Cause
Recent CDN configuration change blocked cross-origin requests.

## Hotfix
Update CORS headers in photo upload service to allow requests from all subdomains.

## Changes
- Added wildcard subdomain support: `*.doublecheckverified.com`
- Updated CSP headers to match new CORS policy

## Testing
- ✅ Manual testing on staging environment
- ✅ Verified photo upload works from all domains
- ✅ Confirmed no security regression

## Rollback Plan
- Revert to previous CORS configuration
- Rollback takes 2 minutes via configuration update

## Deployment
1. Deploy to staging first
2. Verify functionality
3. Deploy to production
4. Monitor error rates for 30 minutes
```

**ADDITIONAL REQUIREMENTS:**
- Notify stakeholders of timeline
- Set up enhanced monitoring
- Plan for post-incident review
- Document lessons learned
- Consider long-term solution
```

### **Template 14: Security Issue Response**

```
**ROLE:** You are a senior security engineer responding to a security vulnerability.

**CONTEXT:**
- Project: STR Certified with security-sensitive user data
- Issue: [SECURITY_VULNERABILITY_DESCRIPTION]
- Severity: [SEVERITY_LEVEL]
- Exposure: [POTENTIAL_IMPACT]

**TASK:** Address security vulnerability [VULNERABILITY_ID] that [SECURITY_ISSUE].

**CONSTRAINTS:**
- Immediate containment required
- Minimal functionality disruption
- Comprehensive security testing
- Coordinate with security team
- Follow incident response procedures
- Document all actions taken

**OUTPUT FORMAT:**
1. Vulnerability assessment
2. Immediate containment measures
3. Security fix implementation
4. Security testing performed
5. Impact assessment
6. Communication plan
7. Prevention measures

**EXAMPLE:**
```
## Security Vulnerability
SQL injection vulnerability in inspection search endpoint allowing data access.

## Severity: Critical
- CVSS Score: 9.1
- Potential Impact: Full database access
- Affected Users: All users with search functionality

## Immediate Actions
1. Disabled search endpoint (10:30 AM)
2. Blocked suspicious IP addresses
3. Initiated security audit of all endpoints
4. Notified security team and stakeholders

## Fix Implementation
- Replaced string concatenation with parameterized queries
- Added input validation using Zod schemas
- Implemented SQL injection protection middleware
- Added rate limiting to search endpoints

## Testing
- ✅ Automated security scan passed
- ✅ Manual penetration testing completed
- ✅ Code review by security team
- ✅ Verified no other similar vulnerabilities

## Rollout Plan
1. Deploy fix to staging
2. Security team verification
3. Gradual rollout to production
4. Monitor for 24 hours
```

**ADDITIONAL REQUIREMENTS:**
- Coordinate with legal team if needed
- Prepare customer communication
- Update security monitoring
- Plan security training
- Review all similar code patterns
```

## **📊 ANALYTICS & MONITORING TEMPLATES**

### **Template 15: Analytics Implementation**

```
**ROLE:** You are a senior developer specializing in analytics and user behavior tracking.

**CONTEXT:**
- Project: STR Certified requiring user behavior insights
- Goal: Implement tracking for [ANALYTICS_PURPOSE]
- Privacy: Follow GDPR and privacy regulations
- Tools: PostHog, custom analytics

**TASK:** Implement analytics tracking for [FEATURE_OR_BEHAVIOR] to [ANALYTICS_GOAL].

**CONSTRAINTS:**
- Respect user privacy and consent
- Implement proper data anonymization
- Follow our privacy guidelines
- Include performance considerations
- Provide actionable insights
- Ensure GDPR compliance

**OUTPUT FORMAT:**
1. Analytics strategy
2. Event definitions
3. Implementation code
4. Privacy considerations
5. Testing approach
6. Dashboard setup
7. Reporting plan

**EXAMPLE:**
```
## Analytics Strategy
Track photo capture success rates and user interactions to optimize the photo capture flow.

## Events to Track
- `photo_capture_started`: User initiated photo capture
- `photo_capture_completed`: Photo successfully captured
- `photo_capture_failed`: Photo capture failed with error
- `photo_retake_requested`: User requested to retake photo

## Implementation
```typescript
// Analytics service
export const analytics = {
  trackPhotoCaptureStarted: (context: PhotoCaptureContext) => {
    track('photo_capture_started', {
      inspection_id: context.inspectionId,
      checklist_item_id: context.checklistItemId,
      device_type: getDeviceType(),
      camera_type: context.cameraType
    });
  },
  // ... other events
};
```

## Privacy Considerations
- No PII in events
- User consent required
- Data anonymization applied
- Retention policy: 90 days
```

**ADDITIONAL REQUIREMENTS:**
- Create analytics dashboard
- Set up alerts for anomalies
- Document data collection
- Test on various devices
- Validate data accuracy
```

## **🎯 OPTIMIZATION TEMPLATES**

### **Template 16: SEO Optimization**

```
**ROLE:** You are a senior developer specializing in SEO and web performance.

**CONTEXT:**
- Project: STR Certified with public-facing pages
- Goal: Improve search engine visibility for [TARGET_PAGES]
- Requirements: Maintain performance and accessibility
- Target: [SEO_GOALS]

**TASK:** Implement SEO optimizations for [PAGE_OR_FEATURE] to [SEO_OBJECTIVE].

**CONSTRAINTS:**
- Maintain existing functionality
- Follow accessibility guidelines
- Ensure fast page load times
- Include proper structured data
- Implement responsive design
- Follow SEO best practices

**OUTPUT FORMAT:**
1. SEO audit results
2. Meta tag optimization
3. Structured data implementation
4. Performance improvements
5. Content optimization
6. Technical SEO fixes
7. Monitoring setup

**EXAMPLE:**
```
## SEO Audit Results
- Missing meta descriptions on 60% of pages
- No structured data for inspection listings
- Poor mobile performance scores
- Missing canonical URLs

## Optimizations Implemented
1. Dynamic meta tags based on content
2. JSON-LD structured data for inspections
3. Improved mobile Core Web Vitals
4. Added canonical URLs
5. Optimized image alt texts

## Structured Data
```typescript
const inspectionStructuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Property Inspection",
  "description": "Professional property inspection services",
  "provider": {
    "@type": "Organization",
    "name": "STR Certified"
  }
};
```

## Performance Improvements
- 40% faster page load times
- Improved LCP from 3.2s to 1.8s
- Enhanced mobile usability scores
```

**ADDITIONAL REQUIREMENTS:**
- Set up Google Search Console
- Monitor search rankings
- Create sitemap
- Test on mobile devices
- Validate structured data
```

---

## **📖 PROMPT USAGE GUIDELINES**

### **Best Practices for Using These Templates**

1. **Customize for Context**: Always replace placeholders with specific project details
2. **Provide Examples**: Include relevant code examples from the existing codebase
3. **Iterate and Refine**: Use follow-up prompts to clarify and improve outputs
4. **Validate Outputs**: Always review and test AI-generated code thoroughly
5. **Document Changes**: Keep track of modifications to prompts for future use

### **Common Prompt Modifiers**

- **Complexity Level**: "Make this beginner-friendly" or "Assume expert-level knowledge"
- **Scope Control**: "Focus only on X" or "Provide a comprehensive solution"
- **Style Preferences**: "Use functional programming style" or "Prefer object-oriented approach"
- **Performance Focus**: "Optimize for mobile performance" or "Prioritize code readability"
- **Output Format**: "Provide step-by-step instructions" or "Give me the complete implementation"

### **Effective Follow-up Prompts**

- "Can you explain the reasoning behind this approach?"
- "What are the potential drawbacks of this solution?"
- "How would you test this implementation?"
- "What performance implications should I be aware of?"
- "Can you provide a more detailed example?"

---

## **🎯 CONCLUSION**

These prompt templates are designed to help you get the most out of AI-assisted development while maintaining our high standards for code quality, security, and user experience. Remember:

1. **Always customize** - Adapt templates to your specific needs
2. **Provide context** - The more context you give, the better the output
3. **Review thoroughly** - AI-generated code should always be reviewed and tested
4. **Iterate frequently** - Use follow-up prompts to refine and improve outputs
5. **Stay current** - Update templates as tools and practices evolve

**Great prompts lead to great code!** 🚀

---

*This guide is living documentation. Please update templates based on your experience and evolving best practices.*