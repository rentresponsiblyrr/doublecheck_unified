# 🐛 DEBUGGING GUIDE FOR STR CERTIFIED

*Your comprehensive guide to identifying, diagnosing, and resolving common issues in the STR Certified platform*

## **🎯 DEBUGGING PHILOSOPHY**

Effective debugging is about systematic investigation, not random guessing. Our approach follows these principles:

- **Reproduce First** - Can you consistently recreate the issue?
- **Isolate the Problem** - Narrow down to the specific component or function
- **Understand the Context** - What changed? What environment? What data?
- **Fix the Root Cause** - Don't just patch symptoms
- **Test Thoroughly** - Verify the fix works in all scenarios
- **Document the Solution** - Help future developers avoid the same issue

## **🔍 DEBUGGING WORKFLOW**

### **Step 1: Gather Information**
```typescript
// Debug information template
const debugInfo = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  userAgent: navigator.userAgent,
  url: window.location.href,
  userId: user?.id,
  sessionId: getSessionId(),
  errorMessage: error.message,
  stackTrace: error.stack,
  componentStack: errorInfo.componentStack,
  props: JSON.stringify(props, null, 2),
  state: JSON.stringify(state, null, 2),
  context: {
    // Any relevant context
  }
};
```

### **Step 2: Systematic Investigation**
1. **Check the console** - Look for error messages and warnings
2. **Review the network tab** - Check for failed API calls
3. **Inspect the component tree** - Use React DevTools
4. **Examine the state** - Check Redux/Zustand state
5. **Test in isolation** - Create a minimal reproduction
6. **Check recent changes** - What was modified recently?

### **Step 3: Apply the Fix**
1. **Fix the root cause** - Not just the symptoms
2. **Add defensive code** - Prevent similar issues
3. **Update documentation** - Help others avoid the issue
4. **Add tests** - Ensure the fix works and prevents regression

## **🚨 COMMON ISSUES & SOLUTIONS**

### **1. React Component Issues**

#### **Issue: Component Not Re-rendering**
**Symptoms:**
- UI doesn't update when state changes
- Props changes not reflected
- Stale closure issues

**Debugging Steps:**
```typescript
// Add debug logging
useEffect(() => {
  console.log('Component rendered with props:', props);
  console.log('Current state:', state);
}, [props, state]);

// Check if props/state are actually changing
const prevProps = usePrevious(props);
const prevState = usePrevious(state);

useEffect(() => {
  if (prevProps !== props) {
    console.log('Props changed:', { prev: prevProps, current: props });
  }
  if (prevState !== state) {
    console.log('State changed:', { prev: prevState, current: state });
  }
}, [props, state, prevProps, prevState]);
```

**Common Causes & Solutions:**
```typescript
// ❌ PROBLEM: Mutating state directly
const addItem = (newItem) => {
  state.items.push(newItem); // This won't trigger re-render
  setState(state);
};

// ✅ SOLUTION: Create new state object
const addItem = (newItem) => {
  setState(prevState => ({
    ...prevState,
    items: [...prevState.items, newItem]
  }));
};

// ❌ PROBLEM: Dependencies not specified correctly
useEffect(() => {
  fetchData();
}, []); // Missing dependency

// ✅ SOLUTION: Include all dependencies
useEffect(() => {
  fetchData();
}, [fetchData]);

// ❌ PROBLEM: Comparing objects by reference
const isEqual = (prevProps, nextProps) => {
  return prevProps.data === nextProps.data; // Objects are always different
};

// ✅ SOLUTION: Deep comparison or memo
const isEqual = (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
};
```

#### **Issue: Infinite Re-renders**
**Symptoms:**
- "Maximum update depth exceeded" error
- Browser becomes unresponsive
- Memory usage spikes

**Debugging Steps:**
```typescript
// Add render counter
const renderCount = useRef(0);
renderCount.current += 1;
console.log(`Component rendered ${renderCount.current} times`);

// Check for infinite loops in useEffect
useEffect(() => {
  console.log('useEffect triggered with dependencies:', dependencies);
  // Your effect logic
}, [dependencies]);
```

