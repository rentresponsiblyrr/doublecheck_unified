# 🔧 COMMON PATTERNS FOR STR CERTIFIED

*Standard patterns for hooks, components, services, and utilities used across the platform*

## **🎯 PATTERN PHILOSOPHY**

Common patterns ensure consistency, maintainability, and developer productivity. Every pattern in this guide has been battle-tested in production and follows our core principles:

- **Consistency** - Same approach everywhere
- **Reusability** - Write once, use everywhere
- **Testability** - Easy to test and mock
- **Type Safety** - Full TypeScript support
- **Performance** - Optimized for production

## **🪝 CUSTOM HOOKS PATTERNS**

### **Pattern: Data Fetching Hook**

```typescript
/**
 * useDataFetch - Generic data fetching hook with caching and error handling
 * 
 * @param key - Unique cache key
 * @param fetcher - Function to fetch data
 * @param options - Configuration options
 * @returns Query result with data, loading, and error states
 */
interface UseDataFetchOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseDataFetchResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
}

export const useDataFetch = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseDataFetchOptions<T> = {}
): UseDataFetchResult<T> => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      setData(cached.data);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await fetcher();
      
      // Cache the result
      cacheRef.current.set(key, {
        data: result,
        timestamp: Date.now()
      });

      setData(result);
      retryCountRef.current = 0;
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(fetchData, Math.pow(2, retryCountRef.current) * 1000);
        return;
      }

      setIsError(true);
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, enabled, staleTime, retry, onSuccess, onError]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    cacheRef.current.set(key, {
      data: newData,
      timestamp: Date.now()
    });
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cache cleanup
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [cacheKey, { timestamp }] of cacheRef.current.entries()) {
        if (now - timestamp > cacheTime) {
          cacheRef.current.delete(cacheKey);
        }
      }
    };

    const interval = setInterval(cleanup, cacheTime);
    return () => clearInterval(interval);
  }, [cacheTime]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchData,
    mutate
  };
};

// Usage example
const useInspections = () => {
  return useDataFetch(
    'inspections',
    () => inspectionService.getAll(),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error('Failed to fetch inspections:', error);
      }
    }
  );
};
```

### **Pattern: Form State Management Hook**

```typescript
/**
 * useFormState - Comprehensive form state management with validation
 * 
 * @param initialValues - Initial form values
 * @param validationSchema - Zod schema for validation
 * @param onSubmit - Submit handler
 * @returns Form state and handlers
 */
interface UseFormStateOptions<T> {
  validationSchema?: z.ZodSchema<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  resetOnSubmit?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormStateResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setError: (field: keyof T, error: string) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: keyof T) => (e: React.FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  validate: () => boolean;
}

export const useFormState = <T extends Record<string, any>>(
  initialValues: T,
  options: UseFormStateOptions<T> = {}
): UseFormStateResult<T> => {
  const {
    validationSchema,
    onSubmit,
    resetOnSubmit = false,
    validateOnChange = false,
    validateOnBlur = true
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValuesRef = useRef(initialValues);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  // Validate single field
  const validateField = useCallback((field: keyof T, value: T[keyof T]): string | null => {
    if (!validationSchema) return null;

    try {
      const fieldSchema = validationSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Invalid value';
    }
  }, [validationSchema]);

  // Validate entire form
  const validate = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const field = err.path[0] as keyof T;
            fieldErrors[field] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [validationSchema, values]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Set field value
  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate on change if enabled
    if (validateOnChange) {
      const fieldError = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: fieldError || undefined
      }));
    } else {
      // Clear error when user starts typing
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [validateField, validateOnChange]);

  // Set field error
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Set field touched
  const setTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  // Handle input change
  const handleChange = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value as T[keyof T];
      setValue(field, value);
    };
  }, [setValue]);

  // Handle input blur
  const handleBlur = useCallback((field: keyof T) => {
    return (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(field, true);

      // Validate on blur if enabled
      if (validateOnBlur) {
        const fieldError = validateField(field, values[field]);
        setErrors(prev => ({
          ...prev,
          [field]: fieldError || undefined
        }));
      }
    };
  }, [validateField, validateOnBlur, values, setTouched]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouchedState(allTouched);

    // Validate form
    if (!validate()) {
      return;
    }

    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      if (resetOnSubmit) {
        reset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, resetOnSubmit]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    setValue,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate
  };
};
```

