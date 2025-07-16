# 🚀 PRODUCTION DEPLOYMENT GUIDE

## **Overview**

This guide covers the complete deployment process for STR Certified, including the critical database compatibility layer that resolves schema mismatches between application expectations and production database structure.

## **🔧 Pre-Deployment Checklist**

### **Database Compatibility Layer**
- [ ] **Compatibility migration executed** in production Supabase
- [ ] **All views verified** (users, properties_fixed, inspection_checklist_items, inspections_fixed, checklist_items_compat)
- [ ] **UUID conversion functions working** (int_to_uuid, uuid_to_int)
- [ ] **Test queries successful** with production data
- [ ] **Row Level Security policies active** on all base tables

### **Application Code**
- [ ] **Service layer updated** to use compatibility views
- [ ] **All direct table references removed** from application code
- [ ] **TypeScript interfaces updated** to match compatibility layer structure
- [ ] **Error handling improved** for schema-related issues

### **Environment Configuration**
- [ ] **Environment variables set** for production
- [ ] **Supabase connection verified** with proper credentials
- [ ] **API keys secured** and not exposed in client code
- [ ] **CORS settings configured** for production domain

## **🗃️ Database Migration Process**

### **Step 1: Execute Compatibility Migration**

```sql
-- Execute in Supabase SQL Editor (Production)
-- File: database_compatibility_migration.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- [Full migration script from previous sections]
-- Creates all compatibility views and functions
```

### **Step 2: Verify Migration Success**

```sql
-- Execute in Supabase SQL Editor
-- File: test_compatibility_layer.sql

-- Test UUID conversion
SELECT int_to_uuid(1), uuid_to_int(int_to_uuid(1));

-- Test view accessibility
SELECT 'users' as view_name, COUNT(*) FROM users
UNION ALL SELECT 'properties_fixed', COUNT(*) FROM properties_fixed;

-- Test relationships
SELECT i.id, p.name FROM inspections_fixed i 
JOIN properties_fixed p ON p.id = i.property_id LIMIT 3;
```

### **Step 3: Validate Production Data**

Expected results from test queries:
- ✅ **UUID conversion working** (property ID 1 → UUID → back to 1)
- ✅ **Users accessible** (should show user count > 0)
- ✅ **Properties accessible** (should show property count > 0)
- ✅ **Relationships working** (inspections linked to properties)

## **🚀 Application Deployment**

### **Build Process**

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Deployment to Railway**

```bash
# Login to Railway
railway login

# Link to project
railway link

# Deploy to production
railway up

# Monitor deployment
railway logs
```

### **Environment Variables**

Required environment variables for production:

```env
# Database
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_OPENAI_API_KEY=your_openai_api_key

# Application
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0

# Monitoring
VITE_SENTRY_DSN=your_sentry_dsn (optional)
```

## **🔍 Post-Deployment Verification**

### **Functional Testing**

#### **Admin Portal Tests:**
1. **Navigate to admin portal**
   - Should load without blank screens
   - Properties list should display with real data
   - Inspections should show actual inspection sessions

2. **Property Management:**
   - Properties should display with proper names and addresses
   - Property details should load correctly
   - UUID-based property IDs should work in URLs

3. **Inspection Management:**
   - Inspection list should show real inspection sessions
   - Checklist items should display from logs table
   - Status mappings should work correctly (pending, completed, failed)

4. **User Management:**
   - User list should show profiles data
   - User authentication should work properly
   - Permissions should be enforced correctly

#### **Database Connectivity Tests:**
```typescript
// Run these tests in browser console after deployment
console.log('Testing database connectivity...');

// Test properties
supabase.from('properties_fixed').select('id, name').limit(3)
  .then(result => console.log('Properties:', result));

// Test users  
supabase.from('users').select('id, name, email').limit(3)
  .then(result => console.log('Users:', result));

// Test checklist items
supabase.from('inspection_checklist_items').select('id, status').limit(3)
  .then(result => console.log('Checklist Items:', result));
```

### **Performance Monitoring**

#### **Key Metrics to Monitor:**
- **Page load times** (should be < 3 seconds)
- **Database query performance** (compatibility views should be fast)
- **API response times** (all endpoints < 500ms)
- **Error rates** (should be < 1%)

