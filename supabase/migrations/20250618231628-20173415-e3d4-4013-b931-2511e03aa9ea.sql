
-- Create the correct storage bucket for inspection media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-media',
  'inspection-media', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public access on the correct bucket
DROP POLICY IF EXISTS "Public Access for inspection-media" ON storage.objects;
CREATE POLICY "Public Access for inspection-media" ON storage.objects 
FOR ALL USING (bucket_id = 'inspection-media');

-- Keep the old bucket and policy for now to avoid breaking existing data
-- The old "inspection-evidence" bucket will remain until data migration is complete
