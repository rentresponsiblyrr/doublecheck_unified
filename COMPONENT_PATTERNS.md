# 🧩 COMPONENT PATTERNS FOR STR CERTIFIED

*Reusable patterns and examples for building consistent, maintainable React components*

## **🎯 PATTERN PHILOSOPHY**

Our component patterns are designed to be:
- **Predictable** - Same patterns across all components
- **Composable** - Components work together seamlessly
- **Accessible** - WCAG 2.1 compliant by default
- **Mobile-First** - Optimized for touch interfaces
- **Performance-Focused** - Built for production scale

## **📋 COMPONENT TYPES**

### **1. Domain Components**
Components specific to business domains (inspection, audit, property)

### **2. Shared UI Components**
Reusable components used across domains

### **3. Layout Components**
Structure and positioning components

### **4. Form Components**
Input handling and validation components

### **5. Data Display Components**
Components for presenting information

## **🏗️ CORE COMPONENT PATTERNS**

### **Pattern 1: Standard Component Structure**

```typescript
/**
 * ComponentName - Brief description of what this component does
 * 
 * Detailed explanation of the component's purpose, features, and usage.
 * Include any important behavioral notes or constraints.
 * 
 * @param prop1 - Description of prop1
 * @param prop2 - Description of prop2
 * @param className - Additional CSS classes
 * @param children - Child components or content
 * 
 * @example
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={data}
 *   className="custom-class"
 * >
 *   Content here
 * </ComponentName>
 * ```
 */