### **Pattern: Async Operation Hook**

```typescript
/**
 * useAsyncOperation - Handle async operations with loading and error states
 * 
 * @param asyncFn - Async function to execute
 * @param options - Configuration options
 * @returns Operation state and execute function
 */
interface UseAsyncOperationOptions<T, P extends any[]> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  immediate?: boolean;
  deps?: React.DependencyList;
}

interface UseAsyncOperationResult<T, P extends any[]> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (...args: P) => Promise<T>;
  reset: () => void;
}

export const useAsyncOperation = <T, P extends any[]>(
  asyncFn: (...args: P) => Promise<T>,
  options: UseAsyncOperationOptions<T, P> = {}
): UseAsyncOperationResult<T, P> => {
  const { onSuccess, onError, immediate = false, deps = [] } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: P): Promise<T> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await asyncFn(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...deps]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset
  };
};

// Usage example
const useUploadPhoto = () => {
  return useAsyncOperation(
    async (file: File) => {
      return await uploadService.uploadPhoto(file);
    },
    {
      onSuccess: (result) => {
        toast.success('Photo uploaded successfully');
      },
      onError: (error) => {
        toast.error(`Upload failed: ${error.message}`);
      }
    }
  );
};
```

## **🏗️ SERVICE LAYER PATTERNS**

### **Pattern: Repository Pattern**

```typescript
/**
 * Base repository interface for CRUD operations
 */
interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

/**
 * Abstract base repository implementation
 */
abstract class BaseRepository<T extends { id: string }, ID = string> implements Repository<T, ID> {
  protected abstract tableName: string;

  async findById(id: ID): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return data;
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const { limit = 100, offset = 0, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = options;

    let query = supabase
      .from(this.tableName)
      .select('*')
      .range(offset, offset + limit - 1)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }

    return data || [];
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return result;
  }

  async update(id: ID, data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return result;
  }

  async delete(id: ID): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }
}

// Concrete implementation
class InspectionRepository extends BaseRepository<Inspection> {
  protected tableName = 'inspections';

  async findByPropertyId(propertyId: string): Promise<Inspection[]> {
    return this.findAll({ filters: { property_id: propertyId } });
  }

  async findByStatus(status: InspectionStatus): Promise<Inspection[]> {
    return this.findAll({ filters: { status } });
  }
}
```

### **Pattern: Service Layer with Business Logic**

