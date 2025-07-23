# 🛠️ STR CERTIFIED CODING STANDARDS

*Established July 19, 2025 - Post Emergency Cleanup*

## **🎯 CORE PRINCIPLES**

### **1. Single Source of Truth**
- **One canonical component** per function - NEVER create variants
- **Clear naming conventions** - No suffixes like "Fixed", "Enhanced", "Ultimate"
- **Consistent import paths** - Predictable component locations

### **2. Type Safety First**
- **Zero `any` types** in production code
- **Proper interfaces** for all business logic
- **Runtime validation** with Zod for external data
- **Branded types** for entity IDs to prevent mixing

### **3. Database Schema Alignment**
- **Verify against Supabase** before any database changes
- **Use actual column names** from production schema
- **Test queries** against real data before deployment
- **Document relationships** between tables

---

## **📂 COMPONENT STANDARDS**

### **Canonical Component Structure**
```typescript
/**
 * ComponentName - Canonical [purpose] component
 * 
 * Brief description of component purpose and scope.
 * This is the consolidated version combining functionality from [sources].
 * 
 * Features:
 * - Feature 1 with specific details
 * - Feature 2 with specific details
 * - Feature 3 with specific details
 * 
 * @param prop1 - Description with type information
 * @param prop2 - Description with constraints
 * @returns JSX.Element - Description of rendered interface
 * 
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={data}
 *   onAction={handleAction}
 * />
 * ```
 */
export default function ComponentName({ prop1, prop2, onAction }: ComponentProps) {
  // Component implementation
}
```

### **Required Component Features**
- **Error boundaries** for all critical components
- **Loading states** for async operations
- **Accessibility** WCAG 2.1 compliance
- **Mobile optimization** touch-friendly design
- **Comprehensive documentation** with examples

### **Component Naming Rules**
```typescript
// ✅ CORRECT
UserManagement.tsx
ChecklistManagement.tsx
AuditCenter.tsx

// ❌ FORBIDDEN - Will be rejected in code review
UserManagementFixed.tsx
ChecklistManagementEnhanced.tsx
AuditCenterRobust.tsx
```

---

## **🔒 TYPE SAFETY STANDARDS**

### **Interface Design Patterns**
```typescript
// ✅ GOOD: Comprehensive interface with documentation
export interface PropertyData {
  /** Unique property identifier (integer from database) */
  property_id: number;
  /** Property name as displayed to users */
  name: string;
  /** Full street address including city, state */
  address: string;
  /** Optional VRBO listing URL for data scraping */
  vrbo_url?: string;
  /** Property creation timestamp */
  created_at: string;
}

// ✅ GOOD: Branded types to prevent ID mixing
export type PropertyId = number & { __brand: 'PropertyId' };
export type InspectionId = string & { __brand: 'InspectionId' };

// ❌ BAD: Generic or any types
interface GenericData {
  id: any;  // Never use any
  data: unknown;  // Too generic
}
```

### **Database Type Mapping**
```typescript
// ✅ CORRECT: Map database types exactly
export interface DatabaseProperty {
  property_id: number;        // integer in DB
  name: string;      // text in DB
  address: string | null;  // nullable text in DB
  created_at: string;         // timestamp with time zone
}

export interface FrontendProperty {
  id: string;                 // Convert to string for frontend
  name: string;               // Map from name
  address: string;            // Map from address with null handling
  createdAt: Date;            // Convert to Date object
}
```

### **Error Handling Types**
```typescript
// ✅ GOOD: Structured error handling
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export type Result<T, E = APIError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage example
const result = await fetchProperty(id);
if (!result.success) {
  handleError(result.error);
  return;
}
// result.data is guaranteed to be Property
```

---

## **🗄️ DATABASE OPERATION STANDARDS**

### **Schema-Verified Queries**
```typescript
// ✅ CORRECT: Use actual database column names
const { data, error } = await supabase
  .from('properties')
  .select('property_id, name, address')
  .eq('property_id', propertyId);

// ✅ CORRECT: Use actual foreign key relationships
const { data, error } = await supabase
  .from('checklist_items')
  .select(`
    log_id,
    property_id,
    checklist_id,
    static_safety_items!checklist_id (
      id,
      label,
      category
    )
  `)
  .eq('property_id', propertyId);

