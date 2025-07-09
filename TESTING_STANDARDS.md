# 🧪 TESTING STANDARDS FOR STR CERTIFIED

*Comprehensive testing patterns and requirements for building reliable, maintainable code*

## **🎯 TESTING PHILOSOPHY**

Our testing strategy is built on the testing pyramid principle with a focus on:

- **Unit Tests (70%)** - Fast, isolated tests for individual functions and components
- **Integration Tests (20%)** - Tests for component interactions and API integration
- **End-to-End Tests (10%)** - Critical user workflows and business processes

**Core Testing Principles:**
- **Test Behavior, Not Implementation** - Focus on what the code does, not how it does it
- **Write Tests First** - TDD approach for better design and coverage
- **Keep Tests Simple** - Each test should verify one specific behavior
- **Make Tests Reliable** - Tests should pass consistently and fail only when there's a real issue
- **Optimize for Maintainability** - Tests should be easy to read, understand, and modify

## **🏗️ TESTING FRAMEWORK SETUP**

### **Core Testing Stack**
```typescript
// package.json testing dependencies
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "msw": "^2.0.0",
    "happy-dom": "^12.0.0"
  }
}

// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts',
        'src/main.tsx'
      ]
    }
  }
});

// src/test/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});
```

## **🔬 UNIT TESTING PATTERNS**

### **Pattern 1: Component Testing**

```typescript
/**
 * Component testing template with comprehensive coverage
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectionCard } from './InspectionCard';
import { mockInspection } from '../__mocks__/inspection';

describe('InspectionCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnView = vi.fn();

  const defaultProps = {
    inspection: mockInspection,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onView: mockOnView
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders inspection information correctly', () => {
      render(<InspectionCard {...defaultProps} />);

      expect(screen.getByText(mockInspection.property.name)).toBeInTheDocument();
      expect(screen.getByText(mockInspection.status)).toBeInTheDocument();
      expect(screen.getByText(`${mockInspection.checklistItems.length} items`)).toBeInTheDocument();
      expect(screen.getByText(`${mockInspection.completionPercentage}% complete`)).toBeInTheDocument();
    });

    it('renders status badge with correct variant', () => {
      render(<InspectionCard {...defaultProps} />);

      const statusBadge = screen.getByText(mockInspection.status);
      expect(statusBadge).toHaveClass(`badge-${mockInspection.status}`);
    });

    it('renders action buttons', () => {
      render(<InspectionCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <InspectionCard {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('User Interactions', () => {
    it('calls onView when view button is clicked', async () => {
      const user = userEvent.setup();
      render(<InspectionCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /view/i }));

      expect(mockOnView).toHaveBeenCalledWith(mockInspection.id);
      expect(mockOnView).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<InspectionCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /edit/i }));

      expect(mockOnEdit).toHaveBeenCalledWith(mockInspection.id);
    });

    it('shows confirmation dialog before deletion', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<InspectionCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this inspection?'
      );
      expect(mockOnDelete).toHaveBeenCalledWith(mockInspection.id);
    });

    it('does not delete when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<InspectionCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles deletion errors gracefully', async () => {
      const user = userEvent.setup();
      const error = new Error('Delete failed');
      mockOnDelete.mockRejectedValueOnce(error);
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<InspectionCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to delete inspection/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during deletion', async () => {
      const user = userEvent.setup();
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });

      mockOnDelete.mockReturnValue(deletePromise);
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<InspectionCard {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();

      resolveDelete!();
      await waitFor(() => {
        expect(screen.queryByText(/deleting/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<InspectionCard {...defaultProps} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete inspection');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<InspectionCard {...defaultProps} />);

      const viewButton = screen.getByRole('button', { name: /view/i });
      await user.tab();
      
      expect(viewButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockOnView).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing inspection data gracefully', () => {
      const incompleteInspection = {
        ...mockInspection,
        property: { ...mockInspection.property, name: '' }
      };

      render(<InspectionCard {...defaultProps} inspection={incompleteInspection} />);

      expect(screen.getByText('Unnamed Property')).toBeInTheDocument();
    });

    it('handles large completion percentages', () => {
      const completedInspection = {
        ...mockInspection,
        completionPercentage: 100
      };

      render(<InspectionCard {...defaultProps} inspection={completedInspection} />);

      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });
  });
});
```