#### **Monitoring Setup:**
```typescript
// Add to main application file
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
});
```

## **🚨 Troubleshooting Guide**

### **Common Deployment Issues**

#### **"Relation does not exist" Errors**
```sql
-- Verify views exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('users', 'properties_fixed', 'inspection_checklist_items');

-- If missing, re-run migration
```

#### **UUID Conversion Failures**
```sql
-- Test UUID functions
SELECT int_to_uuid(1);
SELECT uuid_to_int('b04965e6-a9bb-591f-8f8a-1adcb2c8dc39');

-- If functions missing, re-run migration
```

#### **Permission Denied Errors**
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles
FROM pg_policies 
WHERE tablename IN ('profiles', 'properties', 'logs');

-- Verify grants
SELECT grantee, privilege_type, table_name
FROM information_schema.role_table_grants
WHERE table_name IN ('users', 'properties_fixed');
```

#### **Blank Screens Still Appearing**
1. **Check browser console** for JavaScript errors
2. **Verify Supabase connection** in Network tab
3. **Test database queries** directly in Supabase dashboard
4. **Check authentication** - ensure user is properly logged in

### **Performance Issues**

#### **Slow Query Performance**
```sql
-- Analyze query plans for compatibility views
EXPLAIN ANALYZE SELECT * FROM properties_fixed LIMIT 10;
EXPLAIN ANALYZE SELECT * FROM inspection_checklist_items LIMIT 10;

-- Consider adding indexes to base tables if needed
CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id);
CREATE INDEX IF NOT EXISTS idx_logs_inspection_session_id ON logs(inspection_session_id);
```

#### **High Memory Usage**
- Monitor compatibility view performance
- Consider materialized views for frequently accessed data
- Optimize complex joins in views

## **📊 Health Checks**

### **Automated Health Check Endpoint**

```typescript
// Add to your application
export const healthCheck = async (): Promise<HealthStatus> => {
  try {
    // Test database connectivity
    const { data: properties, error: propError } = await supabase
      .from('properties_fixed')
      .select('id')
      .limit(1);
    
    if (propError) throw new Error(`Database error: ${propError.message}`);
    
    // Test UUID conversion
    const { data: uuidTest } = await supabase
      .rpc('int_to_uuid', { input_int: 1 });
    
    if (!uuidTest) throw new Error('UUID conversion failed');
    
    return {
      status: 'healthy',
      database: 'connected',
      compatibility_layer: 'active',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
```

### **Manual Health Verification**

```bash
# Test application endpoint
curl https://your-app-domain.com/health

# Test Supabase connectivity
curl -H "apikey: YOUR_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/properties_fixed?select=id&limit=1"
```

## **🔄 Rollback Procedures**

### **Application Rollback**
```bash
# Railway rollback to previous deployment
railway rollback

# Or redeploy specific version
railway up --detach
```

### **Database Rollback**
```sql
-- Remove compatibility layer if needed (DANGER - TEST FIRST)
DROP VIEW IF EXISTS users;
DROP VIEW IF EXISTS properties_fixed;
DROP VIEW IF EXISTS inspection_checklist_items;
DROP VIEW IF EXISTS inspections_fixed;
DROP VIEW IF EXISTS checklist_items_compat;
DROP FUNCTION IF EXISTS int_to_uuid(INTEGER);
DROP FUNCTION IF EXISTS uuid_to_int(UUID);
DROP FUNCTION IF EXISTS create_inspection_compatibility(UUID, UUID, TEXT);
```

## **📈 Scaling Considerations**

### **Database Performance**
- Monitor compatibility view query performance
- Consider materialized views for heavy read workloads
- Index optimization on base tables

### **Application Performance**
- Implement caching for frequently accessed compatibility data
- Use connection pooling for database connections
- Monitor memory usage of UUID conversion operations

---

**Last Updated:** July 16, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

**Critical Success Metrics:**
- ✅ Zero blank screens in admin portal
- ✅ All database queries working through compatibility layer
- ✅ UUID/integer conversion functioning properly
- ✅ User authentication and permissions working
- ✅ Real production data accessible throughout application