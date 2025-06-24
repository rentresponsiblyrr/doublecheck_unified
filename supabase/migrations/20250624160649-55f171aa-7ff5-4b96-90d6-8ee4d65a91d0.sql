
-- Phase 1: Database Foundation & Audit Trail

-- Create enum for inspector assignment status
CREATE TYPE public.inspector_assignment_status AS ENUM ('assigned', 'active', 'completed', 'reassigned');

-- Create enum for conflict resolution status
CREATE TYPE public.conflict_resolution_status AS ENUM ('pending', 'resolved', 'escalated');

-- Create inspector assignments table
CREATE TABLE public.inspector_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  status inspector_assignment_status NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(inspection_id, inspector_id, status) -- Prevent duplicate active assignments
);

-- Create inspector presence table for real-time tracking
CREATE TABLE public.inspector_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'online', -- online, offline, viewing, working
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_item_id UUID REFERENCES public.checklist_items(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(inspection_id, inspector_id)
);

-- Create collaboration conflicts table
CREATE TABLE public.collaboration_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL, -- concurrent_edit, status_change, evidence_upload
  inspector_1 UUID NOT NULL REFERENCES auth.users(id),
  inspector_2 UUID NOT NULL REFERENCES auth.users(id),
  inspector_1_action JSONB NOT NULL,
  inspector_2_action JSONB NOT NULL,
  resolution_status conflict_resolution_status NOT NULL DEFAULT 'pending',
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create enhanced audit trail for checklist item changes
CREATE TABLE public.checklist_item_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES auth.users(id),
  change_type TEXT NOT NULL, -- status_change, notes_added, evidence_uploaded, evidence_deleted
  old_values JSONB,
  new_values JSONB,
  change_reason TEXT,
  conflict_id UUID REFERENCES public.collaboration_conflicts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add inspector tracking columns to existing tables
ALTER TABLE public.checklist_items 
ADD COLUMN assigned_inspector_id UUID REFERENCES auth.users(id),
ADD COLUMN last_modified_by UUID REFERENCES auth.users(id),
ADD COLUMN last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN version INTEGER DEFAULT 1;

ALTER TABLE public.media
ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);

-- Create indexes for performance
CREATE INDEX idx_inspector_assignments_inspection ON public.inspector_assignments(inspection_id);
CREATE INDEX idx_inspector_assignments_inspector ON public.inspector_assignments(inspector_id);
CREATE INDEX idx_inspector_presence_inspection ON public.inspector_presence(inspection_id);
CREATE INDEX idx_inspector_presence_inspector ON public.inspector_presence(inspector_id);
CREATE INDEX idx_collaboration_conflicts_inspection ON public.collaboration_conflicts(inspection_id);
CREATE INDEX idx_checklist_item_change_log_item ON public.checklist_item_change_log(checklist_item_id);
CREATE INDEX idx_checklist_items_assigned_inspector ON public.checklist_items(assigned_inspector_id);

-- Enable RLS on new tables
ALTER TABLE public.inspector_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspector_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item_change_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inspector assignments
CREATE POLICY "Users can view assignments for inspections they're involved in" 
ON public.inspector_assignments FOR SELECT 
USING (
  inspector_id = auth.uid() OR 
  assigned_by = auth.uid() OR
  inspection_id IN (
    SELECT inspection_id FROM public.inspector_assignments 
    WHERE inspector_id = auth.uid()
  )
);

