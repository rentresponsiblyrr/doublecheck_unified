
-- Phase 1: Fix Authentication & RLS Policies
-- Create comprehensive RLS policies for all tables

-- Fix properties table RLS policies
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to insert properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON public.properties;

CREATE POLICY "Authenticated users can view properties" 
ON public.properties FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert properties" 
ON public.properties FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update properties" 
ON public.properties FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete properties" 
ON public.properties FOR DELETE 
TO authenticated 
USING (true);

-- Fix inspections table RLS policies
DROP POLICY IF EXISTS "Allow public read access to inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Allow authenticated users to update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can view inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can insert inspections" ON public.inspections;
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON public.inspections;

CREATE POLICY "Authenticated users can view inspections" 
ON public.inspections FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert inspections" 
ON public.inspections FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update inspections" 
ON public.inspections FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix checklist_items table RLS policies
DROP POLICY IF EXISTS "Allow public read access to checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow authenticated users to update checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can insert checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Authenticated users can update checklist items" ON public.checklist_items;

CREATE POLICY "Authenticated users can view checklist items" 
ON public.checklist_items FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert checklist items" 
ON public.checklist_items FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update checklist items" 
ON public.checklist_items FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix media table RLS policies
DROP POLICY IF EXISTS "Allow public read access to media" ON public.media;
DROP POLICY IF EXISTS "Allow authenticated users to insert media" ON public.media;
DROP POLICY IF EXISTS "Allow authenticated users to update media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can view media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can update media" ON public.media;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON public.media;

CREATE POLICY "Authenticated users can view media" 
ON public.media FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert media" 
ON public.media FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update media" 
ON public.media FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete media" 
ON public.media FOR DELETE 
TO authenticated 
USING (true);

-- Phase 2: Database Infrastructure
-- Ensure inspection-media bucket exists with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-media',
  'inspection-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Fix storage policies
DROP POLICY IF EXISTS "Public read access for inspection media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inspection media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update inspection media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete inspection media" ON storage.objects;

CREATE POLICY "Public read access for inspection media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'inspection-media');

CREATE POLICY "Authenticated users can upload inspection media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'inspection-media');

CREATE POLICY "Authenticated users can update inspection media" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'inspection-media')
WITH CHECK (bucket_id = 'inspection-media');

CREATE POLICY "Authenticated users can delete inspection media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'inspection-media');

-- Fix user role function timeout issue by creating a simpler, more efficient version
DROP FUNCTION IF EXISTS public.get_user_roles(uuid);

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET statement_timeout = '5s'
AS $$
  SELECT COALESCE(role, 'inspector'::app_role)
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Ensure user has a role assigned
INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'inspector'::app_role
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
ON CONFLICT (user_id, role) DO NOTHING;
