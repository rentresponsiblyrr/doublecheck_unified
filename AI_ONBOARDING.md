# 🚀 AI ONBOARDING GUIDE FOR STR CERTIFIED

*Your complete guide to becoming a productive AI coder on the STR Certified platform*

## **🎯 WELCOME TO THE TEAM!**

Welcome to STR Certified! This guide will help you understand our codebase, follow our standards, and contribute effectively from day one. We've designed this to be your comprehensive reference for everything you need to know.

## **📚 REQUIRED READING (Complete in Order)**

### **Phase 1: Foundation (30 minutes)**
1. **[CLAUDE.md](./CLAUDE.md)** - Core principles and your role as Senior Software Engineer
2. **[ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)** - System architecture and design patterns
3. **[AI_CODING_STANDARDS.md](./AI_CODING_STANDARDS.md)** - Coding standards and best practices

### **Phase 2: Implementation (45 minutes)**
4. **[COMPONENT_PATTERNS.md](./COMPONENT_PATTERNS.md)** - Reusable component patterns
5. **[COMMON_PATTERNS.md](./COMMON_PATTERNS.md)** - Standard patterns for hooks, components, services
6. **[TESTING_STANDARDS.md](./TESTING_STANDARDS.md)** - Testing patterns and requirements

### **Phase 3: Production Readiness (30 minutes)**
7. **[SECURITY_GUIDELINES.md](./SECURITY_GUIDELINES.md)** - Security best practices
8. **[PERFORMANCE_STANDARDS.md](./PERFORMANCE_STANDARDS.md)** - Performance optimization
9. **[ACCESSIBILITY_GUIDE.md](./ACCESSIBILITY_GUIDE.md)** - WCAG compliance standards

## **🏁 QUICK START CHECKLIST**

### **Before You Start Coding**
- [ ] Read all required documentation above
- [ ] Understand the project structure and domains
- [ ] Familiarize yourself with the technology stack
- [ ] Review existing components in the codebase
- [ ] Understand our Git workflow and conventions

### **Your First Task**
- [ ] Clone the repository and explore the codebase
- [ ] Run the application locally
- [ ] Create a simple component following our patterns
- [ ] Write tests for your component
- [ ] Submit for code review

## **🗂️ PROJECT STRUCTURE OVERVIEW**

```
doublecheck-field-view/
├── 📁 src/
│   ├── 📁 domains/              # Business logic by domain
│   │   ├── 📁 inspection/       # Inspection-related components
│   │   ├── 📁 audit/           # Audit-related components
│   │   ├── 📁 property/        # Property-related components
│   │   └── 📁 user/            # User management
│   ├── 📁 shared/              # Cross-domain shared code
│   │   ├── 📁 components/ui/   # Reusable UI components
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   ├── 📁 services/        # API and business services
│   │   ├── 📁 utils/           # Utility functions
│   │   └── 📁 types/           # TypeScript type definitions
│   ├── 📁 infrastructure/      # External concerns
│   │   ├── 📁 api/             # API layer
│   │   ├── 📁 monitoring/      # Logging and metrics
│   │   └── 📁 security/        # Auth and security
│   └── 📁 app/                 # Application bootstrap
├── 📁 docs/                    # Documentation (YOU ARE HERE!)
├── 📁 tests/                   # Test files
├── 📄 package.json             # Dependencies and scripts
├── 📄 tsconfig.json            # TypeScript configuration
├── 📄 vite.config.ts           # Build configuration
└── 📄 railway.json             # Deployment configuration
```

## **🧠 UNDERSTANDING OUR DOMAINS**

### **1. Inspection Domain**
**Purpose**: Manage property inspections from creation to completion
**Key Components**:
- `InspectionCard` - Display inspection summaries
- `ChecklistItem` - Interactive checklist items
- `PhotoCapture` - Mobile-optimized photo capture
- `InspectionForm` - Create/edit inspections

**Key Hooks**:
- `useInspection` - Manage inspection state
- `useChecklistItems` - Handle checklist operations
- `usePhotoUpload` - Handle photo uploads

### **2. Audit Domain**
**Purpose**: Review and provide feedback on inspections
**Key Components**:
- `AuditDashboard` - Overview of pending audits
- `VideoReview` - Video playback with annotations
- `FeedbackForm` - Structured feedback collection
- `AccuracyMetrics` - AI performance tracking

**Key Hooks**:
- `useAudit` - Manage audit sessions
- `useVideoPlayer` - Video playback controls
- `useFeedback` - Collect and submit feedback

### **3. Property Domain**
**Purpose**: Manage property information and listings
**Key Components**:
- `PropertyCard` - Property display component
- `PropertyForm` - Add/edit property details
- `AmenitySelector` - Select property amenities
- `PropertyScraper` - Import from listing sites