### **Pattern 2: Hook Testing**

```typescript
/**
 * Custom hook testing template
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInspectionForm } from './useInspectionForm';
import { CreateInspectionSchema } from '../schemas/inspection';

describe('useInspectionForm', () => {
  const mockOnSubmit = vi.fn();
  const initialValues = {
    propertyId: '',
    scheduledDate: new Date(),
    notes: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with provided values', () => {
      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues,
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('sets default values when none provided', () => {
      const { result } = renderHook(() =>
        useInspectionForm({
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      expect(result.current.values.propertyId).toBe('');
      expect(result.current.values.notes).toBe('');
      expect(result.current.values.scheduledDate).toBeInstanceOf(Date);
    });
  });

  describe('Form Validation', () => {
    it('validates required fields', () => {
      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues,
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.propertyId).toBe('Property is required');
      expect(result.current.isValid).toBe(false);
    });

    it('validates field formats', () => {
      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues: {
            ...initialValues,
            propertyId: 'invalid-id',
            scheduledDate: new Date('invalid')
          },
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.propertyId).toBe('Invalid property ID format');
      expect(result.current.errors.scheduledDate).toBe('Invalid date');
    });

    it('clears errors when fields are corrected', () => {
      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues,
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      // Set invalid value
      act(() => {
        result.current.setValue('propertyId', '');
        result.current.validate();
      });

      expect(result.current.errors.propertyId).toBeTruthy();

      // Correct the value
      act(() => {
        result.current.setValue('propertyId', 'valid-id');
      });

      expect(result.current.errors.propertyId).toBeFalsy();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with valid data', async () => {
      const validData = {
        propertyId: 'valid-id',
        scheduledDate: new Date('2024-12-31'),
        notes: 'Test notes'
      };

      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues: validData,
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      await act(async () => {
        await result.current.submit();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(validData);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('prevents submission with invalid data', async () => {
      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues,
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      await act(async () => {
        await result.current.submit();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.propertyId).toBeTruthy();
    });

    it('handles submission errors', async () => {
      const error = new Error('Submission failed');
      mockOnSubmit.mockRejectedValueOnce(error);

      const validData = {
        propertyId: 'valid-id',
        scheduledDate: new Date('2024-12-31'),
        notes: 'Test notes'
      };

      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues: validData,
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.errors.general).toBe('Submission failed');
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Form Reset', () => {
    it('resets form to initial values', () => {
      const { result } = renderHook(() =>
        useInspectionForm({
          initialValues,
          onSubmit: mockOnSubmit,
          validationSchema: CreateInspectionSchema
        })
      );

      // Modify form
      act(() => {
        result.current.setValue('propertyId', 'modified-id');
        result.current.setError('propertyId', 'Some error');
      });

      expect(result.current.values.propertyId).toBe('modified-id');
      expect(result.current.errors.propertyId).toBe('Some error');

      // Reset form
      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
    });
  });
});
```

### **Pattern 3: Service Testing**

