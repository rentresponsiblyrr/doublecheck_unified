
-- Add DELETE policies for all tables to allow authenticated users to delete their data

-- Properties table - allow authenticated users to delete properties
CREATE POLICY "Allow authenticated users to delete properties" 
ON public.properties FOR DELETE 
TO authenticated 
USING (true);

-- Inspections table - allow authenticated users to delete inspections
CREATE POLICY "Allow authenticated users to delete inspections" 
ON public.inspections FOR DELETE 
TO authenticated 
USING (true);

-- Checklist items table - allow authenticated users to delete checklist items
CREATE POLICY "Allow authenticated users to delete checklist_items" 
ON public.checklist_items FOR DELETE 
TO authenticated 
USING (true);

-- Media table - allow authenticated users to delete media
CREATE POLICY "Allow authenticated users to delete media" 
ON public.media FOR DELETE 
TO authenticated 
USING (true);

-- Static safety items table - allow authenticated users to delete static safety items
CREATE POLICY "Allow authenticated users to delete static_safety_items" 
ON public.static_safety_items FOR DELETE 
TO authenticated 
USING (true);

-- Webhook notifications table - allow authenticated users to delete webhook notifications
CREATE POLICY "Allow authenticated users to delete webhook_notifications" 
ON public.webhook_notifications FOR DELETE 
TO authenticated 
USING (true);

-- Listing photos table - allow authenticated users to delete listing photos
CREATE POLICY "Allow authenticated users to delete listing_photos" 
ON public.listing_photos FOR DELETE 
TO authenticated 
USING (true);
