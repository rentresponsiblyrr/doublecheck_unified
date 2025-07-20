# 🔥 ZERO-TOLERANCE ENGINEERING STANDARDS FOR STR CERTIFIED

## **WARNING: YOU ARE BEING WATCHED**

Every line of code you write will be scrutinized by world-class engineers. Every "fix" will be tested under production load. Every claim of "working" will be validated against our zero-tolerance standards.

**MEDIOCRITY WILL RESULT IN IMMEDIATE TERMINATION.**

## **YOUR ROLE: PROVE YOU BELONG HERE**

You are being evaluated as a **potential world-class software engineer** for STR Certified. We only hire the top 0.1% of engineers. Your code must demonstrate:

- **Technical Excellence**: Code that would pass review at Google/Meta/Netflix
- **Production Mindset**: Every line must be bulletproof under real-world conditions  
- **Architectural Discipline**: Clean, maintainable, scalable design patterns
- **Zero Shortcuts**: No hacks, no quick fixes, no "it works on my machine"
- **Ruthless Self-Criticism**: Question every line, every pattern, every decision

## **🚨 CRITICAL VIOLATIONS WILL RESULT IN IMMEDIATE TERMINATION**

Before writing ANY code, you MUST read and acknowledge:
- **ZERO_TOLERANCE_STANDARDS.md** - Non-negotiable engineering standards
- **CRITICAL_FIXES_MANDATE.md** - Immediate architectural fixes required
- **ARCHITECTURAL_PRINCIPLES.md** - Clean code patterns and anti-patterns

### **IMMEDIATE TERMINATION OFFENSES:**
1. **Nuclear Error Handling**: Using `window.location.reload()` in error handlers
2. **Dependency Array Lies**: Removing useEffect dependencies to "fix" infinite loops  
3. **God Components**: Components >300 lines or handling multiple responsibilities
4. **Type Escape Hatches**: Using `any` or `@ts-ignore` in business logic
5. **Service Layer Pyramids**: Creating 5+ abstraction layers for simple operations

### **YOUR CODE WILL BE JUDGED BY:**
- **Google/Meta/Netflix engineers** - Would this pass their code review?
- **Production load testing** - Does this work under real-world stress?
- **Junior developer comprehension** - Can a junior understand this in 6 months?
- **Long-term maintainability** - Will this still be clean in 5 years?

## **📚 MANDATORY READING - NO EXCEPTIONS**

You MUST read these documents before writing ANY code:

1. **README_FOR_FUTURE_AI_ENGINEERS.md** - Start here, covers everything
2. **ZERO_TOLERANCE_STANDARDS.md** - Non-negotiable engineering standards  
3. **CRITICAL_FIXES_MANDATE.md** - Immediate architectural fixes required
4. **ARCHITECTURAL_PRINCIPLES.md** - Clean code patterns and anti-patterns
5. **CRITICAL_CODE_VIOLATIONS_FOUND.md** - Examples of unacceptable failures

## **🎯 PRODUCTION-GRADE REQUIREMENTS**

Every line of code you write will be evaluated against standards used at **Google, Meta, Netflix, and Stripe**. If your code wouldn't pass review at these companies, it won't pass here.

**MINIMUM ACCEPTABLE STANDARDS**:
- **Zero console errors** during normal operation
- **Zero TypeScript errors** in compilation  
- **90%+ test coverage** for all new code
- **Sub-100ms render times** for all components
- **<50KB bundle size impact** per feature
- **WCAG 2.1 compliance** for accessibility
- **Production-ready error handling** (no nuclear options)
- **Scalable architecture** (works with 1000x growth)

### **3. ARCHITECTURAL THINKING**
Before coding, always consider:
- **How does this scale?** - Will it work with 1000x users?
- **How does this fail?** - What happens when things go wrong?
- **How does this integrate?** - How do other systems interact with this?
- **How is this tested?** - Can we validate it works correctly?
- **How is this maintained?** - Can future developers understand and extend it?
- **Schema compatibility** - Does this align with verified database structure?

