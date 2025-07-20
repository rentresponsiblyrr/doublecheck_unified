# 🏗️ ARCHITECTURAL PRINCIPLES FOR AI ENGINEERS

## **CORE PRINCIPLE: SIMPLICITY OVER CLEVERNESS**

Every line of code should be **obvious, direct, and necessary**. If you need extensive documentation to explain basic functionality, your code is too complex.

---

## **REACT ARCHITECTURE RULES**

### **1. COMPONENT RESPONSIBILITY**
```typescript
// ✅ GOOD: Single responsibility
const UserProfile = ({ userId }) => {
  // ONLY handles user profile display
  const user = useUser(userId);
  return <ProfileCard user={user} />;
};

// ❌ BAD: Multiple responsibilities
const UserProfileWithEditingAndNotificationsAndAnalytics = ({ userId }) => {
  // Handles profile, editing, notifications, analytics...
  // 500+ lines of mixed concerns
};
```

**RULE**: If your component name has "And" in it, it's doing too much.

### **2. HOOK DEPENDENCIES ARE NOT OPTIONAL**
```typescript
// ✅ GOOD: Honest about dependencies
const useUserData = (userId) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // Honest dependency array
  
  return user;
};

// ❌ BAD: Lying to React
const useUserData = (userId) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // LYING - userId is used but not declared
  
  return user;
};
```

**RULE**: If you remove dependencies to "fix" infinite loops, you're fixing the wrong thing.

### **3. MEMOIZATION STRATEGY**
```typescript
// ✅ GOOD: Memoize expensive calculations
const ExpensiveList = ({ items, filter }) => {
  const filteredItems = useMemo(() =>
    items.filter(item => item.category === filter),
    [items, filter]
  );
  
  return <List items={filteredItems} />;
};

// ❌ BAD: Recreating objects on every render
const ExpensiveList = ({ items, filter }) => {
  // This creates new array on every render
  const filteredItems = items.filter(item => item.category === filter);
  return <List items={filteredItems} />;
};
```

**RULE**: Objects, arrays, and functions should be memoized if passed as props or dependencies.

---

## **STATE MANAGEMENT ARCHITECTURE**

### **1. SINGLE SOURCE OF TRUTH**
```typescript
// ✅ GOOD: Centralized state
interface AppState {
  user: User | null;
  properties: Property[];
  activeInspection: Inspection | null;
}

// ❌ BAD: Scattered state
const Component1 = () => {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
};

const Component2 = () => {
  const [user, setUser] = useState(null); // Duplicate state!
  const [inspection, setInspection] = useState(null);
};
```

**RULE**: If the same data exists in multiple components, it belongs in shared state.

### **2. ACTION-BASED UPDATES**
```typescript
// ✅ GOOD: Predictable state updates
const useInspectionStore = create((set) => ({
  properties: [],
  
  actions: {
    loadProperties: async () => {
      const properties = await fetchProperties();
      set({ properties });
    },
    
    selectProperty: (propertyId) => {
      set((state) => ({ 
        selectedPropertyId: propertyId 
      }));
    }
  }
}));

// ❌ BAD: Direct state mutations
const Component = () => {
  const [properties, setProperties] = useState([]);
  
  // Scattered state updates throughout component
  const handleClick = () => {
    setProperties(prev => prev.map(p => 
      p.id === id ? { ...p, selected: true } : p
    ));
  };
};
```

**RULE**: State updates should be centralized in named actions, not scattered throughout components.

---

## **DATABASE OPERATION PATTERNS**

### **1. DIRECT, TYPED OPERATIONS**
```typescript
// ✅ GOOD: Simple, direct database operations
const createInspection = async (propertyId: string): Promise<Inspection> => {
  const { data, error } = await supabase
    .from('inspections')
    .insert({ property_id: propertyId, status: 'draft' })
    .select()
    .single();
    
  if (error) throw new DatabaseError(error.message);
  return data;
};

// ❌ BAD: Over-engineered service layers
class InspectionCreationService {
  constructor(
    private validationService: ValidationService,
    private databaseService: DatabaseService,
    private retryService: RetryService,
    private loggingService: LoggingService
  ) {}
  
  async create(data: any): Promise<any> {
    const validated = await this.validationService.validate(data);
    const retryable = await this.retryService.withRetry(
      () => this.databaseService.insert(validated)
    );
    await this.loggingService.log(retryable);
    return retryable;
  }
}
```

**RULE**: If you need more than 3 layers of abstraction, you're over-engineering.

### **2. ERROR HANDLING PATTERNS**
```typescript
// ✅ GOOD: Specific error handling
const fetchUserData = async (userId: string) => {
  try {
    return await api.getUser(userId);
  } catch (error) {
    if (error.status === 404) {
      throw new UserNotFoundError(`User ${userId} not found`);
    }
    if (error.status === 403) {
      throw new UnauthorizedError('Insufficient permissions');
    }
    throw new APIError('Failed to fetch user data');
  }
};

// ❌ BAD: Generic error handling
const fetchUserData = async (userId: string) => {
  try {
    return await api.getUser(userId);
  } catch (error) {
    console.error('Error:', error);
    window.location.reload(); // Nuclear option
  }
};
```

**RULE**: Errors should be specific, recoverable, and never require full page reload.

---

## **PERFORMANCE PRINCIPLES**

