
-- Fix the get_user_roles function with correct syntax
DROP FUNCTION IF EXISTS public.get_user_roles(uuid);

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET statement_timeout = '2s'
AS $$
  SELECT COALESCE(ur.role, 'inspector'::app_role)
  FROM (SELECT _user_id as user_id) u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
  LIMIT 1;
$$;

-- Ensure inspection-media storage bucket exists with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-media',
  'inspection-media', 
  true,
  104857600, -- 100MB limit (increased for production)
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/mov', 'video/avi'
  ]
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Add comprehensive RLS policies for all tables
-- Properties table policies
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

-- Inspections table policies
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

-- Checklist items table policies
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

-- Media table policies
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

-- Storage bucket policies
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
WITH CHECK (bucket_id = 'inspection-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update inspection media" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'inspection-media' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'inspection-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete inspection media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'inspection-media' AND auth.uid() IS NOT NULL);

-- Ensure triggers are properly set up
DROP TRIGGER IF EXISTS after_inspection_insert ON public.inspections;

CREATE TRIGGER after_inspection_insert
  AFTER INSERT ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_inspection_checklist();

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_items_inspection_id ON public.checklist_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_status ON public.checklist_items(status);
CREATE INDEX IF NOT EXISTS idx_media_checklist_item_id ON public.media(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON public.inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections(status);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Ensure all users have roles assigned
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 
       CASE 
         WHEN au.email LIKE '%@rentresponsibly.org' THEN 'admin'::app_role
         ELSE 'inspector'::app_role
       END
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id
)
ON CONFLICT (user_id, role) DO NOTHING;