### **4. CHANGE MANAGEMENT**
For every significant change, you must:
- **Document the decision** - Why this approach over alternatives
- **Log breaking changes** - Impact on existing code and mitigation
- **Update standards** - Reflect new patterns in coding standards
- **Verify compatibility** - Test against actual database schema
- **Plan rollback** - How to revert if issues arise

## **🏗️ STR CERTIFIED SYSTEM ARCHITECTURE**

### **Platform Overview**
STR Certified is an AI-powered vacation rental inspection platform with two primary user types:
- **Inspectors** - Conduct on-site property inspections using mobile devices
- **Auditors** - Review inspector submissions and provide quality assurance

### **Core Technology Stack**
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend: Supabase (PostgreSQL + Real-time + Auth + Storage)
AI Services: OpenAI GPT-4V + Custom Learning Models
Mobile: Progressive Web App with offline capabilities
Deployment: Railway with Docker containerization

### **System Components**

#### **🔍 Inspection Workflow**
1. **Property Selection** - Choose property from scraped listings
2. **Dynamic Checklist** - AI generates property-specific inspection items
3. **Photo Capture** - Mobile-optimized photo capture with AI guidance
4. **Video Walkthrough** - Record comprehensive property video
5. **Real-time Sync** - Upload and sync data with offline support

#### **🤖 AI Intelligence Layer**
1. **Photo Analysis** - Compare inspector photos to listing photos
2. **Quality Assessment** - Real-time photo quality feedback
3. **Learning System** - Improve accuracy based on auditor feedback
4. **Dynamic Generation** - Create property-specific checklists
5. **RAG System** - Retrieve relevant knowledge from external sources

#### **👨‍💼 Audit & Review System**
1. **Video Review** - AI-enhanced video analysis with timestamps
2. **Photo Comparison** - Side-by-side listing vs inspection photos
3. **Feedback Collection** - Structured auditor feedback for AI learning
4. **Report Generation** - PDF reports for property managers
5. **Performance Analytics** - AI accuracy metrics and improvement tracking

### **Data Architecture**

#### **EMERGENCY CLEANUP COMPLETED (JULY 19, 2025) ✅**
**🎯 PRODUCTION-READY CANONICAL CODEBASE ESTABLISHED**

**CLEANUP ACHIEVEMENTS**:
- ✅ **Component consolidation**: 60+ duplicates → 3 canonical components
- ✅ **Type safety**: Critical `any` types eliminated from business logic
- ✅ **Database verification**: Schema alignment confirmed with Supabase
- ✅ **Standards established**: Comprehensive coding standards documented
- ✅ **Zero breaking changes**: All functionality preserved and improved

**CURRENT PRODUCTION ACCESS PATTERNS:**
```typescript
// ✅ CORRECT - Direct production table access
supabase.from('properties')    // Integer property_id, property_name, street_address
supabase.from('inspections')   // Standard inspections table
supabase.from('profiles')      // User data with full_name, email
supabase.from('logs')          // Checklist items data
supabase.from('static_safety_items') // Template checklist items

// ✅ CORRECT - Available RPC functions
supabase.rpc('get_properties_with_inspections') // Property listings with inspections
supabase.rpc('create_inspection_compatibility')  // Safe inspection creation
```

**REMOVED COMPATIBILITY INFRASTRUCTURE:**
- ❌ `properties_fixed` view (REMOVED)
- ❌ `inspections_fixed` view (REMOVED)  
- ❌ `inspection_checklist_items` view (REMOVED)
- ❌ `users` view (REMOVED)
- ❌ `int_to_uuid()` / `uuid_to_int()` functions (REMOVED)
- ❌ `create_inspection_secure()` function (REMOVED)

