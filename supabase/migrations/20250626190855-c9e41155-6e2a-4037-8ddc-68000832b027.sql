
-- Step 1: Clean up all existing RLS policies that may be causing conflicts
-- Drop all existing policies on inspections table
DROP POLICY IF EXISTS "Allow public read access to inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can view inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can view relevant inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can create inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their inspections" ON public.inspections;

-- Drop all existing policies on checklist_items table
DROP POLICY IF EXISTS "Allow public read access to checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow authenticated users to update checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can insert checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can update checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Users can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Users can update checklist items" ON public.checklist_items;

-- Drop all existing policies on media table
DROP POLICY IF EXISTS "Allow public read access to media" ON public.media;
DROP POLICY IF EXISTS "Allow authenticated users to insert media" ON public.media;
DROP POLICY IF EXISTS "Allow authenticated users to update media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can view media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can update media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON public.media;
DROP POLICY IF EXISTS "Users can view media" ON public.media;
DROP POLICY IF EXISTS "Users can create media" ON public.media;

-- Step 2: Create simple, non-recursive policies for inspections
CREATE POLICY "Authenticated users can access all inspections" 
ON public.inspections FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 3: Create simple, non-recursive policies for checklist_items
CREATE POLICY "Authenticated users can access all checklist items" 
ON public.checklist_items FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 4: Create simple, non-recursive policies for media
CREATE POLICY "Authenticated users can access all media" 
ON public.media FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 5: Ensure properties table has simple policies
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to insert properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to update properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to delete properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON public.properties;

CREATE POLICY "Authenticated users can access all properties" 
ON public.properties FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 6: Fix the inspector_assignments infinite recursion issue
DROP POLICY IF EXISTS "Users can view inspector assignments" ON public.inspector_assignments;
DROP POLICY IF EXISTS "Users can create inspector assignments" ON public.inspector_assignments;
DROP POLICY IF EXISTS "Users can update inspector assignments" ON public.inspector_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON public.inspector_assignments;
DROP POLICY IF EXISTS "Users can create assignments for themselves" ON public.inspector_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON public.inspector_assignments;

CREATE POLICY "Authenticated users can manage inspector assignments" 
ON public.inspector_assignments FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 7: Fix the inspector_presence table policies
DROP POLICY IF EXISTS "Users can view presence for inspections they have access to" ON public.inspector_presence;
DROP POLICY IF EXISTS "Users can manage their own presence" ON public.inspector_presence;

CREATE POLICY "Authenticated users can manage inspector presence" 
ON public.inspector_presence FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 8: Add a debug function to test data access
CREATE OR REPLACE FUNCTION public.debug_data_access()
RETURNS TABLE(
  table_name TEXT,
  row_count BIGINT,
  can_select BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Test properties access
  BEGIN
    SELECT COUNT(*) INTO row_count FROM public.properties;
    RETURN QUERY SELECT 'properties'::TEXT, row_count, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'properties'::TEXT, 0::BIGINT, false;
  END;
  
  -- Test inspections access
  BEGIN
    SELECT COUNT(*) INTO row_count FROM public.inspections;
    RETURN QUERY SELECT 'inspections'::TEXT, row_count, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'inspections'::TEXT, 0::BIGINT, false;
  END;
  
  -- Test checklist_items access
  BEGIN
    SELECT COUNT(*) INTO row_count FROM public.checklist_items;
    RETURN QUERY SELECT 'checklist_items'::TEXT, row_count, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'checklist_items'::TEXT, 0::BIGINT, false;
  END;
  
  -- Test media access
  BEGIN
    SELECT COUNT(*) INTO row_count FROM public.media;
    RETURN QUERY SELECT 'media'::TEXT, row_count, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'media'::TEXT, 0::BIGINT, false;
  END;
END;
$$;