interface ComponentNameProps {
  prop1: string;
  prop2: DataType;
  className?: string;
  children?: React.ReactNode;
  onAction?: (data: ActionData) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2,
  className = '',
  children,
  onAction
}) => {
  // 1. Hooks (in consistent order)
  const [localState, setLocalState] = useState<StateType>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 2. Custom hooks
  const { data, mutate } = useCustomHook();
  
  // 3. Memoized values
  const computedValue = useMemo(() => {
    return expensiveComputation(prop1, prop2);
  }, [prop1, prop2]);
  
  // 4. Callbacks
  const handleAction = useCallback(async (actionData: ActionData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await performAction(actionData);
      onAction?.(actionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [onAction]);
  
  // 5. Effects
  useEffect(() => {
    // Side effects here
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  // 6. Early returns for loading/error states
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={() => setError(null)} />;
  }
  
  // 7. Main render
  return (
    <div className={`component-base-styles ${className}`}>
      {/* Component content */}
      {children}
    </div>
  );
};

// 8. Display name for debugging
ComponentName.displayName = 'ComponentName';
```

### **Pattern 2: Optimized List Component**

```typescript
/**
 * OptimizedItemList - Virtualized list with intersection observer
 * 
 * Renders large lists efficiently using virtual scrolling and lazy loading.
 * Includes search, filtering, and sorting capabilities.
 * 
 * @param items - Array of items to display
 * @param renderItem - Function to render each item
 * @param onItemSelect - Callback when item is selected
 * @param searchable - Whether to show search input
 * @param sortable - Whether items can be sorted
 * @param className - Additional CSS classes
 */
interface OptimizedItemListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onItemSelect?: (item: T) => void;
  searchable?: boolean;
  sortable?: boolean;
  className?: string;
  keyExtractor: (item: T) => string;
}

export const OptimizedItemList = <T,>({
  items,
  renderItem,
  onItemSelect,
  searchable = false,
  sortable = false,
  className = '',
  keyExtractor
}: OptimizedItemListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Filter and sort items
  const processedItems = useMemo(() => {
    let filtered = items;
    
    if (searchTerm) {
      filtered = items.filter(item =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sortable) {
      filtered.sort((a, b) => {
        const aKey = keyExtractor(a);
        const bKey = keyExtractor(b);
        return sortOrder === 'asc' ? aKey.localeCompare(bKey) : bKey.localeCompare(aKey);
      });
    }
    
    return filtered;
  }, [items, searchTerm, sortOrder, sortable, keyExtractor]);
  
  // Intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Load more items when container is visible
            setVisibleItems(prev => {
              const newItems = processedItems.slice(0, prev.length + 20);
              return newItems;
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observerRef.current.observe(containerRef.current);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [processedItems]);
  
  // Initialize visible items
  useEffect(() => {
    setVisibleItems(processedItems.slice(0, 20));
  }, [processedItems]);
  
  const handleItemClick = useCallback((item: T) => {
    onItemSelect?.(item);
  }, [onItemSelect]);
  
  return (
    <div className={`optimized-list ${className}`} ref={containerRef}>
      {searchable && (
        <div className="mb-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search items..."
          />
        </div>
      )}
      
      {sortable && (
        <div className="mb-4">
          <SortButton
            order={sortOrder}
            onToggle={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          />
        </div>
      )}
      
      <div className="space-y-2">
        {visibleItems.map((item, index) => (
          <div
            key={keyExtractor(item)}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleItemClick(item)}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      
      {visibleItems.length < processedItems.length && (
        <div className="text-center py-4">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
```

### **Pattern 3: Mobile-Optimized Photo Component**

```typescript
/**
 * MobilePhotoCapture - Optimized photo capture for mobile devices
 * 
 * Handles camera access, photo capture, and upload with offline support.
 * Includes image optimization and error handling.
 * 
 * @param onCapture - Callback when photo is captured
 * @param onUpload - Callback when photo is uploaded
 * @param referenceImage - Optional reference image for comparison
 * @param maxWidth - Maximum width for captured image
 * @param maxHeight - Maximum height for captured image
 * @param quality - Image quality (0-1)
 */
interface MobilePhotoCaptureProps {
  onCapture: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  referenceImage?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  className?: string;
}

export const MobilePhotoCapture: React.FC<MobilePhotoCaptureProps> = ({
  onCapture,
  onUpload,
  referenceImage,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8,
  className = ''
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Camera access
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: maxWidth },
          height: { ideal: maxHeight }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  }, [maxWidth, maxHeight]);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);
  
  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      setIsCapturing(true);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Canvas context not available');
      
      // Set canvas size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          quality
        );
      });
      
      // Create file
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      
      setCapturedImage(file);
      setPreviewUrl(url);
      onCapture(file);
      
      // Stop camera
      stopCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, quality, stopCamera]);
  
  // Upload photo
  const uploadPhoto = useCallback(async () => {
    if (!capturedImage) return;
    
    try {
      setIsUploading(true);
      setError(null);
      
      await onUpload(capturedImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  }, [capturedImage, onUpload]);
  
  // File input handler
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapturedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      onCapture(file);
    }
  }, [onCapture]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stopCamera, previewUrl]);
  
  return (
    <div className={`mobile-photo-capture ${className}`}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!isOnline && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          You're offline. Photos will be uploaded when connection is restored.
        </div>
      )}
      
      {referenceImage && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Reference Image:</h3>
          <img
            src={referenceImage}
            alt="Reference"
            className="w-full h-32 object-cover rounded"
          />
        </div>
      )}
      
      {!capturedImage ? (
        <div className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 bg-black rounded"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={startCamera}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Start Camera
            </button>
            <button
              onClick={capturePhoto}
              disabled={isCapturing}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isCapturing ? 'Capturing...' : 'Capture'}
            </button>
          </div>
          
          <div className="text-center">
            <span className="text-gray-500">or</span>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Choose from Gallery
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewUrl || ''}
              alt="Captured"
              className="w-full h-64 object-cover rounded"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setCapturedImage(null);
                setPreviewUrl(null);
                startCamera();
              }}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Retake
            </button>
            <button
              onClick={uploadPhoto}
              disabled={isUploading || !isOnline}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### **Pattern 4: Form Component with Validation**