CREATE POLICY "Users can create inspector assignments if they're admin or assigned inspector" 
ON public.inspector_assignments FOR INSERT 
WITH CHECK (
  assigned_by = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- Create RLS policies for inspector presence
CREATE POLICY "Users can view presence for inspections they're assigned to" 
ON public.inspector_presence FOR SELECT 
USING (
  inspector_id = auth.uid() OR
  inspection_id IN (
    SELECT inspection_id FROM public.inspector_assignments 
    WHERE inspector_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own presence" 
ON public.inspector_presence FOR ALL 
USING (inspector_id = auth.uid())
WITH CHECK (inspector_id = auth.uid());

-- Create RLS policies for collaboration conflicts
CREATE POLICY "Users can view conflicts they're involved in" 
ON public.collaboration_conflicts FOR SELECT 
USING (
  inspector_1 = auth.uid() OR 
  inspector_2 = auth.uid() OR 
  resolved_by = auth.uid() OR
  public.has_role(auth.uid(), 'admin')
);

-- Create RLS policies for change log
CREATE POLICY "Users can view change logs for items they have access to" 
ON public.checklist_item_change_log FOR SELECT 
USING (
  inspector_id = auth.uid() OR
  checklist_item_id IN (
    SELECT ci.id FROM public.checklist_items ci
    JOIN public.inspector_assignments ia ON ci.inspection_id = ia.inspection_id
    WHERE ia.inspector_id = auth.uid()
  )
);

-- Create function to track checklist item changes
CREATE OR REPLACE FUNCTION public.track_checklist_item_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  change_type TEXT;
  old_vals JSONB := '{}';
  new_vals JSONB := '{}';
BEGIN
  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_type := 'item_created';
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      change_type := 'status_change';
      old_vals := jsonb_build_object('status', OLD.status);
      new_vals := jsonb_build_object('status', NEW.status);
    ELSIF OLD.notes IS DISTINCT FROM NEW.notes THEN
      change_type := 'notes_updated';
      old_vals := jsonb_build_object('notes', OLD.notes);
      new_vals := jsonb_build_object('notes', NEW.notes);
    ELSE
      change_type := 'item_updated';
      old_vals := to_jsonb(OLD);
      new_vals := to_jsonb(NEW);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    change_type := 'item_deleted';
    old_vals := to_jsonb(OLD);
  END IF;

  -- Insert change log entry
  INSERT INTO public.checklist_item_change_log (
    checklist_item_id,
    inspector_id,
    change_type,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.last_modified_by, OLD.last_modified_by, auth.uid()),
    change_type,
    old_vals,
    new_vals
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for checklist item changes
CREATE TRIGGER trigger_track_checklist_item_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.track_checklist_item_changes();

-- Create function to update inspector presence
CREATE OR REPLACE FUNCTION public.update_inspector_presence(
  p_inspection_id UUID,
  p_status TEXT DEFAULT 'online',
  p_current_item_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS public.inspector_presence
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  presence_record public.inspector_presence;
BEGIN
  INSERT INTO public.inspector_presence (
    inspection_id,
    inspector_id,
    status,
    current_item_id,
    metadata,
    last_seen
  ) VALUES (
    p_inspection_id,
    auth.uid(),
    p_status,
    p_current_item_id,
    p_metadata,
    NOW()
  )
  ON CONFLICT (inspection_id, inspector_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    current_item_id = EXCLUDED.current_item_id,
    metadata = EXCLUDED.metadata,
    last_seen = EXCLUDED.last_seen
  RETURNING * INTO presence_record;
  
  RETURN presence_record;
END;
$$;

-- Create function to assign inspector to checklist item
CREATE OR REPLACE FUNCTION public.assign_checklist_item(
  p_item_id UUID,
  p_inspector_id UUID DEFAULT NULL
)
RETURNS public.checklist_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_record public.checklist_items;
  conflict_exists BOOLEAN := FALSE;
BEGIN
  -- Use current user if no inspector specified
  IF p_inspector_id IS NULL THEN
    p_inspector_id := auth.uid();
  END IF;

  -- Check for existing assignment conflict
  SELECT EXISTS(
    SELECT 1 FROM public.checklist_items 
    WHERE id = p_item_id 
    AND assigned_inspector_id IS NOT NULL 
    AND assigned_inspector_id != p_inspector_id
  ) INTO conflict_exists;

  -- If conflict exists, create conflict record
  IF conflict_exists THEN
    INSERT INTO public.collaboration_conflicts (
      inspection_id,
      checklist_item_id,
      conflict_type,
      inspector_1,
      inspector_2,
      inspector_1_action,
      inspector_2_action
    )
    SELECT 
      ci.inspection_id,
      p_item_id,
      'concurrent_assignment',
      ci.assigned_inspector_id,
      p_inspector_id,
      jsonb_build_object('action', 'assign', 'timestamp', ci.last_modified_at),
      jsonb_build_object('action', 'assign', 'timestamp', NOW())
    FROM public.checklist_items ci
    WHERE ci.id = p_item_id;
  END IF;

  -- Update the assignment
  UPDATE public.checklist_items 
  SET 
    assigned_inspector_id = p_inspector_id,
    last_modified_by = auth.uid(),
    last_modified_at = NOW(),
    version = version + 1
  WHERE id = p_item_id
  RETURNING * INTO item_record;

  RETURN item_record;
END;
$$;

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspector_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inspector_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_conflicts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_item_change_log;

-- Set replica identity for realtime
ALTER TABLE public.inspector_assignments REPLICA IDENTITY FULL;
ALTER TABLE public.inspector_presence REPLICA IDENTITY FULL;
ALTER TABLE public.collaboration_conflicts REPLICA IDENTITY FULL;
ALTER TABLE public.checklist_item_change_log REPLICA IDENTITY FULL;