**Common Causes & Solutions:**
```typescript
// ❌ PROBLEM: Creating new objects in render
const MyComponent = () => {
  const config = { setting: 'value' }; // New object every render
  
  useEffect(() => {
    // This will run every render
  }, [config]);
};

// ✅ SOLUTION: Memoize or move outside component
const MyComponent = () => {
  const config = useMemo(() => ({ setting: 'value' }), []);
  
  useEffect(() => {
    // This will only run when config actually changes
  }, [config]);
};

// ❌ PROBLEM: State update in render
const MyComponent = () => {
  const [count, setCount] = useState(0);
  
  setCount(count + 1); // This causes infinite loop
  
  return <div>{count}</div>;
};

// ✅ SOLUTION: Move state updates to event handlers or useEffect
const MyComponent = () => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // State update in effect with proper dependencies
    if (someCondition) {
      setCount(prev => prev + 1);
    }
  }, [someCondition]);
  
  return <div>{count}</div>;
};
```

### **2. API & Network Issues**

#### **Issue: API Calls Failing**
**Symptoms:**
- Network errors in console
- 404, 500, or other HTTP errors
- Timeout errors

**Debugging Steps:**
```typescript
// Enhanced API debugging
const debugApiCall = async (url: string, options: RequestInit = {}) => {
  console.group(`API Call: ${options.method || 'GET'} ${url}`);
  console.log('Request options:', options);
  console.log('Headers:', options.headers);
  console.log('Body:', options.body);
  
  try {
    const response = await fetch(url, options);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response body:', errorBody);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    console.groupEnd();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    console.groupEnd();
    throw error;
  }
};

// Usage
const fetchInspections = async () => {
  try {
    const inspections = await debugApiCall('/api/inspections');
    return inspections;
  } catch (error) {
    console.error('Failed to fetch inspections:', error);
  }
};
```

**Common Causes & Solutions:**
```typescript
// ❌ PROBLEM: Missing error handling
const fetchData = async () => {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
};

// ✅ SOLUTION: Comprehensive error handling
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('Network error - check your connection');
    }
    throw error;
  }
};

// ❌ PROBLEM: Race conditions with multiple API calls
const Component = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  useEffect(() => {
    fetchMoreData().then(setData); // This might overwrite the first call
  }, []);
};

// ✅ SOLUTION: Proper cleanup and cancellation
const Component = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      try {
        const result = await fetchData();
        if (!cancelled) {
          setData(result);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load data:', error);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, []);
};
```

### **3. State Management Issues**

#### **Issue: State Not Updating**
**Symptoms:**
- UI doesn't reflect state changes
- Multiple components out of sync
- Stale state values

**Debugging Steps:**
```typescript
// Zustand state debugging
const useDebugStore = create((set, get) => ({
  // Your state
  count: 0,
  
  // Actions with debugging
  increment: () => {
    console.log('Before increment:', get().count);
    set((state) => {
      const newState = { count: state.count + 1 };
      console.log('After increment:', newState.count);
      return newState;
    });
  },
  
  // Debug action to log entire state
  debugState: () => {
    console.log('Current state:', get());
  }
}));

// React state debugging
const [state, setState] = useState(initialState);

// Debug state changes
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

**Common Causes & Solutions:**
```typescript
// ❌ PROBLEM: Mutating state directly
const updateUser = (userId, newData) => {
  const users = get().users;
  const user = users.find(u => u.id === userId);
  user.name = newData.name; // Direct mutation
  set({ users });
};

// ✅ SOLUTION: Immutable updates
const updateUser = (userId, newData) => {
  set((state) => ({
    users: state.users.map(user => 
      user.id === userId ? { ...user, ...newData } : user
    )
  }));
};

// ❌ PROBLEM: Async state updates
const saveData = async (data) => {
  set({ loading: true });
  await api.save(data);
  set({ loading: false, data }); // This might not work as expected
};

// ✅ SOLUTION: Proper async handling
const saveData = async (data) => {
  set({ loading: true, error: null });
  
  try {
    const result = await api.save(data);
    set({ loading: false, data: result });
  } catch (error) {
    set({ loading: false, error: error.message });
  }
};
```

### **4. Performance Issues**

#### **Issue: Slow Component Rendering**
**Symptoms:**
- UI feels sluggish
- Delayed responses to user input
- High CPU usage

**Debugging Steps:**
```typescript
// Performance profiling
const ComponentWithProfiling = () => {
  const renderStart = performance.now();
  
  // Your component logic
  const expensiveCalculation = useMemo(() => {
    const start = performance.now();
    const result = heavyComputation();
    const end = performance.now();
    console.log(`Heavy computation took ${end - start}ms`);
    return result;
  }, [dependencies]);
  
  useEffect(() => {
    const renderEnd = performance.now();
    console.log(`Component render took ${renderEnd - renderStart}ms`);
  });
  
  return <div>{/* Your JSX */}</div>;
};