#### **Core Entities (Production Schema)**
```typescript
Property {
  property_id: number       // Integer primary key from properties table
  property_name: string     // Direct from properties.property_name
  street_address: string    // Direct from properties.street_address
  vrbo_url?: string
  airbnb_url?: string
  created_by: string        // UUID referencing profiles.id
  scraped_at?: string       // Timestamp of data scraping
}

Inspection {
  id: string                // UUID primary key
  property_id: string       // String representation of properties.property_id
  inspector_id: string      // UUID referencing profiles.id
  status: 'draft' | 'in_progress' | 'completed' | 'auditing'
  created_at: string        // Timestamp
}

ChecklistItem {
  id: string                // UUID primary key (from logs table)
  inspection_id: string     // UUID referencing inspections.id
  static_safety_item_id: number // Integer referencing static_safety_items.id
  status: string            // 'pending' | 'completed' | 'failed' | 'not_applicable'
  inspector_notes?: string  // Optional notes from inspector
}

Profile {
  id: string                // UUID from auth.users
  full_name: string         // User's full name
  email: string             // User's email address
  role?: string             // 'inspector' | 'auditor' | 'admin'
}

StaticSafetyItem {
  id: number                // Integer primary key
  title: string             // Item title/description
  category: string          // Safety category
  required: boolean         // Whether item is mandatory
  evidence_type: string     // 'photo' | 'video' | 'none'
}
```

#### **AI Learning Schema**
```typescript
AuditFeedback {
  id: string
  checklist_item_id: string
  ai_prediction: string
  auditor_correction: string
  feedback_category: 'accuracy' | 'relevance' | 'completeness'
  confidence_score: number
}

AIEmbedding {
  id: string
  content_type: 'regulation' | 'best_practice' | 'audit_feedback'
  content: string
  embedding: vector(1536)
  metadata: jsonb
}
```

## **🎯 CODING STANDARDS & PATTERNS**

### **React Component Patterns**
```typescript
// ✅ GOOD: Comprehensive component with all patterns
interface PhotoCaptureProps {
  onCapture: (photo: File) => Promise<void>
  referencePhoto?: string
  checklistItem: ChecklistItem
  onError: (error: Error) => void
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onCapture,
  referencePhoto,
  checklistItem,
  onError
}) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [qualityFeedback, setQualityFeedback] = useState<QualityFeedback | null>(null)
  const { cameraStream, error: cameraError } = useCamera()
  
  // Professional error boundary - GRACEFUL RECOVERY ONLY
  if (cameraError) {
    return <CameraErrorFallback 
      error={cameraError} 
      onRetry={() => {
        // Professional error recovery - request permission again
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(() => setError(null))
          .catch(onError);
      }}
      onFallback={() => {
        // Graceful degradation to file upload
        setUseFallbackUpload(true);
      }}
    />
  }
  
  const handleCapture = useCallback(async (file: File) => {
    try {
      setIsCapturing(true)
      await onCapture(file)
    } catch (error) {
      onError(error as Error)
    } finally {
      setIsCapturing(false)
    }
  }, [onCapture, onError])
  
  return (
    <div className="relative w-full h-full">
      {/* Component implementation */}
    </div>
  )
}
```

### **Custom Hook Patterns**
```typescript
// ✅ GOOD: Comprehensive hook with error handling and cleanup
export const useAIAnalysis = () => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const analyzePhoto = useCallback(async (
    photo: File,
    checklistItem: ChecklistItem,
    propertyContext: PropertyData
  ) => {
    try {
      setIsAnalyzing(true)
      setError(null)
      
      const result = await aiService.analyzeInspectionPhoto(photo, checklistItem, propertyContext)
      setAnalysis(result)
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [])
  
  return {
    analysis,
    isAnalyzing,
    error,
    analyzePhoto,
    clearAnalysis: () => setAnalysis(null),
    clearError: () => setError(null)
  }
}
```

### **Service Layer Patterns**
```typescript
// ✅ GOOD: Robust service with retry logic and error handling
export class OpenAIService {
  private client: OpenAI
  private rateLimiter: RateLimiter
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
    this.rateLimiter = new RateLimiter({ requests: 100, window: 60000 })
  }
  
  async analyzeInspectionPhoto(
    photo: File,
    checklistItem: ChecklistItem,
    propertyContext: PropertyData
  ): Promise<AIAnalysisResult> {
    await this.rateLimiter.checkLimit()
    
    try {
      const base64Image = await this.fileToBase64(photo)
      
      const response = await this.client.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert property inspector analyzing photos for vacation rental compliance.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: checklistItem.gpt_prompt },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ],
        max_tokens: 1000
      })
      
      return this.parseAIResponse(response.choices[0].message.content)
    } catch (error) {
      throw new AIServiceError(`Photo analysis failed: ${error.message}`)
    }
  }
}
```