```typescript
/**
 * Service layer pattern for business logic
 */
interface InspectionService {
  create(data: CreateInspectionRequest): Promise<Result<Inspection, InspectionError>>;
  update(id: string, data: UpdateInspectionRequest): Promise<Result<Inspection, InspectionError>>;
  complete(id: string): Promise<Result<Inspection, InspectionError>>;
  generateChecklist(propertyId: string): Promise<Result<ChecklistItem[], InspectionError>>;
}

class InspectionServiceImpl implements InspectionService {
  constructor(
    private inspectionRepository: InspectionRepository,
    private propertyRepository: PropertyRepository,
    private aiService: AIService,
    private logger: Logger
  ) {}

  async create(data: CreateInspectionRequest): Promise<Result<Inspection, InspectionError>> {
    try {
      // Validate input
      const validation = CreateInspectionSchema.safeParse(data);
      if (!validation.success) {
        return Result.failure(new ValidationError(validation.error.errors));
      }

      // Check if property exists
      const property = await this.propertyRepository.findById(data.propertyId);
      if (!property) {
        return Result.failure(new InspectionError('Property not found'));
      }

      // Generate checklist items
      const checklistResult = await this.generateChecklist(data.propertyId);
      if (!checklistResult.success) {
        return Result.failure(checklistResult.error);
      }

      // Create inspection
      const inspection = await this.inspectionRepository.create({
        ...data,
        status: 'draft',
        checklist_items: checklistResult.data,
        completion_percentage: 0
      });

      this.logger.info('Inspection created', { inspectionId: inspection.id });
      return Result.success(inspection);
    } catch (error) {
      this.logger.error('Failed to create inspection', { error, data });
      return Result.failure(new InspectionError('Failed to create inspection'));
    }
  }

  async update(id: string, data: UpdateInspectionRequest): Promise<Result<Inspection, InspectionError>> {
    try {
      // Check if inspection exists
      const existing = await this.inspectionRepository.findById(id);
      if (!existing) {
        return Result.failure(new InspectionError('Inspection not found'));
      }

      // Validate update data
      const validation = UpdateInspectionSchema.safeParse(data);
      if (!validation.success) {
        return Result.failure(new ValidationError(validation.error.errors));
      }

      // Update inspection
      const updated = await this.inspectionRepository.update(id, {
        ...data,
        completion_percentage: this.calculateCompletionPercentage(data.checklist_items || existing.checklist_items)
      });

      this.logger.info('Inspection updated', { inspectionId: id });
      return Result.success(updated);
    } catch (error) {
      this.logger.error('Failed to update inspection', { error, id, data });
      return Result.failure(new InspectionError('Failed to update inspection'));
    }
  }

  async complete(id: string): Promise<Result<Inspection, InspectionError>> {
    try {
      const inspection = await this.inspectionRepository.findById(id);
      if (!inspection) {
        return Result.failure(new InspectionError('Inspection not found'));
      }

      // Check if inspection is ready to complete
      if (inspection.completion_percentage < 100) {
        return Result.failure(new InspectionError('Inspection is not fully completed'));
      }

      const completed = await this.inspectionRepository.update(id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      this.logger.info('Inspection completed', { inspectionId: id });
      return Result.success(completed);
    } catch (error) {
      this.logger.error('Failed to complete inspection', { error, id });
      return Result.failure(new InspectionError('Failed to complete inspection'));
    }
  }

  async generateChecklist(propertyId: string): Promise<Result<ChecklistItem[], InspectionError>> {
    try {
      const property = await this.propertyRepository.findById(propertyId);
      if (!property) {
        return Result.failure(new InspectionError('Property not found'));
      }

      const checklist = await this.aiService.generateChecklist(property);
      return Result.success(checklist);
    } catch (error) {
      this.logger.error('Failed to generate checklist', { error, propertyId });
      return Result.failure(new InspectionError('Failed to generate checklist'));
    }
  }

  private calculateCompletionPercentage(items: ChecklistItem[]): number {
    if (items.length === 0) return 0;
    
    const completedItems = items.filter(
      item => item.status === 'completed' || item.status === 'not_applicable'
    );
    
    return Math.round((completedItems.length / items.length) * 100);
  }
}
```

## **🎨 COMPONENT COMPOSITION PATTERNS**

### **Pattern: Compound Component**