// ❌ WRONG: Assumed column names
const { data, error } = await supabase
  .from('checklist_items')
  .select('*')
  .eq('static_item_id', itemId);  // Column doesn't exist
```

### **Repository Pattern**
```typescript
// ✅ GOOD: Centralized database operations
export class PropertyRepository {
  static async findById(propertyId: number): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('property_id, name, address, created_at')
      .eq('property_id', propertyId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new DatabaseError(error.message);
    }
    
    return this.mapToProperty(data);
  }
  
  private static mapToProperty(dbData: DatabaseProperty): Property {
    return {
      id: dbData.property_id.toString(),
      name: dbData.name,
      address: dbData.address || '',
      createdAt: new Date(dbData.created_at)
    };
  }
}
```

### **RPC Function Usage**
```typescript
// ✅ CORRECT: Use verified RPC functions
const { data, error } = await supabase.rpc('get_properties_with_inspections', {
  limit: 50,
  offset: 0
});

const { data, error } = await supabase.rpc('create_inspection_compatibility', {
  property_id: propertyId,
  inspector_id: userId
});
```

---

## **⚡ PERFORMANCE STANDARDS**

### **React Performance Patterns**
```typescript
// ✅ GOOD: Proper memoization
export const ExpensiveComponent = React.memo<ExpensiveComponentProps>(({ 
  data, 
  onAction 
}) => {
  const processedData = useMemo(() => {
    return data.filter(item => item.isActive)
             .sort((a, b) => a.priority - b.priority);
  }, [data]);
  
  const handleAction = useCallback((item: Item) => {
    onAction(item.id);
  }, [onAction]);
  
  return (
    <div>
      {processedData.map(item => (
        <ItemCard 
          key={item.id} 
          item={item} 
          onAction={handleAction} 
        />
      ))}
    </div>
  );
});

// ✅ GOOD: Lazy loading for large components
const LazyAdminPanel = React.lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyAdminPanel />
    </Suspense>
  );
}
```

### **Bundle Optimization**
```typescript
// ✅ GOOD: Tree-shaking friendly imports
import { debounce } from 'lodash-es';
import { format } from 'date-fns';

// ❌ BAD: Imports entire library
import _ from 'lodash';
import * as dateFns from 'date-fns';
```

---

## **♿ ACCESSIBILITY STANDARDS**

### **WCAG 2.1 Compliance**
```typescript
// ✅ GOOD: Proper ARIA labels and keyboard navigation
<button
  aria-label="Delete inspection item"
  aria-describedby="delete-confirmation"
  onClick={handleDelete}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDelete();
    }
  }}
>
  <TrashIcon />
</button>

// ✅ GOOD: Form accessibility
<div>
  <label htmlFor="property-name" className="sr-only">
    Property Name
  </label>
  <input
    id="property-name"
    type="text"
    placeholder="Enter property name"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "name-error" : undefined}
  />
  {hasError && (
    <div id="name-error" role="alert" className="text-red-600">
      Property name is required
    </div>
  )}