```typescript
/**
 * ValidatedForm - Form component with built-in validation
 * 
 * Provides form state management, validation, and submission handling.
 * Includes accessibility features and error display.
 * 
 * @param schema - Zod schema for validation
 * @param onSubmit - Callback when form is submitted
 * @param initialValues - Initial form values
 * @param className - Additional CSS classes
 */
interface ValidatedFormProps<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  initialValues?: Partial<T>;
  className?: string;
  children: (props: FormRenderProps<T>) => React.ReactNode;
}

interface FormRenderProps<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
}

export const ValidatedForm = <T extends Record<string, any>>({
  schema,
  onSubmit,
  initialValues = {},
  className = '',
  children
}: ValidatedFormProps<T>) => {
  const [values, setValues] = useState<T>({
    ...initialValues
  } as T);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Validate form
  const validateForm = useCallback(() => {
    try {
      schema.parse(values);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [schema, values]);
  
  // Check if form is valid
  const isValid = useMemo(() => {
    try {
      schema.parse(values);
      return true;
    } catch {
      return false;
    }
  }, [schema, values]);
  
  // Set field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  }, [errors]);
  
  // Set field error
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);
  
  // Clear field error
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => ({ ...prev, [field as string]: '' }));
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, onSubmit, values]);
  
  return (
    <form
      onSubmit={handleSubmit}
      className={`validated-form ${className}`}
      noValidate
    >
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}
      
      {children({
        values,
        errors,
        isSubmitting,
        isValid,
        setValue,
        setError,
        clearError
      })}
    </form>
  );
};

// Example usage
const CreateInspectionForm = () => {
  const schema = z.object({
    propertyId: z.string().min(1, 'Property is required'),
    scheduledDate: z.date().min(new Date(), 'Date must be in the future'),
    notes: z.string().max(500, 'Notes too long').optional()
  });
  
  const handleSubmit = async (data: z.infer<typeof schema>) => {
    // Handle form submission
    console.log('Form submitted:', data);
  };
  
  return (
    <ValidatedForm
      schema={schema}
      onSubmit={handleSubmit}
      initialValues={{ notes: '' }}
    >
      {({ values, errors, isSubmitting, isValid, setValue }) => (
        <>
          <FormField
            label="Property"
            error={errors.propertyId}
            required
          >
            <Select
              value={values.propertyId}
              onChange={(value) => setValue('propertyId', value)}
            >
              <SelectOption value="">Select property...</SelectOption>
              <SelectOption value="1">Property 1</SelectOption>
              <SelectOption value="2">Property 2</SelectOption>
            </Select>
          </FormField>
          
          <FormField
            label="Scheduled Date"
            error={errors.scheduledDate}
            required
          >
            <DatePicker
              value={values.scheduledDate}
              onChange={(date) => setValue('scheduledDate', date)}
            />
          </FormField>
          
          <FormField
            label="Notes"
            error={errors.notes}
          >
            <TextArea
              value={values.notes}
              onChange={(e) => setValue('notes', e.target.value)}
              rows={3}
              maxLength={500}
            />
          </FormField>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
            >
              Create Inspection
            </Button>
          </div>
        </>
      )}
    </ValidatedForm>
  );
};
```

### **Pattern 5: Data Table Component**