```typescript
/**
 * Compound component pattern for flexible composition
 */
interface CardContextValue {
  variant: 'default' | 'elevated' | 'outlined';
  size: 'sm' | 'md' | 'lg';
}

const CardContext = createContext<CardContextValue | null>(null);

const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card components must be used within a Card');
  }
  return context;
};

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ variant = 'default', size = 'md', className = '', children }) => {
  const baseClasses = 'bg-white rounded-lg';
  const variantClasses = {
    default: 'border border-gray-200',
    elevated: 'shadow-lg',
    outlined: 'border-2 border-gray-300'
  };
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <CardContext.Provider value={{ variant, size }}>
      <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
        {children}
      </div>
    </CardContext.Provider>
  );
};

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children }) => {
  const { size } = useCardContext();
  
  const sizeClasses = {
    sm: 'mb-2',
    md: 'mb-3',
    lg: 'mb-4'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

const CardBody: React.FC<CardBodyProps> = ({ className = '', children }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

const CardFooter: React.FC<CardFooterProps> = ({ className = '', children }) => {
  const { size } = useCardContext();
  
  const sizeClasses = {
    sm: 'mt-2',
    md: 'mt-3',
    lg: 'mt-4'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

// Usage
const InspectionCard = ({ inspection }) => (
  <Card variant="elevated" size="md">
    <Card.Header>
      <h2 className="text-lg font-semibold">{inspection.property.name}</h2>
      <Badge variant={inspection.status}>{inspection.status}</Badge>
    </Card.Header>
    <Card.Body>
      <p className="text-gray-600">
        {inspection.checklistItems.length} items • {inspection.completionPercentage}% complete
      </p>
    </Card.Body>
    <Card.Footer>
      <div className="flex space-x-2">
        <Button variant="outline">View</Button>
        <Button variant="primary">Edit</Button>
      </div>
    </Card.Footer>
  </Card>
);
```

### **Pattern: Render Props**

```typescript
/**
 * Render props pattern for flexible data sharing
 */
interface DataProviderProps<T> {
  url: string;
  children: (props: {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

const DataProvider = <T,>({ url, children }: DataProviderProps<T>) => {
  const { data, isLoading, error, refetch } = useDataFetch<T>(url, () => 
    fetch(url).then(res => res.json())
  );

  return (
    <>
      {children({
        data,
        loading: isLoading,
        error,
        refetch
      })}
    </>
  );
};

// Usage
const InspectionList = () => (
  <DataProvider<Inspection[]> url="/api/inspections">
    {({ data, loading, error, refetch }) => {
      if (loading) return <LoadingSpinner />;
      if (error) return <ErrorMessage error={error} onRetry={refetch} />;
      if (!data) return <EmptyState />;

      return (
        <div className="space-y-4">
          {data.map(inspection => (
            <InspectionCard key={inspection.id} inspection={inspection} />
          ))}
        </div>
      );
    }}
  </DataProvider>
);
```

## **🔧 UTILITY PATTERNS**

### **Pattern: Result Type for Error Handling**

```typescript
/**
 * Result type for consistent error handling
 */
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const Result = {
  success: <T>(data: T): Result<T, never> => ({ success: true, data }),
  failure: <E>(error: E): Result<never, E> => ({ success: false, error })
};

// Usage in async functions
const fetchInspection = async (id: string): Promise<Result<Inspection, InspectionError>> => {
  try {
    const inspection = await inspectionService.findById(id);
    if (!inspection) {
      return Result.failure(new InspectionError('Inspection not found'));
    }
    return Result.success(inspection);
  } catch (error) {
    return Result.failure(new InspectionError('Failed to fetch inspection'));
  }
};

// Usage in components
const InspectionDetails = ({ id }: { id: string }) => {
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInspection = async () => {
      const result = await fetchInspection(id);
      
      if (result.success) {
        setInspection(result.data);
        setError(null);
      } else {
        setError(result.error.message);
        setInspection(null);
      }
    };

    loadInspection();
  }, [id]);

  if (error) return <ErrorMessage message={error} />;
  if (!inspection) return <LoadingSpinner />;

  return <InspectionCard inspection={inspection} />;
};
```

### **Pattern: Event Emitter for Loose Coupling**

