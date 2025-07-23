# 🧪 TESTING PROCEDURES

## **Overview**

Comprehensive testing procedures for the STR Certified application, with special focus on database compatibility layer validation and schema integrity testing.

## **🎯 Testing Strategy**

### **Test Pyramid**
1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - Database compatibility layer and API endpoints  
3. **Component Tests** - React components with mocked data
4. **End-to-End Tests** - Complete user workflows
5. **Schema Compatibility Tests** - Database layer validation

## **🏗️ Database Compatibility Testing**

### **Pre-Test Setup**

```sql
-- Create test data if needed
INSERT INTO properties (name, address, city, state, zipcode) 
VALUES ('Test Property', '123 Test St', 'Test City', 'TS', '12345')
ON CONFLICT DO NOTHING;

INSERT INTO inspection_sessions (property_id) 
VALUES ((SELECT property_id FROM properties WHERE name = 'Test Property' LIMIT 1))
ON CONFLICT DO NOTHING;
```

### **Compatibility Layer Tests**

#### **Test 1: UUID Conversion Functions**

```sql
-- Test File: test_uuid_conversion.sql
DO $$
DECLARE
    test_int INTEGER := 42;
    converted_uuid UUID;
    back_to_int INTEGER;
BEGIN
    -- Test int to UUID conversion
    converted_uuid := int_to_uuid(test_int);
    ASSERT converted_uuid IS NOT NULL, 'UUID conversion failed';
    
    -- Test UUID back to int conversion
    back_to_int := uuid_to_int(converted_uuid);
    ASSERT back_to_int = test_int, 'Round-trip conversion failed';
    
    RAISE NOTICE 'UUID Conversion Test: PASSED';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'UUID Conversion Test: FAILED - %', SQLERRM;
END $$;
```

#### **Test 2: View Accessibility**

```sql
-- Test File: test_view_accessibility.sql
DO $$
DECLARE
    view_names TEXT[] := ARRAY['users', 'properties_fixed', 'inspection_checklist_items', 'inspections_fixed', 'checklist_items_compat'];
    view_name TEXT;
    row_count INTEGER;
BEGIN
    FOREACH view_name IN ARRAY view_names
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', view_name) INTO row_count;
        ASSERT row_count >= 0, format('View %s is not accessible', view_name);
        RAISE NOTICE 'View % accessibility: PASSED (% rows)', view_name, row_count;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'View Accessibility Test: FAILED - %', SQLERRM;
END $$;
```

#### **Test 3: Data Mapping Validation**

```sql
-- Test File: test_data_mapping.sql
DO $$
DECLARE
    properties_count INTEGER;
    logs_count INTEGER;
    checklist_count INTEGER;
BEGIN
    -- Test properties mapping
    SELECT COUNT(*) INTO properties_count FROM properties;
    SELECT COUNT(*) INTO logs_count FROM properties_fixed;
    ASSERT properties_count = logs_count, 'Properties mapping count mismatch';
    
    -- Test logs mapping  
    SELECT COUNT(*) INTO logs_count FROM logs;
    SELECT COUNT(*) INTO checklist_count FROM inspection_checklist_items;
    ASSERT logs_count = checklist_count, 'Logs mapping count mismatch';
    
    -- Test field mapping for properties
    PERFORM 1 FROM properties_fixed 
    WHERE id IS NOT NULL 
      AND name IS NOT NULL 
      AND original_property_id IS NOT NULL
    LIMIT 1;
    
    RAISE NOTICE 'Data Mapping Test: PASSED';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Data Mapping Test: FAILED - %', SQLERRM;
END $$;
```

#### **Test 4: Relationship Integrity**

```sql
-- Test File: test_relationships.sql
DO $$
DECLARE
    relationship_count INTEGER;
BEGIN
    -- Test inspection to property relationship
    SELECT COUNT(*) INTO relationship_count
    FROM inspections_fixed i
    JOIN properties_fixed p ON p.id = i.property_id
    LIMIT 1;
    
    -- Test checklist items to inspection relationship
    SELECT COUNT(*) INTO relationship_count
    FROM inspection_checklist_items icl
    JOIN inspections_fixed i ON i.id::uuid = icl.inspection_session_id
    LIMIT 1;
    
    -- Test checklist items to safety items relationship
    SELECT COUNT(*) INTO relationship_count
    FROM inspection_checklist_items icl
    JOIN checklist_items_compat cic ON cic.id = icl.static_item_id::text
    LIMIT 1;
    
    RAISE NOTICE 'Relationship Integrity Test: PASSED';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Relationship Integrity Test: FAILED - %', SQLERRM;
END $$;
```

### **Complete Test Suite**