```typescript
/**
 * Service layer testing template
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InspectionService } from './InspectionService';
import { InspectionRepository } from '../repositories/InspectionRepository';
import { AIService } from '../services/AIService';
import { Logger } from '../utils/Logger';
import { mockInspection, mockCreateInspectionRequest } from '../__mocks__/inspection';

// Mock dependencies
vi.mock('../repositories/InspectionRepository');
vi.mock('../services/AIService');
vi.mock('../utils/Logger');

describe('InspectionService', () => {
  let inspectionService: InspectionService;
  let mockInspectionRepository: vi.Mocked<InspectionRepository>;
  let mockAIService: vi.Mocked<AIService>;
  let mockLogger: vi.Mocked<Logger>;

  beforeEach(() => {
    mockInspectionRepository = vi.mocked(new InspectionRepository());
    mockAIService = vi.mocked(new AIService());
    mockLogger = vi.mocked(new Logger());

    inspectionService = new InspectionService(
      mockInspectionRepository,
      mockAIService,
      mockLogger
    );

    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates inspection successfully', async () => {
      const expectedChecklist = [
        { id: '1', title: 'Check smoke detectors', category: 'safety' },
        { id: '2', title: 'Test WiFi', category: 'amenities' }
      ];

      mockAIService.generateChecklist.mockResolvedValue(expectedChecklist);
      mockInspectionRepository.create.mockResolvedValue(mockInspection);

      const result = await inspectionService.create(mockCreateInspectionRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockInspection);
      }

      expect(mockAIService.generateChecklist).toHaveBeenCalledWith(
        mockCreateInspectionRequest.propertyId
      );
      expect(mockInspectionRepository.create).toHaveBeenCalledWith({
        ...mockCreateInspectionRequest,
        status: 'draft',
        checklistItems: expectedChecklist,
        completionPercentage: 0
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Inspection created',
        { inspectionId: mockInspection.id }
      );
    });

    it('handles validation errors', async () => {
      const invalidRequest = {
        ...mockCreateInspectionRequest,
        propertyId: '' // Invalid
      };

      const result = await inspectionService.create(invalidRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toContain('Property ID is required');
      }

      expect(mockInspectionRepository.create).not.toHaveBeenCalled();
    });

    it('handles AI service failures', async () => {
      const aiError = new Error('AI service unavailable');
      mockAIService.generateChecklist.mockRejectedValue(aiError);

      const result = await inspectionService.create(mockCreateInspectionRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to generate checklist');
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'AI service failed',
        expect.objectContaining({ error: aiError })
      );
    });

    it('handles repository failures', async () => {
      const repositoryError = new Error('Database connection failed');
      mockAIService.generateChecklist.mockResolvedValue([]);
      mockInspectionRepository.create.mockRejectedValue(repositoryError);

      const result = await inspectionService.create(mockCreateInspectionRequest);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to create inspection');
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create inspection',
        expect.objectContaining({ error: repositoryError })
      );
    });
  });

  describe('update', () => {
    it('updates inspection successfully', async () => {
      const updateData = {
        notes: 'Updated notes',
        checklistItems: [
          { id: '1', status: 'completed' },
          { id: '2', status: 'pending' }
        ]
      };

      const updatedInspection = {
        ...mockInspection,
        ...updateData,
        completionPercentage: 50
      };

      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      mockInspectionRepository.update.mockResolvedValue(updatedInspection);

      const result = await inspectionService.update(mockInspection.id, updateData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(updatedInspection);
      }

      expect(mockInspectionRepository.update).toHaveBeenCalledWith(
        mockInspection.id,
        expect.objectContaining({
          ...updateData,
          completionPercentage: 50
        })
      );
    });

    it('handles non-existent inspection', async () => {
      mockInspectionRepository.findById.mockResolvedValue(null);

      const result = await inspectionService.update('non-existent-id', {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Inspection not found');
      }

      expect(mockInspectionRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('completes inspection when fully done', async () => {
      const completedInspection = {
        ...mockInspection,
        completionPercentage: 100
      };

      const finalInspection = {
        ...completedInspection,
        status: 'completed',
        completedAt: expect.any(String)
      };

      mockInspectionRepository.findById.mockResolvedValue(completedInspection);
      mockInspectionRepository.update.mockResolvedValue(finalInspection);

      const result = await inspectionService.complete(mockInspection.id);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('completed');
        expect(result.data.completedAt).toBeDefined();
      }
    });

    it('prevents completion of incomplete inspection', async () => {
      const incompleteInspection = {
        ...mockInspection,
        completionPercentage: 75
      };

      mockInspectionRepository.findById.mockResolvedValue(incompleteInspection);

      const result = await inspectionService.complete(mockInspection.id);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Inspection is not fully completed');
      }

      expect(mockInspectionRepository.update).not.toHaveBeenCalled();
    });
  });
});
```

## **🔗 INTEGRATION TESTING**

### **Pattern 1: API Integration Testing**