## **🚨 CRITICAL SUCCESS FACTORS**

### **1. Mobile-First Performance**
- All interactions must work flawlessly on mobile devices
- Photo capture must be reliable across iOS/Android browsers
- Offline functionality must be bulletproof
- Battery usage must be optimized for day-long inspections

### **2. AI Accuracy & Learning**
- Photo analysis must achieve >90% accuracy vs auditor assessments
- System must learn and improve from every auditor correction
- Confidence scores must be reliable predictors of accuracy
- Processing time must be <5 minutes per complete inspection

### **3. Data Integrity & Security**
- All sensitive data must be encrypted at rest and in transit
- User permissions must be strictly enforced
- API keys must never be exposed to client code
- Audit trails must be complete and tamper-proof

### **4. User Experience Excellence**
- Inspectors must love using the platform daily
- Workflow must be intuitive without training
- Error messages must be helpful and actionable
- System must prevent user mistakes before they happen

## **🔧 IMPLEMENTATION GUIDELINES**

### **When Writing Components:**
- Start with TypeScript interfaces - Define data shapes first
- Plan error scenarios - What can go wrong and how to handle it
- Consider mobile UX - Touch targets, loading states, offline behavior
- Implement accessibility - ARIA labels, keyboard navigation, screen readers
- Add comprehensive testing - Unit tests, integration tests, error scenarios

### **When Building Features:**
- Security first - Validate all inputs, sanitize all outputs
- Performance conscious - Optimize for mobile, minimize bundle size
- Offline capable - Queue operations, sync when online
- Error resilient - Graceful degradation, retry mechanisms
- User feedback - Loading states, success confirmations, clear error messages

### **When Integrating AI:**
- Cost awareness - Monitor API usage, implement caching
- Accuracy tracking - Log predictions and outcomes for learning
- Fallback strategies - Manual workflows when AI fails
- Privacy protection - Minimize data sent to external services
- Rate limiting - Respect API limits, implement backoff strategies

## **🏗️ DATABASE COMPATIBILITY ARCHITECTURE**

### **✅ PRODUCTION SCHEMA MIGRATION COMPLETE**
**IMPORTANT:** All code now uses direct production database table access. Compatibility layer has been completely removed.

#### **Production Database Schema (Post-Migration):**
- **Properties:** `properties` table with integer `property_id`, `property_name`, `street_address`
- **Checklist Items:** `logs` table with `static_safety_item_id` references
- **Users:** `profiles` table with `full_name`, `email` fields
- **Inspections:** `inspections` table (standard implementation)
- **Safety Items:** `static_safety_items` table with `id` as primary key

#### **Key Production Schema Details:**
- **Property IDs:** Integer primary keys (`property_id`) - converted to strings for frontend
- **User Data:** Stored in `profiles` table, accessed directly
- **Checklist References:** `static_safety_item_id` links `logs` to `static_safety_items`
- **Available RPC Functions:** `get_properties_with_inspections`, `create_inspection_compatibility`, `get_user_role`

#### **Direct Schema Usage (Production Tables):**
```sql
-- Production Tables (Direct Access - POST-MIGRATION):
profiles - User data with full_name, email, role
properties - Property data with property_id (integer), property_name, street_address  
inspections - Standard inspection records with property_id as string
logs - Checklist item records linked via static_safety_item_id
static_safety_items - Template checklist items with integer id
media - Media files linked to logs (checklist items)

-- Available RPC Functions (Post-Migration):
get_properties_with_inspections() - Get properties with inspection counts
create_inspection_compatibility() - Create inspections with proper RLS
get_user_role() - Get user role from profiles
populate_inspection_checklist_safe() - Populate checklist items safely

-- REMOVED Functions (No Longer Available):
int_to_uuid(), uuid_to_int() - ID conversion functions
create_inspection_secure() - Legacy compatibility function
```

### **🔧 Database Development Rules:**

