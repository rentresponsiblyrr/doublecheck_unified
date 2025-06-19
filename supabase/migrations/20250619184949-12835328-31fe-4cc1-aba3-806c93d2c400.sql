
-- Create the inspection-media storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-media',
  'inspection-media', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policy for public access to uploaded files
CREATE POLICY "Public read access for inspection media" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'inspection-media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload inspection media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'inspection-media');

-- Allow authenticated users to update files (for replacing evidence)
CREATE POLICY "Authenticated users can update inspection media" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'inspection-media');

-- Allow authenticated users to delete files if needed
CREATE POLICY "Authenticated users can delete inspection media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'inspection-media');