```typescript
/**
 * DataTable - Flexible data table with sorting, filtering, and pagination
 * 
 * Provides a complete data table solution with accessibility features.
 * Supports virtual scrolling for large datasets.
 * 
 * @param data - Array of data objects
 * @param columns - Column configuration
 * @param onRowSelect - Callback when row is selected
 * @param sortable - Whether columns can be sorted
 * @param filterable - Whether data can be filtered
 * @param paginated - Whether to show pagination
 * @param pageSize - Number of items per page
 */
interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  onRowSelect?: (row: T) => void;
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  className?: string;
}

interface ColumnConfig<T> {
  key: keyof T;
  title: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  onRowSelect,
  sortable = true,
  filterable = true,
  paginated = true,
  pageSize = 10,
  className = ''
}: DataTableProps<T>) => {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const rowValue = String(row[key]).toLowerCase();
        return rowValue.includes(value.toLowerCase());
      });
    });
  }, [data, filters]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, paginated]);
  
  // Handle column sort
  const handleSort = useCallback((column: keyof T) => {
    if (!sortable) return;
    
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortable, sortColumn]);
  
  // Handle filter change
  const handleFilterChange = useCallback((column: keyof T, value: string) => {
    setFilters(prev => ({ ...prev, [column as string]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);
  
  // Handle row selection
  const handleRowSelect = useCallback((row: T, rowId: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
    
    onRowSelect?.(row);
  }, [onRowSelect]);
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;
  
  return (
    <div className={`data-table ${className}`}>
      {/* Filters */}
      {filterable && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          {columns.filter(col => col.filterable !== false).map(column => (
            <div key={column.key as string}>
              <input
                type="text"
                placeholder={`Filter ${column.title}...`}
                value={filters[column.key as string] || ''}
                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key as string}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {sortable && column.sortable !== false && (
                      <span className="ml-2">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => {
              const rowId = String(row.id || index);
              const isSelected = selectedRows.has(rowId);
              
              return (
                <tr
                  key={rowId}
                  className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => handleRowSelect(row, rowId)}
                >
                  {columns.map(column => (
                    <td
                      key={column.key as string}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!hasPrevPage}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 ${
                  currentPage === page ? 'bg-blue-500 text-white' : ''
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={!hasNextPage}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

## **🎨 STYLING PATTERNS**

### **Consistent Style Classes**

```typescript
// Define consistent styling patterns
export const stylePatterns = {
  // Button variants
  button: {
    base: 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  },
  
  // Input variants
  input: {
    base: 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    disabled: 'bg-gray-100 text-gray-500 cursor-not-allowed'
  },
  
  // Card variants
  card: {
    base: 'bg-white rounded-lg shadow-sm border border-gray-200',
    hover: 'hover:shadow-md transition-shadow',
    interactive: 'cursor-pointer hover:shadow-md transition-shadow'
  },
  
  // Status variants
  status: {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200'
  }
};

// Usage in components
const Button = ({ variant = 'primary', children, ...props }) => (
  <button
    className={`${stylePatterns.button.base} ${stylePatterns.button[variant]}`}
    {...props}
  >
    {children}
  </button>
);
```

## **🔧 UTILITY PATTERNS**

### **Common Utility Hooks**

```typescript
// useDebounce hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// useLocalStorage hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue] as const;
};

// useOnClickOutside hook
export const useOnClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// useIntersectionObserver hook
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);
    
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [options]);
  
  return { targetRef, isIntersecting, entry };
};
```

## **📱 MOBILE PATTERNS**

### **Touch-Friendly Components**

```typescript
// TouchButton with proper touch targets
export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onPress,
  className = '',
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <button
      className={`
        min-h-[44px] min-w-[44px] // Minimum touch target size
        px-4 py-2
        rounded-md
        font-medium
        transition-colors
        active:scale-95
        ${isPressed ? 'bg-blue-600' : 'bg-blue-500'}
        ${className}
      `}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onPress}
      {...props}
    >
      {children}
    </button>
  );
};

// SwipeableCard with gesture support
export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  className = ''
}) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwipping(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipping) return;
    setCurrentX(e.touches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!isSwipping) return;
    
    const diff = currentX - startX;
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    setIsSwipping(false);
    setCurrentX(0);
  };
  
  const translateX = isSwipping ? currentX - startX : 0;
  
  return (
    <div
      className={`
        transform transition-transform
        ${className}
      `}
      style={{
        transform: `translateX(${translateX}px)`
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
```

## **♿ ACCESSIBILITY PATTERNS**

### **Accessible Form Components**

```typescript
// Accessible FormField
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className = ''
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  
  return (
    <div className={`form-field ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': error ? errorId : undefined,
          'aria-invalid': !!error,
          'aria-required': required
        })}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible Modal
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Focus management
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);
  
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}
        tabIndex={-1}
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

## **🎯 CONCLUSION**

These component patterns provide a solid foundation for building consistent, maintainable, and accessible React components. Remember to:

1. **Follow the standard structure** - Consistent patterns make code predictable
2. **Document everything** - Future AI coders will thank you
3. **Test thoroughly** - Include unit tests for all components
4. **Optimize for mobile** - Mobile-first design principles
5. **Ensure accessibility** - WCAG 2.1 compliance is mandatory
6. **Performance matters** - Use memoization and lazy loading

**Every component should be a work of art that makes other developers weep with joy.** 🎨✨