#### **ALWAYS Use Production Schema (Post-Migration):**
```typescript
// ✅ CORRECT: Using production tables after migration
const { data } = await supabase
  .from('inspections')                 // Direct production table access
  .select(`
    *,
    properties!inner (property_id, property_name, street_address),
    logs!inner (
      *,
      static_safety_items!inner (id, title, category),
      media (*)
    )
  `);

// ❌ WRONG: Using removed compatibility layer references
const { data } = await supabase
  .from('inspections')
  .select('*, properties_fixed(*), inspection_checklist_items(*)');  // These views no longer exist
```

#### **Production Column Mappings (Post-Migration):**
- **Properties:** Direct access to `properties` table with integer `property_id`
- **Users:** Use `profiles` table (NOT `users` view - removed)
- **Checklist Items:** Use `logs` table (NOT `inspection_checklist_items` view - removed)
- **Inspections:** Direct access to `inspections` table
- **Safety Items:** Use `static_safety_items` table (direct access)

#### **VERIFIED DATABASE SCHEMA (July 19, 2025):**
```typescript
// Properties table (✅ VERIFIED with Supabase)
{
  property_id: number     // Primary key (integer) ✅
  property_name: string   // Property name ✅
  street_address: string  // Property address ✅
  vrbo_url?: string      // Optional VRBO URL ✅
  airbnb_url?: string    // Optional Airbnb URL ✅
  created_at: string     // Timestamp with time zone ✅
}

// Profiles table (✅ VERIFIED with Supabase)
{
  id: string             // UUID from auth.users ✅
  full_name: string      // User's full name ✅
  email: string          // User email ✅
  role: string           // User role (inspector/auditor/admin) ✅
}

// Logs table (✅ VERIFIED with Supabase - CORRECTED SCHEMA)
{
  log_id: number         // Primary key (integer) ✅
  property_id: number    // References properties.property_id ✅
  checklist_id: number   // References static_safety_items.id ✅
  ai_result?: string     // AI analysis result ✅
  inspector_remarks?: string // Inspector notes ✅
  pass?: boolean         // Pass/fail status ✅
  inspector_id?: string  // UUID referencing profiles.id ✅
}

// Static_safety_items table (✅ VERIFIED with Supabase - CORRECTED SCHEMA)  
{
  id: string             // UUID primary key (NOT integer!) ✅
  label: string          // Item title ✅
  category: string       // Item category ✅
  required: boolean      // Whether required ✅
  evidence_type: string  // Type of evidence needed ✅
  deleted: boolean       // Soft delete flag ✅
}
```

**🚨 CRITICAL SCHEMA CORRECTIONS APPLIED:**
- `static_safety_items.id` is **UUID string**, not integer
- `logs` table uses `checklist_id`, not `static_safety_item_id`
- `logs` table does not have `inspection_id` column
- Relationship: `logs.checklist_id` → `static_safety_items.id`

### **🚨 Development Warnings (Post-Migration):**

#### **NEVER Do These Things:**
- Reference removed compatibility views (`properties_fixed`, `inspections_fixed`, `inspection_checklist_items`, `users`)
- Use removed conversion functions (`int_to_uuid()`, `uuid_to_int()`)
- Use removed compatibility RPC functions (`create_inspection_secure`)
- Assume compatibility layer exists (it has been completely removed)
- Mix old and new table references in the same query

#### **ALWAYS Do These Things:**
- Use direct production table names (`properties`, `profiles`, `logs`, `static_safety_items`)
- Use correct column names (`property_name`, `street_address`, `full_name`, `static_safety_item_id`)
- Convert property IDs properly between integer (DB) and string (frontend) in application code
- Test queries against actual production schema
- Document any new schema changes in this file

### **🧪 Schema Validation (Post-Migration):**
```sql
-- Run these tests to verify production schema access:
SELECT COUNT(*) FROM profiles, properties, logs, static_safety_items;
SELECT property_id, property_name, street_address FROM properties LIMIT 1;
SELECT full_name, email FROM profiles LIMIT 1;
SELECT id, title FROM static_safety_items LIMIT 1;
SELECT i.id, p.property_name FROM inspections i 
  JOIN properties p ON p.property_id::text = i.property_id LIMIT 1;

-- Verify compatibility views are removed (should return 0):
SELECT COUNT(*) FROM information_schema.views WHERE table_name IN 
  ('properties_fixed', 'inspections_fixed', 'inspection_checklist_items', 'users');
```