```typescript
/**
 * Type-safe event emitter for decoupled communication
 */
interface EventMap {
  'inspection:created': { inspection: Inspection };
  'inspection:updated': { inspection: Inspection };
  'inspection:completed': { inspection: Inspection };
  'photo:uploaded': { photo: Photo; checklistItemId: string };
  'user:authenticated': { user: User };
}

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: { [K in keyof T]?: Array<(data: T[K]) => void> } = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    if (!this.listeners[event]) return;
    
    const index = this.listeners[event]!.indexOf(listener);
    if (index > -1) {
      this.listeners[event]!.splice(index, 1);
    }
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event]!.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });
  }

  once<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const onceListener = (data: T[K]) => {
      listener(data);
      this.off(event, onceListener);
    };
    this.on(event, onceListener);
  }
}

// Global event emitter instance
export const eventEmitter = new TypedEventEmitter<EventMap>();

// Usage in services
class InspectionService {
  async create(data: CreateInspectionRequest): Promise<Inspection> {
    const inspection = await this.repository.create(data);
    
    // Emit event
    eventEmitter.emit('inspection:created', { inspection });
    
    return inspection;
  }
}

// Usage in components
const InspectionNotifications = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const handleInspectionCreated = ({ inspection }: { inspection: Inspection }) => {
      setNotifications(prev => [...prev, `Inspection created: ${inspection.property.name}`]);
    };

    eventEmitter.on('inspection:created', handleInspectionCreated);

    return () => {
      eventEmitter.off('inspection:created', handleInspectionCreated);
    };
  }, []);

  return (
    <div className="notifications">
      {notifications.map((notification, index) => (
        <div key={index} className="notification">
          {notification}
        </div>
      ))}
    </div>
  );
};
```

## **📱 MOBILE-SPECIFIC PATTERNS**

### **Pattern: Touch Gesture Handler**

```typescript
/**
 * Touch gesture handler for mobile interactions
 */
interface TouchGestureHandler {
  onTap?: (e: TouchEvent) => void;
  onSwipeLeft?: (e: TouchEvent) => void;
  onSwipeRight?: (e: TouchEvent) => void;
  onSwipeUp?: (e: TouchEvent) => void;
  onSwipeDown?: (e: TouchEvent) => void;
  onPinch?: (e: TouchEvent, scale: number) => void;
  threshold?: number;
}

export const useTouchGestures = (
  ref: React.RefObject<HTMLElement>,
  handlers: TouchGestureHandler
) => {
  const {
    onTap,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    threshold = 50
  } = handlers;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchData = useRef<{ x: number; y: number; distance: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
      } else if (e.touches.length === 2) {
        const distance = Math.sqrt(
          Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
          Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
        );
        touchData.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          distance
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchData.current && onPinch) {
        const distance = Math.sqrt(
          Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
          Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
        );
        const scale = distance / touchData.current.distance;
        onPinch(e, scale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: Date.now()
      };

      const deltaX = touchEnd.x - touchStart.current.x;
      const deltaY = touchEnd.y - touchStart.current.y;
      const deltaTime = touchEnd.time - touchStart.current.time;

      // Tap detection
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
        onTap?.(e);
        return;
      }

      // Swipe detection
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.(e);
          } else {
            onSwipeLeft?.(e);
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.(e);
          } else {
            onSwipeUp?.(e);
          }
        }
      }

      touchStart.current = null;
      touchData.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onTap, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPinch, threshold]);
};

// Usage
const SwipeableCard = ({ onDelete, onEdit, children }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useTouchGestures(cardRef, {
    onSwipeLeft: () => onDelete(),
    onSwipeRight: () => onEdit(),
    onTap: () => console.log('Card tapped'),
    threshold: 100
  });

  return (
    <div ref={cardRef} className="swipeable-card">
      {children}
    </div>
  );
};
```

---

## **🎯 CONCLUSION**

These common patterns provide a solid foundation for building consistent, maintainable code across the STR Certified platform. Remember:

1. **Use these patterns consistently** - Don't reinvent the wheel
2. **Extend patterns when needed** - Add new patterns that follow the same principles
3. **Test all patterns** - Ensure they work correctly in production
4. **Document new patterns** - Help future developers understand your additions
5. **Keep patterns simple** - Complexity is the enemy of maintainability

**Every pattern should make development faster, not slower.** 🚀✨