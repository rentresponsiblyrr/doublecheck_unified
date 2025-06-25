
-- Fix the infinite recursion in inspector_assignments policy
-- The issue is likely in existing policies that reference each other recursively

-- First, let's drop any problematic policies on inspector_assignments if they exist
DROP POLICY IF EXISTS "Users can view inspector assignments" ON public.inspector_assignments;
DROP POLICY IF EXISTS "Users can create inspector assignments" ON public.inspector_assignments;
DROP POLICY IF EXISTS "Users can update inspector assignments" ON public.inspector_assignments;

-- Check if inspector_assignments table exists, if not create it
CREATE TABLE IF NOT EXISTS public.inspector_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id uuid REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(inspection_id, inspector_id)
);

-- Enable RLS
ALTER TABLE public.inspector_assignments ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own assignments" ON public.inspector_assignments
FOR SELECT USING (inspector_id = auth.uid());

CREATE POLICY "Users can create assignments for themselves" ON public.inspector_assignments
FOR INSERT WITH CHECK (inspector_id = auth.uid());

CREATE POLICY "Users can update their own assignments" ON public.inspector_assignments
FOR UPDATE USING (inspector_id = auth.uid());

-- Check if inspector_presence table exists, if not create it
CREATE TABLE IF NOT EXISTS public.inspector_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id uuid REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'online',
  current_item_id uuid REFERENCES public.checklist_items(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(inspection_id, inspector_id)
);

-- Enable RLS on inspector_presence
ALTER TABLE public.inspector_presence ENABLE ROW LEVEL SECURITY;

-- Create simple policies for inspector_presence
CREATE POLICY "Users can view presence for inspections they have access to" ON public.inspector_presence
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.inspections i 
    WHERE i.id = inspector_presence.inspection_id 
    AND (
      i.inspector_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.properties p WHERE p.id = i.property_id AND p.added_by = auth.uid())
    )
  )
);

CREATE POLICY "Users can manage their own presence" ON public.inspector_presence
FOR ALL USING (inspector_id = auth.uid());