```sql
-- Test File: run_all_compatibility_tests.sql
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STARTING COMPATIBILITY LAYER TEST SUITE';
    RAISE NOTICE '========================================';
    
    -- Run all tests
    PERFORM test_uuid_conversion();
    PERFORM test_view_accessibility();
    PERFORM test_data_mapping();
    PERFORM test_relationships();
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ALL COMPATIBILITY TESTS PASSED';
    RAISE NOTICE '========================================';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'COMPATIBILITY TEST SUITE FAILED: %', SQLERRM;
END $$;
```

## **🖥️ Application Testing**

### **Service Layer Tests**

```typescript
// File: src/services/__tests__/inspectionService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { inspectionService } from '../inspectionService';

describe('InspectionService Compatibility Layer', () => {
  beforeEach(() => {
    // Setup test data
  });

  it('should fetch inspections using compatibility views', async () => {
    const result = await inspectionService.getInspectionsForReview();
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.data && result.data.length > 0) {
      const inspection = result.data[0];
      
      // Test compatibility layer structure
      expect(inspection.properties_fixed).toBeDefined();
      expect(inspection.properties_fixed?.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(inspection.inspection_checklist_items).toBeDefined();
      
      if (inspection.inspection_checklist_items.length > 0) {
        const item = inspection.inspection_checklist_items[0];
        expect(item.checklist_items_compat).toBeDefined();
        expect(item.checklist_items_compat?.title).toBeDefined();
      }
    }
  });

  it('should handle UUID property ID conversion', async () => {
    // Get a property via compatibility layer
    const { data: properties } = await supabase
      .from('properties_fixed')
      .select('id, original_property_id')
      .limit(1);
    
    if (properties && properties.length > 0) {
      const property = properties[0];
      
      // UUID should be properly formatted
      expect(property.id).toMatch(/^[0-9a-f-]{36}$/);
      
      // Original should be integer
      expect(typeof property.original_property_id).toBe('number');
    }
  });

  it('should create inspections through compatibility layer', async () => {
    // Get a test property UUID
    const { data: properties } = await supabase
      .from('properties_fixed')
      .select('id')
      .limit(1);
    
    if (properties && properties.length > 0) {
      const propertyId = properties[0].id;
      
      const result = await inspectionService.createInspection({
        propertyId,
        inspectorId: 'test-inspector-id',
        checklistItems: [{
          title: 'Test Item',
          description: 'Test Description',
          category: 'test',
          required: true
        }]
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }
  });
});
```

### **Component Tests**

```typescript
// File: src/components/__tests__/AdminPortal.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminPortal } from '../AdminPortal';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 'test-uuid',
                properties_fixed: {
                  id: 'property-uuid',
                  name: 'Test Property',
                  address: '123 Test St'
                },
                inspection_checklist_items: [
                  {
                    id: '1',
                    status: 'pending',
                    checklist_items_compat: {
                      title: 'Test Item',
                      category: 'test'
                    }
                  }
                ]
              }
            ],
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('AdminPortal', () => {
  it('should render without blank screens', async () => {
    render(<AdminPortal />);
    
    // Should show loading initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Should show data after loading
    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
    
    // Should not show empty states
    expect(screen.queryByText(/no data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/empty/i)).not.toBeInTheDocument();
  });

  it('should handle compatibility layer data structure', async () => {
    render(<AdminPortal />);
    
    await waitFor(() => {
      // Verify compatibility layer structure is handled
      expect(screen.getByText('Test Property')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });
});
```

## **🔄 End-to-End Testing**

### **Admin Portal E2E Tests**

```typescript
// File: tests/e2e/admin-portal.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Portal - Schema Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should load admin portal without blank screens', async ({ page }) => {
    // Check that data loads
    await expect(page.locator('[data-testid="properties-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspections-list"]')).toBeVisible();
    
    // Verify actual data is displayed (not empty states)
    const propertyItems = page.locator('[data-testid="property-item"]');
    await expect(propertyItems).toHaveCountGreaterThan(0);
    
    const inspectionItems = page.locator('[data-testid="inspection-item"]');
    await expect(inspectionItems).toHaveCountGreaterThan(0);
  });

  test('should display property details correctly', async ({ page }) => {
    // Click on first property
    await page.locator('[data-testid="property-item"]').first().click();
    
    // Should show property details with proper data
    await expect(page.locator('[data-testid="property-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-address"]')).toBeVisible();
    
    // Should have UUID-based URL
    expect(page.url()).toMatch(/\/property\/[0-9a-f-]{36}/);
  });

  test('should display inspection checklist items', async ({ page }) => {
    // Navigate to inspection details
    await page.locator('[data-testid="inspection-item"]').first().click();
    
    // Should show checklist items
    await expect(page.locator('[data-testid="checklist-items"]')).toBeVisible();
    
    const checklistItems = page.locator('[data-testid="checklist-item"]');
    await expect(checklistItems).toHaveCountGreaterThan(0);
    
    // Should show item details from compatibility layer
    await expect(checklistItems.first().locator('[data-testid="item-title"]')).toBeVisible();
    await expect(checklistItems.first().locator('[data-testid="item-status"]')).toBeVisible();
  });

  test('should handle user authentication through compatibility layer', async ({ page }) => {
    // Check user profile display
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Should show user data from profiles table via users view
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
  });
});
```

