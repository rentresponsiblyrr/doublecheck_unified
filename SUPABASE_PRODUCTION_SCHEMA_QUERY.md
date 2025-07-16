# 🔍 Supabase AI Production Database Schema Query

## **PROMPT FOR SUPABASE AI:**

```
I need to verify the exact production database schema for the DoubleCheck STR Certified inspection application. The application is experiencing blank screens in the admin portal, likely due to database table/column mismatches between the code expectations and actual production schema.

Please provide the following information about our PRODUCTION database:

## 1. COMPLETE TABLE LIST
List ALL tables currently in the database with their exact names.

## 2. CRITICAL TABLE SCHEMAS
For these specific tables (if they exist), provide the complete column structure:

### User/Profile Tables:
- `users` table (complete schema)
- `profiles` table (complete schema) 
- Any other user-related tables

### Property Tables:
- `properties` table (complete schema)
- Any property-related tables

### Inspection Tables:
- `inspections` table (complete schema)
- `inspection_sessions` table (complete schema)
- Any inspection-related tables

### Checklist/Safety Tables:
- `static_safety_items` table (complete schema)
- `checklist` table (complete schema)
- `checklist_items` table (complete schema)
- `inspection_checklist_items` table (complete schema)
- `logs` table (complete schema)
- Any checklist/safety-related tables

### Media Tables:
- `media` table (complete schema)
- `media_files` table (complete schema)
- `inspection_media` table (complete schema)
- Any media-related tables

## 3. TABLE RELATIONSHIPS
For each table above, show:
- Primary keys
- Foreign key relationships
- Indexes
- Constraints

## 4. VIEWS AND FUNCTIONS
List any:
- Database views (especially compatibility views)
- Custom functions
- RPC functions available

## 5. AUTHENTICATION SCHEMA
Show the structure of:
- `auth.users` table
- Any custom user authentication tables
- How user data is stored and referenced

## 6. SPECIFIC QUERIES TO TEST
Please run these queries and show results:

```sql
-- Check if these tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'profiles', 'properties', 'inspections', 'inspection_sessions',
    'static_safety_items', 'checklist', 'checklist_items', 
    'inspection_checklist_items', 'logs', 'media', 'media_files', 
    'inspection_media'
);

-- Show actual column names for key tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'properties', 'inspections')
ORDER BY table_name, ordinal_position;

-- Check for any compatibility views
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public';

-- List all RPC functions
SELECT routines.routine_name, parameters.parameter_name, parameters.data_type
FROM information_schema.routines
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routines.routine_schema = 'public'
ORDER BY routines.routine_name, parameters.ordinal_position;
```

## 7. DATA SAMPLE
For verification, please show:
- Sample row from each critical table (with sensitive data redacted)
- Row counts for each table
- Any data that shows the relationship structure

## WHY THIS IS CRITICAL:
Our admin portal components are failing because they're querying tables that may not exist or have different column names than expected. We need to know:

1. **Exact table names** (is it `users` or `profiles`?)
2. **Exact column names** (is it `id` or `user_id`?)
3. **Data types** (UUID vs integer for IDs?)
4. **Relationships** (how are tables connected?)

This information will allow us to fix the admin portal by updating our code to match the actual production schema.
```

## **INSTRUCTIONS FOR USE:**

1. **Copy the prompt above** and paste it into Supabase AI
2. **Wait for complete response** - don't accept partial answers
3. **Share the full response** with me
4. **I will then update** all admin components to match the actual schema

## **WHAT THIS WILL SOLVE:**

✅ **Blank Screen Issues** - We'll know which tables actually exist  
✅ **Database Errors** - We'll use correct table and column names  
✅ **Admin Portal Functionality** - Components will query the right data  
✅ **Future Development** - Consistent schema understanding  

## **EXPECTED OUTCOME:**

Once we have this schema information, I can:
1. **Update all admin components** to use correct table names
2. **Fix any type mismatches** (UUID vs integer)
3. **Create proper database queries** that work with production
4. **Eliminate blank screens** in the admin portal
5. **Document the correct schema** for future development

This single prompt will give us everything needed to fix the admin portal issues systematically.