### **1. RENDER OPTIMIZATION**
```typescript
// ✅ GOOD: Optimized rendering
const UserList = memo(({ users, onUserClick }) => {
  const handleClick = useCallback((userId) => {
    onUserClick(userId);
  }, [onUserClick]);
  
  return (
    <div>
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onClick={handleClick}
        />
      ))}
    </div>
  );
});

// ❌ BAD: Render thrashing
const UserList = ({ users, onUserClick }) => {
  return (
    <div>
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onClick={(userId) => onUserClick(userId)} // New function every render
        />
      ))}
    </div>
  );
};
```

**RULE**: Avoid creating new objects, arrays, or functions during render.

### **2. BUNDLE SIZE MANAGEMENT**
```typescript
// ✅ GOOD: Tree-shaking friendly imports
import { debounce } from 'lodash-es';
import { format } from 'date-fns/format';

// ❌ BAD: Entire library imports
import * as _ from 'lodash';
import * as dateFns from 'date-fns';
```

**RULE**: Import only what you use. Monitor bundle size in CI/CD.

---

## **TESTING REQUIREMENTS**

### **1. COMPONENT TESTING**
```typescript
// ✅ GOOD: Testing user interactions
describe('PropertySelector', () => {
  it('selects property when clicked', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    
    render(<PropertySelector properties={mockProperties} onSelect={onSelect} />);
    
    await user.click(screen.getByText('Property 1'));
    
    expect(onSelect).toHaveBeenCalledWith('property-1');
  });
});

// ❌ BAD: Testing implementation details
describe('PropertySelector', () => {
  it('has correct state', () => {
    const component = mount(<PropertySelector />);
    expect(component.state().selectedId).toBe(null);
  });
});
```

**RULE**: Test behavior, not implementation. Users don't care about internal state.

### **2. INTEGRATION TESTING**
```typescript
// ✅ GOOD: Testing complete workflows
describe('Inspection Creation Flow', () => {
  it('creates inspection when property selected', async () => {
    const user = userEvent.setup();
    
    render(<InspectorApp />);
    
    // Load properties
    await waitFor(() => 
      expect(screen.getByText('Mountain View Cabin')).toBeInTheDocument()
    );
    
    // Select property
    await user.click(screen.getByText('Mountain View Cabin'));
    
    // Start inspection
    await user.click(screen.getByText('Start Inspection'));
    
    // Verify inspection created
    await waitFor(() =>
      expect(screen.getByText('Inspection Started')).toBeInTheDocument()
    );
  });
});
```

**RULE**: Integration tests should cover critical user journeys end-to-end.

---

## **ANTI-PATTERNS TO AVOID**

### **1. THE GOD COMPONENT**
```typescript
// ❌ BAD: Component doing everything
const InspectorWorkflow = () => {
  // 1000+ lines handling:
  // - Property selection
  // - Inspection creation
  // - Photo capture
  // - Video recording
  // - Sync operations
  // - Error handling
  // - Analytics
  // - Offline storage
};
```

**RULE**: If your component is >200 lines, it's doing too much.

### **2. THE SERVICE LAYER PYRAMID**
```typescript
// ❌ BAD: Unnecessary abstraction layers
class InspectionService {
  constructor(
    private repo: InspectionRepository,
    private validator: InspectionValidator,
    private processor: InspectionProcessor,
    private notifier: InspectionNotifier
  ) {}
}
```

**RULE**: Each abstraction layer should provide clear value. Don't abstract for abstraction's sake.

### **3. THE ANY TYPE ESCAPE HATCH**
```typescript
// ❌ BAD: Giving up on type safety
const processData = (data: any) => {
  return data.something.maybe.exists;
};

// ✅ GOOD: Proper typing
interface ProcessableData {
  items: Item[];
  metadata: {
    count: number;
    hasMore: boolean;
  };
}

const processData = (data: ProcessableData) => {
  return data.items.map(item => item.id);
};
```

**RULE**: `any` and `unknown` are failures of type system design. Fix the types, don't escape them.

---

## **SUCCESS METRICS**

Every feature must meet these criteria:

### **PERFORMANCE**
- Component render time <100ms
- Bundle size increase <50KB per feature
- Zero memory leaks during 1-hour usage
- Network requests debounced/cached appropriately

### **RELIABILITY**
- Zero console errors during normal operation
- Graceful degradation when offline
- Proper error recovery without page reload
- 90%+ uptime in production

### **MAINTAINABILITY**
- Component complexity <10 (cyclomatic)
- Function length <50 lines
- Clear, self-documenting code
- Comprehensive test coverage >80%

### **USER EXPERIENCE**
- Sub-200ms interaction response times
- Clear loading and error states
- Accessible to screen readers (WCAG 2.1)
- Works reliably on mobile devices

---

## **ENFORCEMENT**

These principles are enforced through:

1. **Code Review Checklist** - Every PR must pass architectural review
2. **Automated Testing** - Performance and bundle size gates in CI/CD
3. **Static Analysis** - ESLint rules for complexity and patterns
4. **Regular Audits** - Monthly architecture reviews

**Remember**: Complexity is the enemy of reliability. Simple, obvious code is easier to debug, test, and maintain than clever abstractions.

---

*Established by: CTO Office*  
*Effective: Immediately*  
*Review: Monthly*  
*Enforcement: Mandatory for all AI engineers*