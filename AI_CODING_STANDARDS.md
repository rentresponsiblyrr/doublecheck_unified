# 🤖 AI CODING STANDARDS FOR STR CERTIFIED

*The definitive guide for AI coders working on the STR Certified platform*

## **🎯 VISION STATEMENT**

Every line of code should be so beautiful, well-documented, and maintainable that future AI coders can understand it instantly and extend it effortlessly. We're building a codebase that will make senior engineers weep with joy.

## **📋 FUNDAMENTAL PRINCIPLES**

### **1. Code as Documentation**
- Code should be self-documenting through clear naming and structure
- Complex logic requires explanatory comments
- Business rules must be documented with context

### **2. Fail-Fast Philosophy**
- Detect errors early in the development process
- Use TypeScript's strict mode religiously
- Implement comprehensive input validation

### **3. Performance by Design**
- Consider mobile-first performance in every decision
- Optimize for the critical path (inspection workflow)
- Lazy load everything that's not immediately needed

### **4. Security First**
- Never trust user input
- Sanitize all outputs
- Implement proper authentication and authorization

## **🏗️ ARCHITECTURAL PATTERNS**

### **Domain-Driven Design Structure**
```
src/
├── domains/                    # Business logic organized by domain
│   ├── inspection/
│   │   ├── components/         # Domain-specific components
│   │   ├── hooks/             # Domain-specific hooks
│   │   ├── services/          # Business logic services
│   │   ├── types/             # Domain type definitions
│   │   └── utils/             # Domain utility functions
│   ├── audit/
│   ├── property/
│   └── user/
├── shared/                     # Cross-domain shared code
│   ├── components/ui/         # Reusable UI components
│   ├── hooks/                 # Generic hooks
│   ├── utils/                 # Pure utility functions
│   └── types/                 # Shared type definitions
├── infrastructure/             # External concerns
│   ├── api/                   # API layer
│   ├── database/              # Database access
│   ├── monitoring/            # Logging and metrics
│   └── security/              # Authentication and authorization
└── app/                       # Application bootstrap
```

### **Service Layer Pattern**
```typescript
// ✅ GOOD: Clean service interface
interface InspectionService {
  create(data: CreateInspectionRequest): Promise<Result<Inspection, InspectionError>>;
  update(id: InspectionId, data: UpdateInspectionRequest): Promise<Result<Inspection, InspectionError>>;
  delete(id: InspectionId): Promise<Result<void, InspectionError>>;
  findById(id: InspectionId): Promise<Result<Inspection | null, InspectionError>>;
}

// Implementation with proper error handling
class InspectionServiceImpl implements InspectionService {
  constructor(
    private repository: InspectionRepository,
    private logger: Logger,
    private validator: Validator
  ) {}

  async create(data: CreateInspectionRequest): Promise<Result<Inspection, InspectionError>> {
    try {
      // Validate input
      const validation = await this.validator.validate(data);
      if (!validation.isValid) {
        return Result.failure(new ValidationError(validation.errors));
      }

      // Business logic
      const inspection = await this.repository.create(data);
      
      // Log success
      this.logger.info('Inspection created', { inspectionId: inspection.id });
      
      return Result.success(inspection);
    } catch (error) {
      this.logger.error('Failed to create inspection', { error, data });
      return Result.failure(new InspectionError('Failed to create inspection', { cause: error }));
    }
  }
}
```

## **🔧 TYPESCRIPT EXCELLENCE**

### **Type Safety Standards**

```typescript
// ✅ GOOD: Branded types for IDs
type InspectionId = string & { readonly __brand: 'InspectionId' };
type PropertyId = string & { readonly __brand: 'PropertyId' };
type UserId = string & { readonly __brand: 'UserId' };

// Helper functions for type safety
const createInspectionId = (id: string): InspectionId => id as InspectionId;
const createPropertyId = (id: string): PropertyId => id as PropertyId;

// ❌ BAD: Using plain strings for IDs
const inspectionId: string = "123";
const propertyId: string = "456";
// This would compile but is logically wrong:
// someFunction(inspectionId, propertyId); // Arguments swapped!
```

### **Result Pattern for Error Handling**
```typescript
// Define Result type for consistent error handling
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// Helper functions
const Result = {
  success: <T>(data: T): Result<T, never> => ({ success: true, data }),
  failure: <E>(error: E): Result<never, E> => ({ success: false, error }),
};

// Usage example
async function fetchInspection(id: InspectionId): Promise<Result<Inspection, InspectionError>> {
  try {
    const inspection = await api.getInspection(id);
    return Result.success(inspection);
  } catch (error) {
    return Result.failure(new InspectionError('Failed to fetch inspection', { cause: error }));
  }
}
```