</div>
```

### **Color Contrast Requirements**
- **Normal text**: 4.5:1 contrast ratio minimum
- **Large text**: 3:1 contrast ratio minimum
- **Interactive elements**: Clear focus indicators
- **Touch targets**: Minimum 44px for mobile

---

## **🧪 TESTING STANDARDS**

### **Test Structure**
```typescript
// ✅ GOOD: Comprehensive test structure
describe('PropertyManagement', () => {
  const mockProps = {
    properties: mockPropertyData,
    onCreateProperty: jest.fn(),
    onDeleteProperty: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders property list correctly', () => {
    render(<PropertyManagement {...mockProps} />);
    
    expect(screen.getByText('Property Management')).toBeInTheDocument();
    expect(screen.getAllByTestId('property-card')).toHaveLength(2);
  });
  
  it('handles property creation', async () => {
    const user = userEvent.setup();
    render(<PropertyManagement {...mockProps} />);
    
    await user.click(screen.getByText('Add Property'));
    await user.type(screen.getByLabelText('Property Name'), 'Test Property');
    await user.click(screen.getByText('Create'));
    
    expect(mockProps.onCreateProperty).toHaveBeenCalledWith({
      name: 'Test Property'
    });
  });
  
  it('handles errors gracefully', async () => {
    const errorProps = {
      ...mockProps,
      onCreateProperty: jest.fn().mockRejectedValue(new Error('API Error'))
    };
    
    render(<PropertyManagement {...errorProps} />);
    
    // Test error handling
    await user.click(screen.getByText('Create'));
    expect(screen.getByText('Failed to create property')).toBeInTheDocument();
  });
});
```

### **Testing Requirements**
- **Unit tests** for all business logic functions
- **Component tests** for user interactions
- **Integration tests** for database operations
- **Accessibility tests** with @testing-library/jest-dom
- **Error scenario tests** for all failure modes

---

## **📝 DOCUMENTATION REQUIREMENTS**

### **Code Documentation**
```typescript
/**
 * Calculates inspection completion percentage based on checklist items
 * 
 * This function considers both completed and not-applicable items as "done"
 * since not-applicable items don't need to be completed but should count
 * toward overall progress for accurate completion tracking.
 * 
 * @param items - Array of checklist items to analyze
 * @returns Percentage (0-100) of completion
 * 
 * @throws {ValidationError} When items array is empty or contains invalid data
 * 
 * @example
 * ```typescript
 * const items = [
 *   { status: 'completed' },
 *   { status: 'pending' },
 *   { status: 'not_applicable' }
 * ];
 * const percentage = calculateCompletionPercentage(items);
 * console.log(percentage); // 66.67
 * ```
 */
export function calculateCompletionPercentage(items: ChecklistItem[]): number {
  if (items.length === 0) {
    throw new ValidationError('Items array cannot be empty');
  }
  
  const completedCount = items.filter(item => 
    item.status === 'completed' || item.status === 'not_applicable'
  ).length;
  
  return Math.round((completedCount / items.length) * 100 * 100) / 100;
}
```

### **Change Documentation**
Every significant change must include:
```markdown
## Change Log Entry Template

### [Component/Service Name] - [Date]

**Change Type**: [Feature/Bugfix/Refactor/Breaking Change]

**Problem**: Brief description of what issue was being solved

**Solution**: What approach was taken and why

**Impact**: What changes for developers using this code

**Database Changes**: Any schema or query modifications

**Breaking Changes**: Any API or interface changes

**Testing**: How the change was validated

**Example**:
```typescript
// Before
const result = await fetchData(id);

// After  
const result = await fetchData({ id, includeMetadata: true });
```
```

---

## **🚨 CODE REVIEW CHECKLIST**

### **Before Submitting PR**
- [ ] TypeScript compilation passes with zero errors
- [ ] All tests pass (unit, integration, accessibility)
- [ ] Database operations tested against actual schema
- [ ] Component follows canonical naming convention
- [ ] Documentation updated (JSDoc, README, CHANGELOG)
- [ ] No `any` types in production code
- [ ] Error handling implemented for all failure modes
- [ ] Accessibility requirements met (WCAG 2.1)
- [ ] Performance considerations addressed (memoization, lazy loading)

### **Code Review Criteria**
- **Functionality**: Does it solve the problem correctly?
- **Type Safety**: Are all types properly defined and used?
- **Database Alignment**: Do queries match actual schema?
- **Error Handling**: Are all failure modes handled gracefully?
- **Testing**: Is the code thoroughly tested?
- **Documentation**: Is the code self-documenting with proper comments?
- **Performance**: Are there any performance concerns?
- **Accessibility**: Does it meet WCAG 2.1 standards?
- **Security**: Are there any security considerations?

---

## **🎯 SUCCESS METRICS**

### **Code Quality Gates**
- **TypeScript strict mode**: Must pass with zero errors
- **Test coverage**: Minimum 80% for new code
- **Performance budget**: Components must render in <100ms
- **Accessibility score**: Must pass automated accessibility tests
- **Bundle size**: No regressions in bundle size without justification

### **Development Velocity Metrics**
- **PR review time**: Target <24 hours for non-breaking changes
- **Bug fix time**: Critical bugs fixed within 4 hours
- **Feature development**: Consistent velocity with proper testing
- **Onboarding time**: New developers productive within 2 days

These standards ensure that STR Certified maintains a high-quality, maintainable codebase that scales with the business and supports rapid feature development while maintaining reliability and user experience excellence.

---

*Standards established: July 19, 2025*  
*Next review: August 19, 2025*  
*Maintained by: STR Certified Engineering Team*