```typescript
/**
 * API integration testing with MSW
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectionList } from './InspectionList';
import { mockInspections } from '../__mocks__/inspection';

// Mock server setup
const server = setupServer(
  rest.get('/api/inspections', (req, res, ctx) => {
    return res(ctx.json(mockInspections));
  }),

  rest.post('/api/inspections', (req, res, ctx) => {
    const newInspection = {
      id: 'new-id',
      ...req.body,
      createdAt: new Date().toISOString()
    };
    return res(ctx.json(newInspection));
  }),

  rest.delete('/api/inspections/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  })
);

describe('InspectionList Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('loads and displays inspections', async () => {
    render(<InspectionList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    mockInspections.forEach(inspection => {
      expect(screen.getByText(inspection.property.name)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/inspections', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    render(<InspectionList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load inspections/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('creates new inspection', async () => {
    const user = userEvent.setup();
    render(<InspectionList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click create button
    await user.click(screen.getByRole('button', { name: /create inspection/i }));

    // Fill form
    await user.type(screen.getByLabelText(/property/i), 'Test Property');
    await user.type(screen.getByLabelText(/notes/i), 'Test notes');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));

    // Verify new inspection appears
    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });
  });

  it('deletes inspection', async () => {
    const user = userEvent.setup();
    render(<InspectionList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const firstInspection = mockInspections[0];
    expect(screen.getByText(firstInspection.property.name)).toBeInTheDocument();

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(deleteButton);

    // Verify inspection is removed
    await waitFor(() => {
      expect(screen.queryByText(firstInspection.property.name)).not.toBeInTheDocument();
    });
  });
});
```

### **Pattern 2: Component Integration Testing**

```typescript
/**
 * Component integration testing
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InspectionForm } from './InspectionForm';
import { PropertiesProvider } from '../contexts/PropertiesContext';
import { mockProperties } from '../__mocks__/property';

// Mock context provider
const MockPropertiesProvider = ({ children }) => {
  return (
    <PropertiesProvider value={{
      properties: mockProperties,
      loading: false,
      error: null,
      refetch: vi.fn()
    }}>
      {children}
    </PropertiesProvider>
  );
};

describe('InspectionForm Integration', () => {
  const mockOnSubmit = vi.fn();

  it('integrates with properties context', async () => {
    render(
      <MockPropertiesProvider>
        <InspectionForm onSubmit={mockOnSubmit} />
      </MockPropertiesProvider>
    );

    const propertySelect = screen.getByLabelText(/property/i);
    
    // Properties should be loaded from context
    mockProperties.forEach(property => {
      expect(screen.getByText(property.name)).toBeInTheDocument();
    });
  });

  it('validates form with context data', async () => {
    const user = userEvent.setup();
    
    render(
      <MockPropertiesProvider>
        <InspectionForm onSubmit={mockOnSubmit} />
      </MockPropertiesProvider>
    );

    // Select property
    await user.selectOptions(
      screen.getByLabelText(/property/i),
      mockProperties[0].id
    );

    // Set date
    await user.type(
      screen.getByLabelText(/scheduled date/i),
      '2024-12-31'
    );

    // Submit form
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        propertyId: mockProperties[0].id,
        scheduledDate: expect.any(Date),
        notes: ''
      });
    });
  });

  it('handles context loading state', () => {
    const LoadingPropertiesProvider = ({ children }) => (
      <PropertiesProvider value={{
        properties: [],
        loading: true,
        error: null,
        refetch: vi.fn()
      }}>
        {children}
      </PropertiesProvider>
    );

    render(
      <LoadingPropertiesProvider>
        <InspectionForm onSubmit={mockOnSubmit} />
      </LoadingPropertiesProvider>
    );

    expect(screen.getByText(/loading properties/i)).toBeInTheDocument();
  });
});
```

## **🎭 END-TO-END TESTING**

### **Pattern 1: Critical User Flow Testing**