**Key Hooks**:
- `useProperty` - Property CRUD operations
- `usePropertyScraper` - Scrape listing data
- `useAmenities` - Manage property amenities

## **💡 CODING WORKFLOW**

### **Step 1: Understanding the Task**
1. **Read the requirement carefully** - What exactly needs to be built?
2. **Identify the domain** - Which business domain does this belong to?
3. **Check existing patterns** - Are there similar components already?
4. **Plan the approach** - How will this integrate with existing code?

### **Step 2: Setup and Planning**
```typescript
// 1. Create your todo list
import { TodoWrite } from '@/tools/TodoWrite';

// 2. Break down the task
const todos = [
  { content: "Research existing components", status: "pending", priority: "high" },
  { content: "Create component interface", status: "pending", priority: "high" },
  { content: "Implement core functionality", status: "pending", priority: "high" },
  { content: "Add error handling", status: "pending", priority: "medium" },
  { content: "Write tests", status: "pending", priority: "medium" },
  { content: "Add documentation", status: "pending", priority: "medium" }
];
```

### **Step 3: Implementation**
```typescript
// 1. Start with the interface
interface ComponentProps {
  // Define your props with proper types
}

// 2. Use our standard component structure
export const ComponentName: React.FC<ComponentProps> = ({ ... }) => {
  // Follow the pattern from COMPONENT_PATTERNS.md
};

// 3. Add proper documentation
/**
 * ComponentName - Brief description
 * 
 * Detailed explanation and usage examples
 * 
 * @param prop - Description
 * @returns JSX.Element
 */
```

### **Step 4: Testing**
```typescript
// 1. Write comprehensive tests
describe('ComponentName', () => {
  it('renders correctly', () => {
    // Test basic rendering
  });
  
  it('handles user interactions', () => {
    // Test event handlers
  });
  
  it('handles errors gracefully', () => {
    // Test error scenarios
  });
});
```

### **Step 5: Code Review**
- [ ] Component follows our patterns
- [ ] Code is properly documented
- [ ] Tests are comprehensive
- [ ] Accessibility is implemented
- [ ] Performance is optimized
- [ ] Security is considered

## **🔧 DEVELOPMENT TOOLS**

### **Required Tools**
- **Node.js 20+** - Runtime environment
- **npm** - Package manager
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Vitest** - Testing framework

### **Recommended VS Code Extensions**
- **TypeScript Importer** - Auto-import management
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Tailwind CSS IntelliSense** - CSS class completion
- **Auto Rename Tag** - HTML/JSX tag renaming

### **Development Commands**
```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## **🎨 STYLING GUIDELINES**

### **Tailwind CSS Classes**
```typescript
// ✅ GOOD: Organized and consistent
const buttonClasses = {
  base: 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2',
  primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
};

// ❌ BAD: Inline classes everywhere
<button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
```

### **Mobile-First Approach**
```css
/* ✅ GOOD: Mobile-first responsive design */
.component {
  @apply p-4 text-sm;
  
  @screen sm {
    @apply p-6 text-base;
  }
  
  @screen md {
    @apply p-8 text-lg;
  }
}
```

## **🔒 SECURITY BEST PRACTICES**

### **Input Validation**
```typescript
// ✅ GOOD: Always validate inputs
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18)
});

const validateInput = (data: unknown) => {
  return schema.safeParse(data);
};
```

### **Authentication Patterns**
```typescript
// ✅ GOOD: Proper auth handling
const useAuthGuard = (requiredRole: UserRole) => {
  const { user, isLoading } = useAuth();
  
  const hasAccess = useMemo(() => {
    if (!user) return false;
    return user.role === requiredRole;
  }, [user, requiredRole]);
  
  return { hasAccess, isLoading };
};
```

## **📊 PERFORMANCE OPTIMIZATION**

### **React Performance**
```typescript
// ✅ GOOD: Proper memoization
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.filter(item => item.isActive);
  }, [data]);
  
  return <div>{processedData.map(item => ...)}</div>;
});

// ✅ GOOD: Lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

### **Bundle Optimization**
```typescript
// ✅ GOOD: Tree shaking friendly imports
import { debounce } from 'lodash-es';

// ❌ BAD: Imports entire library
import _ from 'lodash';
```

## **♿ ACCESSIBILITY REQUIREMENTS**

### **WCAG 2.1 Compliance**
```typescript
// ✅ GOOD: Proper ARIA labels and roles
<button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
  onClick={onClose}
>
  ×
</button>

// ✅ GOOD: Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    onClick();
  }
};
```

### **Color Contrast**
- **Normal text**: 4.5:1 contrast ratio
- **Large text**: 3:1 contrast ratio
- **Interactive elements**: Clear focus indicators

## **🧪 TESTING STANDARDS**