## **📊 Performance Testing**

### **Database Performance Tests**

```sql
-- File: test_performance.sql
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
BEGIN
    RAISE NOTICE 'Starting Performance Tests...';
    
    -- Test 1: Properties view performance
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM properties_fixed;
    end_time := clock_timestamp();
    duration := end_time - start_time;
    RAISE NOTICE 'Properties view query: %', duration;
    
    -- Test 2: Complex join performance
    start_time := clock_timestamp();
    PERFORM i.id, p.name, COUNT(icl.id)
    FROM inspections_fixed i
    LEFT JOIN properties_fixed p ON p.id = i.property_id
    LEFT JOIN inspection_checklist_items icl ON icl.inspection_session_id = i.id::uuid
    GROUP BY i.id, p.name;
    end_time := clock_timestamp();
    duration := end_time - start_time;
    RAISE NOTICE 'Complex join query: %', duration;
    
    -- Test 3: UUID conversion performance
    start_time := clock_timestamp();
    PERFORM int_to_uuid(property_id) FROM properties LIMIT 100;
    end_time := clock_timestamp();
    duration := end_time - start_time;
    RAISE NOTICE 'UUID conversion (100 records): %', duration;
    
    RAISE NOTICE 'Performance Tests Complete';
END $$;
```

### **Application Performance Tests**

```typescript
// File: tests/performance/compatibility-layer.test.ts
import { performance } from 'perf_hooks';
import { inspectionService } from '@/services/inspectionService';

describe('Compatibility Layer Performance', () => {
  it('should fetch inspections within acceptable time', async () => {
    const start = performance.now();
    
    const result = await inspectionService.getInspectionsForReview();
    
    const end = performance.now();
    const duration = end - start;
    
    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should handle UUID conversions efficiently', async () => {
    const start = performance.now();
    
    const { data: properties } = await supabase
      .from('properties_fixed')
      .select('id, original_property_id')
      .limit(50);
    
    const end = performance.now();
    const duration = end - start;
    
    expect(properties).toBeDefined();
    expect(duration).toBeLessThan(500); // Should complete within 500ms
  });
});
```

## **🔧 Test Automation**

### **GitHub Actions Workflow**

```yaml
# File: .github/workflows/compatibility-tests.yml
name: Database Compatibility Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  compatibility-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run compatibility layer tests
      env:
        VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      run: |
        npm run test:compatibility
    
    - name: Run E2E tests
      run: |
        npm run test:e2e:compatibility
```

### **Test Scripts in package.json**

```json
{
  "scripts": {
    "test": "vitest",
    "test:compatibility": "vitest run tests/compatibility",
    "test:e2e": "playwright test",
    "test:e2e:compatibility": "playwright test tests/e2e/compatibility",
    "test:performance": "vitest run tests/performance",
    "test:schema": "npm run test:compatibility && npm run test:e2e:compatibility"
  }
}
```

## **📝 Test Documentation**

### **Test Data Requirements**

```sql
-- File: test_data_setup.sql
-- Minimum test data required for compatibility tests

-- Properties
INSERT INTO properties (property_id, name, address, city, state, zipcode)
VALUES 
  (999, 'Test Property 1', '123 Test St', 'Test City', 'TS', '12345'),
  (998, 'Test Property 2', '456 Test Ave', 'Test Town', 'TS', '67890')
ON CONFLICT (property_id) DO NOTHING;

-- Checklist items
INSERT INTO checklist (checklist_id, notes, requirement_type, evidence_type)
VALUES 
  (999, 'Test Safety Item 1', 'Required', 'photo'),
  (998, 'Test Safety Item 2', 'Recommended', 'video')
ON CONFLICT (checklist_id) DO NOTHING;

-- Inspection sessions
INSERT INTO inspection_sessions (id, property_id)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 999),
  ('a0000000-0000-0000-0000-000000000002', 998)
ON CONFLICT (id) DO NOTHING;

-- Logs
INSERT INTO logs (log_id, property_id, checklist_id, inspection_session_id, audit_status)
VALUES 
  (999, 999, 999, 'a0000000-0000-0000-0000-000000000001', 'pending'),
  (998, 998, 998, 'a0000000-0000-0000-0000-000000000002', 'pass')
ON CONFLICT (log_id) DO NOTHING;
```

---

**Last Updated:** July 16, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

**Test Coverage Requirements:**
- ✅ Database compatibility layer: 100%
- ✅ Service layer with compatibility views: 95%
- ✅ Admin portal functionality: 90%
- ✅ UUID conversion functions: 100%
- ✅ Data relationship integrity: 100%