```typescript
/**
 * End-to-end testing with Playwright
 */
import { test, expect } from '@playwright/test';

test.describe('Inspection Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'inspector@test.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for authentication
    await page.waitForURL('/dashboard');
  });

  test('complete inspection workflow', async ({ page }) => {
    // Navigate to inspections
    await page.click('[data-testid="nav-inspections"]');
    await page.waitForURL('/inspections');

    // Create new inspection
    await page.click('[data-testid="create-inspection"]');
    await page.selectOption('[data-testid="property-select"]', 'property-1');
    await page.fill('[data-testid="scheduled-date"]', '2024-12-31');
    await page.fill('[data-testid="notes"]', 'Test inspection');
    await page.click('[data-testid="submit-button"]');

    // Wait for creation
    await page.waitForSelector('[data-testid="inspection-card"]');

    // Open inspection
    await page.click('[data-testid="inspection-card"]');
    await page.waitForURL('/inspections/*/edit');

    // Complete checklist items
    const checklistItems = await page.locator('[data-testid="checklist-item"]');
    const itemCount = await checklistItems.count();

    for (let i = 0; i < itemCount; i++) {
      const item = checklistItems.nth(i);
      
      // Take photo
      await item.locator('[data-testid="photo-capture"]').click();
      await page.setInputFiles('[data-testid="file-input"]', 'test-photo.jpg');
      
      // Mark as completed
      await item.locator('[data-testid="status-select"]').selectOption('completed');
      await item.locator('[data-testid="save-item"]').click();
    }

    // Complete inspection
    await page.click('[data-testid="complete-inspection"]');
    await page.click('[data-testid="confirm-completion"]');

    // Verify completion
    await expect(page.locator('[data-testid="inspection-status"]')).toContainText('Completed');
  });

  test('handles offline scenario', async ({ page, context }) => {
    // Start inspection
    await page.goto('/inspections/test-id/edit');

    // Go offline
    await context.setOffline(true);

    // Try to upload photo
    await page.locator('[data-testid="checklist-item"]').first().locator('[data-testid="photo-capture"]').click();
    await page.setInputFiles('[data-testid="file-input"]', 'test-photo.jpg');

    // Should show offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Should sync automatically
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
  });

  test('mobile inspection workflow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to inspection
    await page.goto('/inspections/test-id/edit');

    // Test mobile-specific features
    await page.locator('[data-testid="checklist-item"]').first().tap();
    
    // Test camera access
    await page.locator('[data-testid="camera-button"]').tap();
    await page.waitForSelector('[data-testid="camera-preview"]');
    
    // Test photo capture
    await page.locator('[data-testid="capture-button"]').tap();
    await page.waitForSelector('[data-testid="photo-preview"]');

    // Test swipe gestures
    await page.locator('[data-testid="checklist-item"]').first().hover();
    await page.mouse.down();
    await page.mouse.move(100, 0);
    await page.mouse.up();

    // Should show swipe actions
    await expect(page.locator('[data-testid="swipe-actions"]')).toBeVisible();
  });
});
```

## **🧪 TESTING UTILITIES**

### **Mock Factory Pattern**

```typescript
/**
 * Mock factory for consistent test data
 */
import { faker } from '@faker-js/faker';
import { Inspection, ChecklistItem, Property } from '../types';

export const createMockProperty = (overrides?: Partial<Property>): Property => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  address: faker.location.streetAddress(),
  type: 'house',
  bedrooms: faker.number.int({ min: 1, max: 5 }),
  bathrooms: faker.number.int({ min: 1, max: 3 }),
  maxGuests: faker.number.int({ min: 2, max: 10 }),
  amenities: [],
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

export const createMockChecklistItem = (overrides?: Partial<ChecklistItem>): ChecklistItem => ({
  id: faker.string.uuid(),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  category: faker.helpers.arrayElement(['safety', 'cleanliness', 'amenities', 'maintenance']),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
  status: faker.helpers.arrayElement(['pending', 'completed', 'failed', 'not_applicable']),
  photos: [],
  notes: faker.lorem.sentence(),
  required: faker.datatype.boolean(),
  aiAnalysis: null,
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

export const createMockInspection = (overrides?: Partial<Inspection>): Inspection => ({
  id: faker.string.uuid(),
  property: createMockProperty(),
  inspector: {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email()
  },
  status: faker.helpers.arrayElement(['draft', 'in_progress', 'completed', 'cancelled']),
  scheduledDate: faker.date.future().toISOString(),
  checklistItems: Array.from({ length: 5 }, () => createMockChecklistItem()),
  completionPercentage: faker.number.int({ min: 0, max: 100 }),
  notes: faker.lorem.paragraph(),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides
});

// Bulk creation helpers
export const createMockInspections = (count: number = 3): Inspection[] =>
  Array.from({ length: count }, () => createMockInspection());

export const createMockProperties = (count: number = 5): Property[] =>
  Array.from({ length: count }, () => createMockProperty());
```

### **Test Wrapper Pattern**

```typescript
/**
 * Test wrapper for consistent test setup
 */
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

interface TestWrapperProps {
  children: React.ReactNode;
  initialRoute?: string;
  queryClient?: QueryClient;
  user?: any;
}

const TestWrapper = ({ 
  children, 
  initialRoute = '/', 
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  }),
  user = null 
}: TestWrapperProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider initialUser={user}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: RenderOptions & {
    initialRoute?: string;
    user?: any;
  }
) => {
  const { initialRoute, user, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper initialRoute={initialRoute} user={user}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions
  });
};

export * from '@testing-library/react';
export { customRender as render };
```

