
-- Create the missing RLS policies, handling existing ones properly

-- Drop and recreate inspection policies
DROP POLICY IF EXISTS "Users can view relevant inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can create inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their inspections" ON public.inspections;

-- Recreate inspection policies with proper logic
CREATE POLICY "Users can view relevant inspections" ON public.inspections
FOR SELECT USING (
  -- Property owners can see inspections of their properties
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = inspections.property_id AND p.added_by = auth.uid()) OR
  -- Assigned inspectors can see their inspections
  inspector_id = auth.uid() OR
  -- Unassigned inspections can be seen by authenticated users (for assignment)
  inspector_id IS NULL
);

CREATE POLICY "Users can create inspections" ON public.inspections
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = inspections.property_id AND p.added_by = auth.uid()) OR
  inspector_id = auth.uid()
);

CREATE POLICY "Users can update their inspections" ON public.inspections
FOR UPDATE USING (
  inspector_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.properties p WHERE p.id = inspections.property_id AND p.added_by = auth.uid())
);

-- Drop and recreate checklist policies (since they already exist)
DROP POLICY IF EXISTS "Users can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Users can update checklist items" ON public.checklist_items;

CREATE POLICY "Users can view checklist items" ON public.checklist_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.inspections i 
    WHERE i.id = checklist_items.inspection_id 
    AND (
      i.inspector_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.properties p WHERE p.id = i.property_id AND p.added_by = auth.uid())
    )
  )
);

CREATE POLICY "Users can update checklist items" ON public.checklist_items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.inspections i 
    WHERE i.id = checklist_items.inspection_id 
    AND i.inspector_id = auth.uid()
  )
);

-- Drop and recreate media policies
DROP POLICY IF EXISTS "Users can view media" ON public.media;
DROP POLICY IF EXISTS "Users can create media" ON public.media;

CREATE POLICY "Users can view media" ON public.media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.checklist_items ci
    JOIN public.inspections i ON i.id = ci.inspection_id
    WHERE ci.id = media.checklist_item_id
    AND (
      i.inspector_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.properties p WHERE p.id = i.property_id AND p.added_by = auth.uid())
    )
  )
);

CREATE POLICY "Users can create media" ON public.media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.checklist_items ci
    JOIN public.inspections i ON i.id = ci.inspection_id
    WHERE ci.id = media.checklist_item_id
    AND i.inspector_id = auth.uid()
  )
);

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-media', 'inspection-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop and recreate storage policies
DROP POLICY IF EXISTS "Users can view inspection media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload inspection media" ON storage.objects;

CREATE POLICY "Users can view inspection media" ON storage.objects
FOR SELECT USING (bucket_id = 'inspection-media');

CREATE POLICY "Users can upload inspection media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'inspection-media' AND
  auth.uid() IS NOT NULL
);

-- Helper functions for mobile inspection flow
CREATE OR REPLACE FUNCTION public.assign_inspector_to_inspection(
  p_inspection_id UUID,
  p_inspector_id UUID DEFAULT NULL
)
RETURNS public.inspections
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inspection_record public.inspections;
BEGIN
  -- Use current user if no inspector specified
  IF p_inspector_id IS NULL THEN
    p_inspector_id := auth.uid();
  END IF;
  
  -- Update the inspection with the inspector assignment
  UPDATE public.inspections 
  SET 
    inspector_id = p_inspector_id,
    status = 'in_progress'
  WHERE id = p_inspection_id
  AND (inspector_id IS NULL OR inspector_id = p_inspector_id)
  RETURNING * INTO inspection_record;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspection not found or already assigned to another inspector';
  END IF;
  
  RETURN inspection_record;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_inspection(
  p_inspection_id UUID
)
RETURNS public.inspections
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inspection_record public.inspections;
BEGIN
  -- Update the inspection to completed
  UPDATE public.inspections 
  SET 
    completed = true,
    end_time = NOW(),
    status = 'completed'
  WHERE id = p_inspection_id
  AND inspector_id = auth.uid()
  RETURNING * INTO inspection_record;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspection not found or you are not assigned to this inspection';
  END IF;
  
  RETURN inspection_record;
END;
$$;