// Check for unnecessary re-renders
const useWhyDidYouUpdate = (name, props) => {
  const previous = useRef();
  
  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({...previous.current, ...props});
      const changedProps = {};
      
      allKeys.forEach(key => {
        if (previous.current[key] !== props[key]) {
          changedProps[key] = {
            from: previous.current[key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }
    
    previous.current = props;
  });
};
```

**Common Causes & Solutions:**
```typescript
// ❌ PROBLEM: Expensive calculations in render
const ExpensiveComponent = ({ data }) => {
  const result = expensiveCalculation(data); // Runs every render
  return <div>{result}</div>;
};

// ✅ SOLUTION: Memoize expensive calculations
const ExpensiveComponent = ({ data }) => {
  const result = useMemo(() => expensiveCalculation(data), [data]);
  return <div>{result}</div>;
};

// ❌ PROBLEM: Creating new objects in render
const ListComponent = ({ items }) => {
  return (
    <div>
      {items.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item}
          config={{ theme: 'dark' }} // New object every render
        />
      ))}
    </div>
  );
};

// ✅ SOLUTION: Memoize or move outside component
const defaultConfig = { theme: 'dark' };

const ListComponent = ({ items }) => {
  return (
    <div>
      {items.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item}
          config={defaultConfig}
        />
      ))}
    </div>
  );
};
```

### **5. Mobile-Specific Issues**

#### **Issue: Touch Events Not Working**
**Symptoms:**
- Buttons don't respond to touch
- Gestures not detected
- Poor mobile performance

**Debugging Steps:**
```typescript
// Debug touch events
const TouchDebugger = () => {
  const handleTouchStart = (e) => {
    console.log('Touch start:', {
      touches: e.touches.length,
      targetTouches: e.targetTouches.length,
      changedTouches: e.changedTouches.length,
      clientX: e.touches[0]?.clientX,
      clientY: e.touches[0]?.clientY
    });
  };
  
  const handleTouchMove = (e) => {
    console.log('Touch move:', {
      touches: e.touches.length,
      clientX: e.touches[0]?.clientX,
      clientY: e.touches[0]?.clientY
    });
  };
  
  const handleTouchEnd = (e) => {
    console.log('Touch end:', {
      changedTouches: e.changedTouches.length
    });
  };
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      Touch debugging area
    </div>
  );
};
```

**Common Causes & Solutions:**
```typescript
// ❌ PROBLEM: Not preventing default behavior
const handleTouchStart = (e) => {
  // This might interfere with native scrolling
  doSomething();
};

// ✅ SOLUTION: Careful event handling
const handleTouchStart = (e) => {
  if (shouldPreventDefault) {
    e.preventDefault();
  }
  doSomething();
};

// ❌ PROBLEM: Touch targets too small
.button {
  width: 20px;
  height: 20px;
}

// ✅ SOLUTION: Minimum 44px touch targets
.button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### **6. TypeScript Issues**

#### **Issue: Type Errors**
**Symptoms:**
- TypeScript compilation errors
- Type assertions everywhere
- "any" types used frequently

**Debugging Steps:**
```typescript
// Type debugging utility
const debugType = <T>(value: T): T => {
  console.log('Type:', typeof value);
  console.log('Value:', value);
  console.log('Constructor:', value?.constructor?.name);
  return value;
};

// Usage
const result = debugType(apiResponse);
```

**Common Causes & Solutions:**
```typescript
// ❌ PROBLEM: Incorrect type assertions
const data = apiResponse as MyType; // Dangerous

// ✅ SOLUTION: Type guards
const isMyType = (value: any): value is MyType => {
  return value && typeof value.id === 'string' && typeof value.name === 'string';
};

if (isMyType(apiResponse)) {
  // TypeScript knows this is MyType
  console.log(apiResponse.name);
}

// ❌ PROBLEM: Using any everywhere
const processData = (data: any) => {
  return data.map((item: any) => item.name);
};

// ✅ SOLUTION: Proper generic types
const processData = <T extends { name: string }>(data: T[]) => {
  return data.map(item => item.name);
};
```