## **📊 TESTING METRICS & COVERAGE**

### **Coverage Requirements**

```typescript
// vitest.config.ts coverage configuration
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Stricter requirements for critical paths
        'src/domains/inspection/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/services/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      exclude: [
        'src/test/',
        '**/*.d.ts',
        '**/*.config.ts',
        'src/main.tsx',
        'src/__mocks__/'
      ]
    }
  }
});
```

### **Test Quality Metrics**

```typescript
/**
 * Test quality assessment utilities
 */
export const testQualityMetrics = {
  // Test completeness
  measureTestCompleteness: (testSuite: string) => {
    const stats = {
      totalTests: 0,
      passingTests: 0,
      failingTests: 0,
      skippedTests: 0,
      coverage: 0
    };
    
    // Implementation would analyze test results
    return stats;
  },

  // Test reliability
  measureTestReliability: (testHistory: TestRun[]) => {
    const flakyTests = testHistory.filter(run => 
      run.attempts > 1 && run.status === 'passed'
    );
    
    return {
      totalRuns: testHistory.length,
      flakyTests: flakyTests.length,
      reliabilityScore: (testHistory.length - flakyTests.length) / testHistory.length
    };
  },

  // Test performance
  measureTestPerformance: (testResults: TestResult[]) => {
    const executionTimes = testResults.map(r => r.duration);
    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    
    return {
      totalTests: testResults.length,
      avgExecutionTime,
      slowTests: testResults.filter(r => r.duration > 1000), // > 1 second
      fastestTest: Math.min(...executionTimes),
      slowestTest: Math.max(...executionTimes)
    };
  }
};
```

## **🎯 TESTING BEST PRACTICES**

### **Test Organization**

```typescript
// ✅ GOOD: Clear test organization
describe('InspectionService', () => {
  describe('create', () => {
    describe('when valid data is provided', () => {
      it('creates inspection successfully', () => {
        // Test implementation
      });
      
      it('generates checklist items', () => {
        // Test implementation
      });
    });
    
    describe('when invalid data is provided', () => {
      it('throws validation error', () => {
        // Test implementation
      });
    });
    
    describe('when external service fails', () => {
      it('handles AI service failure', () => {
        // Test implementation
      });
    });
  });
});

// ❌ BAD: Unclear test organization
describe('InspectionService', () => {
  it('test1', () => {});
  it('test2', () => {});
  it('test3', () => {});
});
```

### **Test Naming**

```typescript
// ✅ GOOD: Descriptive test names
describe('useInspectionForm', () => {
  it('should validate required fields when form is submitted', () => {});
  it('should clear validation errors when field value changes', () => {});
  it('should disable submit button when form is invalid', () => {});
});

// ❌ BAD: Vague test names
describe('useInspectionForm', () => {
  it('should work', () => {});
  it('should validate', () => {});
  it('should submit', () => {});
});
```

### **Test Data Management**

```typescript
// ✅ GOOD: Consistent test data
beforeEach(() => {
  mockInspection = createMockInspection({
    status: 'draft',
    completionPercentage: 0
  });
});

// ❌ BAD: Hardcoded test data
beforeEach(() => {
  mockInspection = {
    id: 'test-id',
    property: { name: 'Test Property' },
    // ... lots of hardcoded data
  };
});
```

## **🚀 CONTINUOUS INTEGRATION**

### **GitHub Actions Workflow**

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run typecheck
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
```

---

## **🎯 CONCLUSION**

Comprehensive testing ensures our platform is reliable, maintainable, and user-friendly. Remember:

1. **Test behavior, not implementation** - Focus on what the code does
2. **Keep tests simple and focused** - One test, one responsibility
3. **Write tests first** - TDD leads to better design
4. **Mock external dependencies** - Keep tests fast and reliable
5. **Test edge cases** - Cover error scenarios and boundary conditions
6. **Maintain test quality** - Tests are code too, keep them clean

**Good tests are the foundation of confident development!** 🧪✨

---

*This guide is living documentation. Please update it as we learn and improve our testing practices.*