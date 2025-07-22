# 🚀 ENGINEERING EXCELLENCE STANDARDS FOR STR CERTIFIED

## **COLLABORATIVE GROWTH MINDSET**

Every line of code you write contributes to a world-class system that serves real users. Your work will be reviewed by experienced engineers who are here to help you grow and succeed. Every implementation teaches us something valuable about building exceptional software.

**EXCELLENCE THROUGH CONTINUOUS LEARNING AND IMPROVEMENT.**

## **YOUR ROLE: GROW INTO ENGINEERING EXCELLENCE**

You are part of a **world-class engineering team** at STR Certified. We believe in developing the best engineers through supportive collaboration and high standards. Your code should demonstrate:

- **Technical Excellence**: Code that would pass review at Google/Meta/Netflix
- **Production Mindset**: Every line must be bulletproof under real-world conditions  
- **Architectural Discipline**: Clean, maintainable, scalable design patterns
- **Zero Shortcuts**: No hacks, no quick fixes, no "it works on my machine"
- **Ruthless Self-Criticism**: Question every line, every pattern, every decision

## **🎯 ARCHITECTURAL EXCELLENCE PATTERNS**

Before writing any code, these resources will help you succeed:
- **ENGINEERING_STANDARDS.md** - Our collaborative standards for quality code
- **ARCHITECTURE_GUIDE.md** - Patterns that scale and maintainable designs
- **CODE_REVIEW_GUIDELINES.md** - What we look for in excellent implementations

### **PATTERNS THAT LEAD TO SUCCESS:**
1. **Graceful Error Handling**: Implement user-friendly error recovery with fallback options
2. **Clean Dependencies**: Design useEffect hooks with clear, minimal dependencies
3. **Focused Components**: Keep components under 300 lines with single responsibilities
4. **Strong Typing**: Use TypeScript effectively to catch errors at compile time
5. **Simple Service Layers**: Create clear, testable service abstractions

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

### **5. MANDATORY PROGRESS VALIDATION**
To prevent fraudulent completion claims, ALL engineers must:
- **Provide measurable evidence** for every completion claim
- **Run validation commands** before reporting progress
- **Submit daily progress reports** with exact metrics
- **Never estimate or approximate** - only report verified numbers

#### **Required Validation Commands:**
```bash
# Component count (must be exact)
find src/components -name "*.tsx" | wc -l

# Type safety violations (must be zero for completion)
grep -r ': any' src/ --include="*.ts" --include="*.tsx" | wc -l

# God components check (must be zero for completion)
find src/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 300' | wc -l

# TypeScript compilation (must be zero errors)
npm run typecheck 2>&1 | grep "error TS" | wc -l
```

#### **Daily Report Template (MANDATORY):**
```markdown
## Daily Progress Report - [Date]

### Validation Metrics:
- Components: [exact_number]/[target]
- Type violations: [exact_number]/0
- God components: [exact_number]/0
- TS errors: [exact_number]/0

### Files Modified Today:
- [List all modified files with git status]

### Evidence of Progress:
- [Screenshots or command outputs proving progress]

### Tomorrow's Specific Targets:
- [Exact files and metrics to address]
```

#### **Completion Fraud Prevention:**
- **Zero tolerance** for false completion claims
- **All claims must include validation command outputs**
- **Manual verification required** before accepting completion
- **Immediate termination** for fraudulent reporting

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

#### **PHASE 1: DATABASE SCHEMA CRITICAL FIXES COMPLETED (JULY 22, 2025) ✅**
**🎯 ZERO 400/404 DATABASE ERRORS - PRODUCTION INSPECTIONS WORKING**

**PHASE 1 ACHIEVEMENTS**:
- ✅ **PropertyCardWithResume.tsx line 125**: Fixed `.eq('completed', false)` → `.in('status', ['draft', 'in_progress'])`
- ✅ **PropertyDataManager.tsx line 109**: Fixed `.eq('completed', false)` → `.in('status', ['draft', 'in_progress'])`  
- ✅ **checklistService.ts lines 46-74**: Fixed `inspection_id` queries → Two-step property_id lookup pattern
- ✅ **InspectionCreationService.ts lines 366-381**: Fixed rollback using property_id lookup pattern
- ✅ **MobileInspectionOrchestrator.ts line 393**: Fixed checklist count using property_id lookup
- ✅ **inspectionValidationService.ts line 60**: Fixed verification using property_id lookup
- ✅ **debugDashboard.ts line 37**: Fixed debug queries using property_id lookup
- ✅ **inspection-creation-flow-validator.ts line 551**: Fixed test cleanup using property_id lookup
- ✅ **TypeScript compilation**: Zero errors confirmed with `npm run typecheck`
- ✅ **Production build**: Successful build confirmed with `npm run build`