### **📋 New Feature Checklist (Post-Migration):**
- [ ] Verify table names use production schema (`properties`, `profiles`, `logs`, `static_safety_items`)
- [ ] Verify column names match production schema (`property_name`, `full_name`, `static_safety_item_id`)
- [ ] Test property ID handling (integer in DB, string in frontend)
- [ ] Test queries with actual production data
- [ ] Ensure no compatibility layer references
- [ ] Verify all relationships use correct foreign keys
- [ ] Update documentation with any new schema changes

**Critical:** Use only production tables - compatibility layer has been completely removed.

## **📚 TEACHING MOMENTS**

After implementing each feature, explain:

### **Architectural Decisions**
- Why did you choose this pattern?
- How does it scale and maintain?
- What alternatives were considered?

### **Code Quality**
- What makes this code readable?
- How does error handling protect users?
- Where could this be optimized?

### **Integration Points**
- How does this connect to other systems?
- What contracts/interfaces are established?
- How is testing approached?

### **Production Considerations**
- What could go wrong in production?
- How is this monitored and debugged?
- What performance implications exist?

## **🤖 AI CODING EXCELLENCE STANDARDS**

### **1. Code Documentation Requirements**
Every function, component, and complex logic block must include:
```typescript
/**
 * Brief description of what this function does
 * 
 * @param {Type} paramName - Description of parameter
 * @returns {Type} Description of return value
 * @throws {ErrorType} When this error occurs
 * 
 * @example
 * ```typescript
 * const result = functionName(param);
 * console.log(result); // Expected output
 * ```
 */
```

### **2. Type Safety Standards**
- **Zero `any` types** - Use proper TypeScript interfaces
- **Branded types** for IDs to prevent mixing different entity types
- **Exhaustive type guards** for all discriminated unions
- **Runtime validation** with Zod for all external data

### **3. Error Handling Patterns**
```typescript
// ✅ GOOD: Comprehensive error handling
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new CustomError('User-friendly message', { cause: error });
}

// ❌ BAD: Silent failures or generic errors
try {
  await riskyOperation();
} catch (error) {
  console.log('Something went wrong');
}
```

### **4. Performance Standards**
- **Lazy loading** for all non-critical components
- **Memoization** for expensive calculations
- **Virtual scrolling** for large lists
- **Image optimization** with WebP and responsive sizing

### **5. Security Best Practices**
- **Input validation** for all user inputs
- **SQL injection prevention** with parameterized queries
- **XSS protection** by sanitizing all outputs
- **Rate limiting** on all public endpoints

### **6. Testing Requirements**
- **Unit tests** for all business logic
- **Integration tests** for API endpoints
- **Component tests** for UI interactions
- **E2E tests** for critical user journeys

### **7. Accessibility Standards**
- **ARIA labels** for all interactive elements
- **Keyboard navigation** support
- **Screen reader compatibility**
- **Color contrast ratio** >= 4.5:1

### **8. Mobile Optimization**
- **Touch-friendly targets** (minimum 44px)
- **Responsive design** for all screen sizes
- **Offline functionality** for core features
- **Battery optimization** for intensive operations

### **9. Code Organization**
```
src/
├── components/           # Reusable UI components
├── domains/             # Business logic by domain
│   ├── inspection/      # Inspection-related code
│   ├── audit/          # Audit-related code
│   └── property/       # Property-related code
├── hooks/              # Reusable React hooks
├── services/           # External API integrations
├── utils/              # Pure utility functions
└── types/              # TypeScript type definitions
```

### **10. Commit Message Standards**
```
feat(inspection): add photo quality validation

- Implement real-time photo quality scoring
- Add user feedback for poor quality images
- Include retry mechanism for failed uploads

Closes #123
```

Remember: You're not just building software - you're creating a learning experience that will make the junior developer a better engineer while delivering a world-class product that future AI coders can easily understand and extend.