### **Exhaustive Type Guards**
```typescript
// ✅ GOOD: Exhaustive type checking
type InspectionStatus = 'draft' | 'in_progress' | 'completed' | 'failed';

function getStatusColor(status: InspectionStatus): string {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'in_progress':
      return 'blue';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    default:
      // TypeScript will catch if we miss a case
      const _exhaustiveCheck: never = status;
      throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
  }
}
```

## **⚛️ REACT COMPONENT PATTERNS**

### **Component Structure Template**
```typescript
/**
 * InspectionCard - Displays inspection summary with actions
 * 
 * @param inspection - The inspection data to display
 * @param onEdit - Callback when user clicks edit
 * @param onDelete - Callback when user clicks delete
 * @param className - Additional CSS classes
 */
interface InspectionCardProps {
  inspection: Inspection;
  onEdit: (id: InspectionId) => void;
  onDelete: (id: InspectionId) => void;
  className?: string;
}

export const InspectionCard: React.FC<InspectionCardProps> = ({
  inspection,
  onEdit,
  onDelete,
  className = ''
}) => {
  // Hooks at the top
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized values
  const statusColor = useMemo(() => getStatusColor(inspection.status), [inspection.status]);
  const formattedDate = useMemo(() => formatDate(inspection.createdAt), [inspection.createdAt]);

  // Event handlers
  const handleEdit = useCallback(() => {
    onEdit(inspection.id);
  }, [onEdit, inspection.id]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this inspection?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onDelete(inspection.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inspection');
    } finally {
      setIsLoading(false);
    }
  }, [onDelete, inspection.id]);

  // Early returns for loading/error states
  if (isLoading) {
    return <InspectionCardSkeleton />;
  }

  if (error) {
    return <ErrorCard message={error} onRetry={() => setError(null)} />;
  }

  // Main render
  return (
    <Card className={`inspection-card ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{inspection.property.name}</CardTitle>
          <Badge variant={statusColor}>{inspection.status}</Badge>
        </div>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600">
          {inspection.checklistItems.length} items • {inspection.completionPercentage}% complete
        </p>
      </CardContent>
      
      <CardActions>
        <Button variant="outline" onClick={handleEdit}>
          Edit
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </CardActions>
    </Card>
  );
};

// Default export with display name for debugging
InspectionCard.displayName = 'InspectionCard';
export default InspectionCard;
```

### **Custom Hook Pattern**
```typescript
/**
 * useInspectionForm - Manages inspection form state and validation
 * 
 * @param initialData - Initial form data
 * @param onSubmit - Callback when form is submitted
 * @returns Form state and handlers
 */
interface UseInspectionFormProps {
  initialData?: Partial<CreateInspectionRequest>;
  onSubmit: (data: CreateInspectionRequest) => Promise<void>;
}

interface UseInspectionFormReturn {
  data: CreateInspectionRequest;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  updateField: (field: keyof CreateInspectionRequest, value: any) => void;
  submit: () => Promise<void>;
  reset: () => void;
}