**CRITICAL SCHEMA FIXES IMPLEMENTED**:
All services now use the correct two-step query pattern for logs table access:
1. Get `property_id` from `inspections` table using `inspection_id`
2. Query `logs` table using `property_id` (since logs table doesn't have `inspection_id` column)

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
supabase.from('users')         // User data with name, email, role
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
- ❌ `profiles` view (REMOVED - use 'users' table instead)
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
  created_by: string        // UUID referencing users.id
  scraped_at?: string       // Timestamp of data scraping
}

Inspection {
  id: string                // UUID primary key
  property_id: string       // String representation of properties.property_id
  inspector_id: string      // UUID referencing users.id
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

User {
  id: string                // UUID from auth.users
  name: string              // User's full name
  email: string             // User's email address
  role: string              // 'inspector' | 'auditor' | 'admin'
  created_at: string        // Timestamp
  updated_at: string        // Timestamp
  status: string            // 'active' | 'inactive' | 'suspended'
  last_login_at?: string    // Last login timestamp
  phone?: string            // Optional phone number
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
- **Users:** Use `users` table (NOT `profiles` table - does not exist)
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

// Users table (✅ VERIFIED with Supabase)
{
  id: string             // UUID from auth.users ✅
  name: string           // User's full name ✅
  email: string          // User email ✅
  role: string           // User role (inspector/auditor/admin) ✅
  created_at: string     // Timestamp ✅
  updated_at: string     // Timestamp ✅
  status: string         // active/inactive/suspended ✅
  last_login_at?: string // Last login timestamp ✅
  phone?: string         // Optional phone number ✅
}

// Logs table (✅ VERIFIED with Supabase - CORRECTED SCHEMA)
{
  log_id: number         // Primary key (integer) ✅
  property_id: number    // References properties.property_id ✅
  checklist_id: number   // References static_safety_items.id ✅
  ai_result?: string     // AI analysis result ✅
  inspector_remarks?: string // Inspector notes ✅
  pass?: boolean         // Pass/fail status ✅
  inspector_id?: string  // UUID referencing users.id ✅
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

**✅ PHASE 1 DATABASE FIXES COMPLETED (July 22, 2025):**
- **FIXED**: PropertyCardWithResume.tsx - Replaced .eq('completed', false) with .in('status', ['draft', 'in_progress'])
- **FIXED**: PropertyDataManager.tsx - Replaced .eq('completed', false) with .in('status', ['draft', 'in_progress'])
- **FIXED**: checklistService.ts - Replaced inspection_id queries with property_id lookup pattern
- **FIXED**: InspectionCreationService.ts - Updated rollback to use property_id instead of inspection_id
- **RESOLVED**: All 400 "completed=eq.false" and 404 "inspection_id=eq" database errors

### **🚨 Development Warnings (Post-Migration):**

#### **NEVER Do These Things:**
- Reference removed compatibility views (`properties_fixed`, `inspections_fixed`, `inspection_checklist_items`, `profiles`)
- Use removed conversion functions (`int_to_uuid()`, `uuid_to_int()`)
- Use removed compatibility RPC functions (`create_inspection_secure`)
- Assume compatibility layer exists (it has been completely removed)
- Mix old and new table references in the same query

#### **ALWAYS Do These Things:**
- Use direct production table names (`properties`, `users`, `logs`, `static_safety_items`)
- Use correct column names (`property_name`, `street_address`, `name`, `static_safety_item_id`)
- Convert property IDs properly between integer (DB) and string (frontend) in application code
- Test queries against actual production schema
- Document any new schema changes in this file

### **🧪 Schema Validation (Post-Migration):**
```sql
-- Run these tests to verify production schema access:
SELECT COUNT(*) FROM users, properties, logs, static_safety_items;
SELECT property_id, property_name, street_address FROM properties LIMIT 1;
SELECT name, email FROM users LIMIT 1;
SELECT id, title FROM static_safety_items LIMIT 1;
SELECT i.id, p.property_name FROM inspections i 
  JOIN properties p ON p.property_id::text = i.property_id LIMIT 1;

-- Verify compatibility views are removed (should return 0):
SELECT COUNT(*) FROM information_schema.views WHERE table_name IN 
  ('properties_fixed', 'inspections_fixed', 'inspection_checklist_items', 'profiles');
```

### **📋 New Feature Checklist (Post-Migration):**
- [ ] Verify table names use production schema (`properties`, `users`, `logs`, `static_safety_items`)
- [ ] Verify column names match production schema (`property_name`, `name`, `static_safety_item_id`)
- [ ] Test property ID handling (integer in DB, string in frontend)
- [ ] Test queries with actual production data
- [ ] Ensure no compatibility layer references
- [ ] Verify all relationships use correct foreign keys
- [ ] Update documentation with any new schema changes

**Critical:** Use only production tables - compatibility layer has been completely removed. Use 'users' table, NOT 'profiles'.

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

### **9. HTML Element Standards**
- **Mandatory div IDs** - Every `<div>` element MUST have a unique `id` attribute for debugging and testing
- **Semantic naming** - IDs should describe the element's purpose (e.g., `id="property-selection-container"`)
- **Consistent naming** - Use kebab-case for all element IDs
- **Unique identifiers** - No duplicate IDs within the same page/component

```typescript
// ✅ GOOD: All divs have descriptive IDs
<div id="inspection-workflow-container">
  <div id="property-selector-panel">
    <div id="search-results-list">
      {/* content */}
    </div>
  </div>
  <div id="checklist-items-container">
    {/* content */}
  </div>
</div>

// ❌ BAD: Missing IDs on div elements
<div>
  <div>
    <div>
      {/* content */}
    </div>
  </div>
</div>
```

### **10. Code Organization**
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

### **11. Commit Message Standards**
```
feat(inspection): add photo quality validation

- Implement real-time photo quality scoring
- Add user feedback for poor quality images
- Include retry mechanism for failed uploads

Closes #123
```

Remember: You're not just building software - you're creating a learning experience that will make the junior developer a better engineer while delivering a world-class product that future AI coders can easily understand and extend.

## **📊 ACCOUNTABILITY & MEASUREMENT STANDARDS**

### **MEASURABLE DELIVERABLES ONLY**
Every task must have:
- **Specific numeric targets** (e.g., "reduce to exactly 150 components")
- **Verifiable completion criteria** (e.g., "zero TypeScript compilation errors")
- **Validation commands** that prove completion
- **Before/after evidence** (screenshots, metrics, outputs)

### **ANTI-FRAUD MEASURES**
To prevent the completion fraud that occurred in recent sprints:

#### **Mandatory Verification Protocol:**
1. **Engineer claims completion** → Provide exact validation command outputs
2. **CTO runs independent audit** → Verify all claimed metrics
3. **Evidence review** → Screenshots and git history analysis
4. **Acceptance or rejection** → Based on mathematical precision, not estimates

#### **Red Flags for Fraudulent Claims:**
- ❌ Estimates instead of exact numbers ("about 150 components")
- ❌ Missing validation command outputs
- ❌ Refusal to provide evidence or screenshots
- ❌ Claims that don't match independent verification
- ❌ Vague progress descriptions without specifics

#### **Professional Standards Enforcement:**
- **First fraud attempt**: Final warning with documentation
- **Second fraud attempt**: Immediate termination without appeal
- **Pattern of inaccuracy**: Performance improvement plan required

### **DAILY ACCOUNTABILITY CHECKPOINTS**
Every engineer working on architectural changes must:

#### **Morning Standup:**
- **Yesterday's exact metrics** (validated command outputs)
- **Today's specific targets** (exact files and numbers)
- **Blockers requiring assistance** (no vague "making progress")

#### **End-of-Day Report:**
- **Validation command outputs** proving day's progress
- **Git commit history** showing actual work completed
- **Tomorrow's committed targets** (specific and measurable)

#### **Weekly Sprint Reviews:**
- **Mathematical verification** of all claimed progress
- **Independent audit** of key metrics by CTO
- **Course correction** if targets are behind schedule

### **MEASUREMENT-DRIVEN DEVELOPMENT**
All work must be:
- **Quantifiable** - Can be measured objectively
- **Verifiable** - Can be independently confirmed
- **Traceable** - Has clear before/after evidence
- **Accountable** - Engineer takes ownership of accuracy

### **TOOLS FOR ACCOUNTABILITY**
Engineers must use these validation tools daily:

```bash
# Create accountability script
cat > validate_progress.sh << 'EOF'
#!/bin/bash
echo "=== DAILY PROGRESS VALIDATION ==="
echo "Date: $(date)"
echo "Components: $(find src/components -name '*.tsx' | wc -l)"
echo "Type violations: $(grep -r ': any' src/ --include='*.ts' --include='*.tsx' | wc -l)"
echo "God components: $(find src/components -name '*.tsx' -exec wc -l {} + | awk '$1 > 300' | wc -l)"
echo "TS errors: $(npm run typecheck 2>&1 | grep 'error TS' | wc -l)"
echo "=== END VALIDATION ==="
EOF
chmod +x validate_progress.sh
```

**This script must be run and output included in every progress report.**