## **🔧 DEBUGGING TOOLS**

### **1. Console Debugging**
```typescript
// Enhanced console logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data);
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data);
  },
  
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  },
  
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data);
    }
  }
};
```

### **2. React DevTools**
```typescript
// Component debugging with React DevTools
const MyComponent = (props) => {
  // This will show in React DevTools
  useDebugValue(props.isActive ? 'Active' : 'Inactive');
  
  return <div>{/* component */}</div>;
};

// Custom hook debugging
const useCustomHook = (value) => {
  const [state, setState] = useState(value);
  
  // This will show in React DevTools
  useDebugValue(state > 10 ? 'High' : 'Low');
  
  return [state, setState];
};
```

### **3. Network Debugging**
```typescript
// API call interceptor
const apiInterceptor = (originalFetch) => {
  return async (url, options = {}) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    
    console.group(`API Request ${requestId}`);
    console.log('URL:', url);
    console.log('Options:', options);
    
    try {
      const response = await originalFetch(url, options);
      
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      console.log('Response:', data);
      
      console.groupEnd();
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      console.groupEnd();
      throw error;
    }
  };
};

// Apply interceptor
if (process.env.NODE_ENV === 'development') {
  window.fetch = apiInterceptor(window.fetch);
}
```

## **🏥 ERROR BOUNDARIES**

### **Component Error Boundary**
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, LogRocket, etc.
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error?.stack}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## **📊 MONITORING & ALERTING**

### **Performance Monitoring**
```typescript
// Performance monitoring hook
const usePerformanceMonitoring = (componentName: string) => {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  
  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now();
    renderTimes.current.push(renderTime);
    
    // Log if render count is getting high
    if (renderCount.current > 10) {
      console.warn(`${componentName} has rendered ${renderCount.current} times`);
    }
    
    // Log if render times are increasing
    if (renderTimes.current.length > 1) {
      const lastRenderTime = renderTimes.current[renderTimes.current.length - 1];
      const previousRenderTime = renderTimes.current[renderTimes.current.length - 2];
      const timeDiff = lastRenderTime - previousRenderTime;
      
      if (timeDiff > 16) { // 60fps = 16ms per frame
        console.warn(`${componentName} render time: ${timeDiff}ms`);
      }
    }
  });
  
  return {
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b) / renderTimes.current.length 
      : 0
  };
};
```

### **Error Reporting**
```typescript
// Error reporting service
class ErrorReporter {
  static report(error: Error, context?: any) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to your error tracking service
      console.error('Error reported:', errorReport);
    } else {
      console.error('Development error:', errorReport);
    }
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  ErrorReporter.report(event.error, {
    type: 'javascript',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  ErrorReporter.report(new Error(event.reason), {
    type: 'promise_rejection'
  });
});
```

## **🎯 DEBUGGING CHECKLIST**

### **Before You Start Debugging**
- [ ] Can you reproduce the issue consistently?
- [ ] What changed recently?
- [ ] Is it environment-specific?
- [ ] Do you have all the necessary information?

### **During Debugging**
- [ ] Are you looking at the right code?
- [ ] Have you checked the browser console?
- [ ] Have you verified the network requests?
- [ ] Are you testing with the correct data?
- [ ] Have you isolated the problem?

### **After Fixing the Issue**
- [ ] Does the fix address the root cause?
- [ ] Have you tested edge cases?
- [ ] Are there any side effects?
- [ ] Have you added tests to prevent regression?
- [ ] Have you documented the solution?

---

## **🎉 CONCLUSION**

Debugging is a skill that improves with practice. Remember:

1. **Stay systematic** - Don't randomly change things
2. **Use the right tools** - Leverage browser DevTools and React DevTools
3. **Document solutions** - Help your future self and teammates
4. **Learn from mistakes** - Every bug teaches you something
5. **Add defensive code** - Prevent similar issues in the future

**Great debugging skills make you a better developer!** 🚀

---

*This guide is living documentation. Please add new issues and solutions as you encounter them.*