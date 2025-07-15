# 🚨 CRITICAL ENVIRONMENT CONFIGURATION FIX

## **Root Cause of Blank Admin Screens Identified and Resolved**

### **Problem:**
- Admin portal showing blank screens across all sections
- App was loading **InspectorRoutes** instead of **AdminRoutesComponent**
- Caused by missing `VITE_APP_TYPE=admin` environment variable

### **Root Cause Analysis:**
1. `getAppTypeFromDomain()` checks hostname first
2. For localhost, it falls back to `VITE_APP_TYPE` environment variable
3. Missing `VITE_APP_TYPE` defaults to **INSPECTOR** mode
4. This loads mobile-optimized routes instead of admin routes
5. Result: Admin components never render, causing blank screens

### **Solution Applied:**
Added to `.env.local`:
```bash
VITE_APP_TYPE=admin
```

### **Critical for Deployment:**
**🚨 This environment variable MUST be set in all deployment environments:**

#### **Railway Deployment:**
```bash
VITE_APP_TYPE=admin
```

#### **Local Development:**
```bash
# In .env.local
VITE_APP_TYPE=admin
```

#### **Staging Environment:**
```bash
# In .env.staging
VITE_APP_TYPE=admin
```

### **Verification Steps:**
1. Restart dev server after adding environment variable
2. Navigate to `http://localhost:8080/admin`
3. Check console for: `App Type: admin`
4. Verify admin components load (no blank screens)

### **Technical Details:**
- **File:** `src/lib/config/app-type.ts`
- **Function:** `getAppTypeFromDomain()`
- **Logic:** Domain-based routing with environment fallback
- **Default:** INSPECTOR (when VITE_APP_TYPE not set)

This fix resolves the systematic blank screen issues across the entire admin portal.