### **Test Types**
1. **Unit Tests** - Individual components and functions
2. **Integration Tests** - Component interactions
3. **E2E Tests** - User workflows
4. **Accessibility Tests** - WCAG compliance

### **Testing Template**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  const mockProps = {
    // Mock props here
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly', () => {
    render(<ComponentName {...mockProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interactions', () => {
    const mockHandler = vi.fn();
    render(<ComponentName {...mockProps} onClick={mockHandler} />);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(mockHandler).toHaveBeenCalledWith(expectedArgs);
  });
});
```

## **📝 DOCUMENTATION STANDARDS**

### **Component Documentation**
```typescript
/**
 * ComponentName - Brief description of what this component does
 * 
 * Detailed explanation of the component's purpose, features, and usage.
 * Include any important behavioral notes or constraints.
 * 
 * Features:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 * 
 * @param prop1 - Description of prop1
 * @param prop2 - Description of prop2
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={data}
 *   className="custom-class"
 * />
 * ```
 */
```

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
 * console.log(percentage); // 66.67
 * ```
 */
```

## **🚨 COMMON PITFALLS TO AVOID**

### **1. Not Following Domain Structure**
```typescript
// ❌ BAD: Mixing domain concerns
import { inspectionService } from '@/domains/inspection/services';
import { auditService } from '@/domains/audit/services';

// ✅ GOOD: Keep domain logic separate
import { inspectionService } from '@/domains/inspection/services';
// Use inspection domain only
```

### **2. Missing Error Handling**
```typescript
// ❌ BAD: No error handling
const fetchData = async () => {
  const response = await api.getData();
  return response.data;
};

// ✅ GOOD: Proper error handling
const fetchData = async (): Promise<Result<Data, Error>> => {
  try {
    const response = await api.getData();
    return Result.success(response.data);
  } catch (error) {
    return Result.failure(error as Error);
  }
};
```

### **3. Performance Issues**
```typescript
// ❌ BAD: Expensive operations without memoization
const ExpensiveComponent = ({ data }) => {
  const processedData = data.filter(item => item.isActive); // Runs on every render
  return <div>{processedData.map(...)}</div>;
};

// ✅ GOOD: Proper memoization
const ExpensiveComponent = ({ data }) => {
  const processedData = useMemo(() => {
    return data.filter(item => item.isActive);
  }, [data]);
  return <div>{processedData.map(...)}</div>;
};
```

### **4. Accessibility Violations**
```typescript
// ❌ BAD: Missing accessibility attributes
<div onClick={handleClick}>Click me</div>

// ✅ GOOD: Proper accessibility
<button
  onClick={handleClick}
  aria-label="Descriptive action"
  type="button"
>
  Click me
</button>
```

## **🔄 CONTINUOUS LEARNING**

### **Stay Updated**
- **Code Reviews** - Learn from feedback
- **Documentation** - Keep docs updated
- **Best Practices** - Follow industry standards
- **Team Discussions** - Share knowledge

### **Resources**
- **React Documentation** - https://react.dev/
- **TypeScript Handbook** - https://www.typescriptlang.org/docs/
- **Tailwind CSS** - https://tailwindcss.com/docs
- **Testing Library** - https://testing-library.com/docs/
- **Accessibility Guide** - https://www.w3.org/WAI/WCAG21/quickref/

## **📞 GETTING HELP**

### **When You're Stuck**
1. **Check the documentation** - Start with our guides
2. **Search the codebase** - Look for similar patterns
3. **Review existing tests** - See how others tested similar features
4. **Ask questions** - Don't hesitate to ask for clarification

### **Code Review Process**
1. **Self-review first** - Check your own code
2. **Run tests** - Ensure everything passes
3. **Check accessibility** - Verify WCAG compliance
4. **Performance check** - Ensure mobile optimization
5. **Documentation** - Update relevant docs

## **🎯 SUCCESS METRICS**

### **You're Succeeding When:**
- [ ] You can navigate the codebase confidently
- [ ] You follow our coding standards consistently
- [ ] Your components are reusable and maintainable
- [ ] Your code passes all tests and reviews
- [ ] You contribute to documentation and knowledge sharing

### **Quality Checklist**
- [ ] Code follows our patterns
- [ ] Documentation is comprehensive
- [ ] Tests cover edge cases
- [ ] Accessibility is implemented
- [ ] Performance is optimized
- [ ] Security is considered

---

## **🎉 WELCOME TO THE TEAM!**

You now have everything you need to be successful on the STR Certified platform. Remember:

1. **Quality over speed** - We value well-crafted code
2. **Documentation is key** - Help future AI coders
3. **Test everything** - Prevent bugs before they happen
4. **Think mobile-first** - Our users are on mobile devices
5. **Security matters** - Protect our users' data

**Let's build something amazing together!** 🚀

---

*This guide is living documentation. Please update it as you learn and grow with the platform.*