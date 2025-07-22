# 🚨 EMERGENCY DATABASE CONNECTIVITY FIX

## IMMEDIATE CRITICAL ISSUES

### Issue 1: RLS Policy Blocking Database Access
**Error**: "permission denied for table users"
**Cause**: Row Level Security policies in Supabase are blocking anonymous user access
**Impact**: Complete application failure - no data can be loaded

### Issue 2: Service Worker Error Masking  
**Error**: Converting auth errors to "503 Service Unavailable"
**Cause**: SW error handling transforms specific errors into generic ones
**Impact**: Developers get misleading 503 errors instead of actionable auth errors

### Issue 3: Enhanced Services Bridge Timeout
**Error**: "Enhanced Services not ready within timeout period"
**Cause**: Bridge waiting for services that can't initialize due to DB issues
**Impact**: PWA integration completely fails

## IMMEDIATE FIXES REQUIRED

### Fix 1: RLS Policy Update (CRITICAL)
Run this SQL in Supabase SQL editor:

```sql
-- Enable RLS policies for proper user access
-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'inspections', 'properties', 'logs', 'static_safety_items');

-- Create missing RLS policies for anonymous access
CREATE POLICY "Enable read access for authenticated users" ON "public"."users"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users" ON "public"."inspections"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users" ON "public"."properties"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users" ON "public"."logs"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users" ON "public"."static_safety_items"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);
```

### Fix 2: Service Worker Error Handling (CRITICAL)
File: `/public/sw.js` - Replace lines 520-540:

```javascript
// BEFORE (problematic):
} catch (error) {
  log('info', 'Network failed, trying cache', { url: url.toString(), error: error.message });
  throw new Error('Network failed and no cache available'); // Becomes generic 503
}

// AFTER (fixed):
} catch (error) {
  log('info', 'Network request failed', { 
    url: url.toString(), 
    error: error.message,
    status: networkResponse?.status 
  });
  
  // Don't mask authentication/authorization errors
  if (networkResponse?.status === 401 || networkResponse?.status === 403) {
    // Let auth errors pass through for proper handling
    return networkResponse;
  }
  
  // Only try cache for actual network/server errors
  if (networkResponse?.status >= 500 || !networkResponse) {
    const cachedResponse = await runtimeCache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  throw new Error(`Request failed: ${networkResponse?.status || 'Network Error'}`);
}
```

### Fix 3: Database Client Resilience (HIGH)
File: `src/lib/supabase/resilient-client.ts` (CREATE NEW):

```typescript
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced client with retry and error handling
export const createResilientSupabaseClient = () => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Connection': 'keep-alive'
      }
    },
    realtime: {
      timeout: 30000
    }
  });

  // Add request interceptor for better error handling
  const originalRequest = client.rest.request;
  client.rest.request = async (...args) => {
    try {
      const response = await originalRequest.apply(client.rest, args);
      return response;
    } catch (error: any) {
      // Log detailed error information
      logger.error('Supabase request failed', {
        error: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        hint: error.hint,
        endpoint: args[0]
      });

      // Provide better error messages
      if (error.code === '42501') {
        throw new Error(`Permission denied: Check RLS policies for table access. Details: ${error.details || error.message}`);
      } else if (error.code === '42P01') {
        throw new Error(`Table not found: ${error.details || error.message}`);
      } else if (error.message?.includes('Invalid API key')) {
        throw new Error('Database authentication failed: Please check API configuration');
      }

      throw error;
    }
  };

  return client;
};

export const supabase = createResilientSupabaseClient();
```

### Fix 4: Enhanced Services Bridge Timeout (MEDIUM)
File: `src/integrations/PWAEnhancedServicesBridge.ts` - Update timeout handling:

```typescript
// Line 130-142 - Increase timeout and add better error handling
private async waitForEnhancedServices(): Promise<void> {
  const maxWaitTime = 30000; // Increase to 30 seconds
  const startTime = Date.now();
  let lastError = '';

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const enhancedServices = (window as any).__ENHANCED_SERVICES__;
      if (enhancedServices?.initialized) {
        logger.info('Enhanced Services detected and ready', {}, 'INTEGRATION_BRIDGE');
        return;
      }
    } catch (error: any) {
      lastError = error.message;
    }
    await new Promise(resolve => setTimeout(resolve, 200)); // Check every 200ms
  }

  logger.warn('Enhanced Services timeout - continuing without full integration', {
    timeout: maxWaitTime,
    lastError
  }, 'INTEGRATION_BRIDGE');
  
  // Don't throw error - allow graceful degradation
  return;
}
```

## TESTING VERIFICATION

After applying fixes, run these tests:

1. **RLS Policy Test**:
```bash
# Test with authenticated user token
curl -H "Authorization: Bearer [USER_JWT_TOKEN]" \
     -H "apikey: [ANON_KEY]" \
     "https://urrydhjchgxnhyggqtzr.supabase.co/rest/v1/users?select=id,name&limit=1"
```

2. **Service Worker Test**:
```javascript
// In browser console
fetch('/api/test-auth-error').then(r => {
  console.log('Status:', r.status); // Should be 401, not 503
});
```

3. **Enhanced Services Test**:
```javascript
// In browser console  
console.log('Enhanced Services:', window.__ENHANCED_SERVICES__);
console.log('PWA Bridge:', window.__PWA_ENHANCED_BRIDGE__);
```

## PRIORITY ORDER

1. **IMMEDIATE** (5 minutes): Update RLS policies in Supabase
2. **CRITICAL** (15 minutes): Fix Service Worker error handling
3. **HIGH** (30 minutes): Implement resilient database client
4. **MEDIUM** (15 minutes): Update Enhanced Services bridge timeout

**TOTAL ESTIMATED FIX TIME: 65 minutes**

## SUCCESS CRITERIA

- ✅ Database queries return data instead of "permission denied"
- ✅ Error messages show specific issues instead of generic "503 Service Unavailable"
- ✅ Enhanced Services bridge initializes successfully
- ✅ PWA components load without timeout errors
- ✅ Application loads property data correctly