export const useInspectionForm = ({ 
  initialData = {}, 
  onSubmit 
}: UseInspectionFormProps): UseInspectionFormReturn => {
  // State management
  const [data, setData] = useState<CreateInspectionRequest>({
    propertyId: '',
    scheduledDate: new Date(),
    notes: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation logic
  const validateForm = useCallback((formData: CreateInspectionRequest): Record<string, string> => {
    const validationErrors: Record<string, string> = {};

    if (!formData.propertyId) {
      validationErrors.propertyId = 'Property is required';
    }

    if (!formData.scheduledDate) {
      validationErrors.scheduledDate = 'Scheduled date is required';
    } else if (formData.scheduledDate < new Date()) {
      validationErrors.scheduledDate = 'Scheduled date cannot be in the past';
    }

    return validationErrors;
  }, []);

  // Memoized validation
  const currentErrors = useMemo(() => validateForm(data), [data, validateForm]);
  const isValid = useMemo(() => Object.keys(currentErrors).length === 0, [currentErrors]);

  // Update field handler
  const updateField = useCallback((field: keyof CreateInspectionRequest, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Submit handler
  const submit = useCallback(async () => {
    setErrors(currentErrors);
    
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      // Handle submission errors
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({ general: 'Failed to create inspection. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [data, currentErrors, isValid, onSubmit]);

  // Reset handler
  const reset = useCallback(() => {
    setData({ propertyId: '', scheduledDate: new Date(), notes: '', ...initialData });
    setErrors({});
  }, [initialData]);

  return {
    data,
    errors: currentErrors,
    isValid,
    isSubmitting,
    updateField,
    submit,
    reset
  };
};
```

## **🚀 PERFORMANCE OPTIMIZATION**

### **Memoization Best Practices**
```typescript
// ✅ GOOD: Memoize expensive calculations
const ExpensiveComponent: React.FC<{ data: ComplexData[] }> = ({ data }) => {
  const processedData = useMemo(() => {
    return data
      .filter(item => item.isActive)
      .sort((a, b) => b.priority - a.priority)
      .map(item => ({
        ...item,
        displayName: `${item.name} (${item.status})`
      }));
  }, [data]);

  return (
    <div>
      {processedData.map(item => (
        <MemoizedItem key={item.id} item={item} />
      ))}
    </div>
  );
};

// Memoized child component
const MemoizedItem = React.memo<{ item: ProcessedItem }>(({ item }) => (
  <div className="item">
    <h3>{item.displayName}</h3>
    <p>{item.description}</p>
  </div>
));
```

### **Lazy Loading Pattern**
```typescript
// ✅ GOOD: Lazy load heavy components
const LazyInspectionDetails = React.lazy(() => import('./InspectionDetails'));
const LazyReportGenerator = React.lazy(() => import('./ReportGenerator'));

const InspectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'report'>('overview');

  return (
    <div>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <Suspense fallback={<LoadingSpinner />}>
        {activeTab === 'overview' && <InspectionOverview />}
        {activeTab === 'details' && <LazyInspectionDetails />}
        {activeTab === 'report' && <LazyReportGenerator />}
      </Suspense>
    </div>
  );
};
```

## **🔒 SECURITY STANDARDS**

### **Input Validation**
```typescript
import { z } from 'zod';

// ✅ GOOD: Comprehensive validation schema
const CreateInspectionSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  scheduledDate: z.date().min(new Date(), 'Scheduled date must be in the future'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  checklistItems: z.array(z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(500, 'Description too long').optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    required: z.boolean().default(false)
  })).min(1, 'At least one checklist item is required')
});

// Validation helper
export const validateCreateInspection = (data: unknown): Result<CreateInspectionRequest, ValidationError> => {
  try {
    const validatedData = CreateInspectionSchema.parse(data);
    return Result.success(validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Result.failure(new ValidationError(error.errors));
    }
    return Result.failure(new ValidationError('Invalid input data'));
  }
};
```

### **Authentication Patterns**
```typescript
// ✅ GOOD: Role-based access control
const useAuthGuard = (requiredRole: UserRole) => {
  const { user, isLoading } = useAuth();

  const hasAccess = useMemo(() => {
    if (!user) return false;
    
    const roleHierarchy = {
      admin: ['admin', 'auditor', 'inspector'],
      auditor: ['auditor', 'inspector'],
      inspector: ['inspector']
    };

    return roleHierarchy[requiredRole]?.includes(user.role) ?? false;
  }, [user, requiredRole]);

  return { hasAccess, isLoading, user };
};

// Usage in component
const AdminPanel: React.FC = () => {
  const { hasAccess, isLoading } = useAuthGuard('admin');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return <AdminPanelContent />;
};
```

## **🧪 TESTING STANDARDS**

### **Unit Test Template**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InspectionCard } from './InspectionCard';
import { mockInspection } from '../__mocks__/inspection';

describe('InspectionCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders inspection information correctly', () => {
    render(
      <InspectionCard
        inspection={mockInspection}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(mockInspection.property.name)).toBeInTheDocument();
    expect(screen.getByText(mockInspection.status)).toBeInTheDocument();
    expect(screen.getByText(/\d+ items/)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <InspectionCard
        inspection={mockInspection}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockInspection.id);
  });

  it('shows confirmation dialog before deletion', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <InspectionCard
        inspection={mockInspection}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    
    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to delete this inspection?'
    );
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockInspection.id);
    });
  });

  it('handles deletion errors gracefully', async () => {
    const error = new Error('Failed to delete');
    mockOnDelete.mockRejectedValueOnce(error);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <InspectionCard
        inspection={mockInspection}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete inspection')).toBeInTheDocument();
    });
  });
});
```

## **🎨 STYLING STANDARDS**

### **Tailwind CSS Patterns**
```typescript
// ✅ GOOD: Organized Tailwind classes
const cardStyles = {
  base: 'rounded-lg border border-gray-200 shadow-sm',
  hover: 'hover:shadow-md transition-shadow duration-200',
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500',
  mobile: 'px-4 py-3 sm:px-6 sm:py-4'
};

const InspectionCard = () => (
  <div className={`${cardStyles.base} ${cardStyles.hover} ${cardStyles.mobile}`}>
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900">
        Inspection Title
      </h3>
      <Badge className="bg-green-100 text-green-800">
        Completed
      </Badge>
    </div>
  </div>
);
```

### **CSS Custom Properties**
```css
/* ✅ GOOD: Consistent design tokens */
:root {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  --border-radius: 0.5rem;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

## **📝 DOCUMENTATION REQUIREMENTS**

### **Function Documentation**
```typescript
/**
 * Calculates the completion percentage for an inspection
 * 
 * This function considers both completed and not-applicable items as "done"
 * since not-applicable items don't need to be completed but should count
 * toward the overall progress.
 * 
 * @param items - Array of checklist items to analyze
 * @returns Percentage (0-100) of completion
 * 
 * @example
 * ```typescript
 * const items = [
 *   { status: 'completed' },
 *   { status: 'pending' },
 *   { status: 'not_applicable' }
 * ];
 * const percentage = calculateCompletionPercentage(items);
 * console.log(percentage); // 66.67 (2 out of 3 items are "done")
 * ```
 */
export const calculateCompletionPercentage = (items: ChecklistItem[]): number => {
  if (items.length === 0) return 0;
  
  const completedCount = items.filter(
    item => item.status === 'completed' || item.status === 'not_applicable'
  ).length;
  
  return Math.round((completedCount / items.length) * 100);
};
```

### **Component Documentation**
```typescript
/**
 * ChecklistItem - Interactive checklist item component
 * 
 * This component handles the display and interaction for individual checklist items
 * during an inspection. It supports photo uploads, notes, and status changes.
 * 
 * Features:
 * - Photo upload with preview
 * - Status management (pending, completed, failed, not_applicable)
 * - Notes with character limit
 * - Offline capability with sync indicator
 * - Accessibility support with ARIA labels
 * 
 * @param item - The checklist item data
 * @param onUpdate - Callback when item is updated
 * @param onPhotoUpload - Callback when photo is uploaded
 * @param readonly - Whether the item is in read-only mode
 * 
 * @example
 * ```tsx
 * <ChecklistItem
 *   item={checklistItem}
 *   onUpdate={(id, changes) => updateItem(id, changes)}
 *   onPhotoUpload={(file) => uploadPhoto(file)}
 *   readonly={false}
 * />
 * ```
 */
interface ChecklistItemProps {
  item: ChecklistItem;
  onUpdate: (id: string, changes: Partial<ChecklistItem>) => void;
  onPhotoUpload: (file: File) => Promise<void>;
  readonly?: boolean;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({ ... }) => {
  // Implementation
};
```

## **🔄 CONTINUOUS IMPROVEMENT**

### **Code Review Checklist**
- [ ] All functions have JSDoc documentation
- [ ] No `any` types used
- [ ] Proper error handling implemented
- [ ] Performance considerations addressed
- [ ] Security vulnerabilities checked
- [ ] Accessibility standards met
- [ ] Mobile responsiveness verified
- [ ] Tests written and passing
- [ ] Consistent code style
- [ ] No console.log statements

### **Refactoring Guidelines**
1. **Single Responsibility Principle** - Each function/component does one thing well
2. **Don't Repeat Yourself** - Extract common logic into reusable utilities
3. **Keep It Simple** - Prefer clear, readable code over clever solutions
4. **Test-Driven Development** - Write tests first when fixing bugs
5. **Progressive Enhancement** - Start with basic functionality, add features incrementally

---

## **🎯 CONCLUSION**

Following these standards ensures that every AI coder can:
- Understand the codebase instantly
- Extend functionality without breaking existing code
- Write maintainable, secure, and performant code
- Collaborate effectively with other AI coders
- Deliver production-ready features consistently

Remember: **We're not just writing code, we're crafting art.** 🎨✨