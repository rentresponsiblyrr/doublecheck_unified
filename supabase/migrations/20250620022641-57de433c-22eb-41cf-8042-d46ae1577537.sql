
-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON public.inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_completed ON public.inspections(completed);
CREATE INDEX IF NOT EXISTS idx_inspections_property_completed ON public.inspections(property_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Create optimized function for faster property and inspection loading
CREATE OR REPLACE FUNCTION public.get_properties_with_inspections(_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  property_id uuid,
  property_name text,
  property_address text,
  property_vrbo_url text,
  property_airbnb_url text,
  property_status text,
  property_created_at timestamp without time zone,
  inspection_count bigint,
  completed_inspection_count bigint,
  active_inspection_count bigint,
  latest_inspection_id uuid,
  latest_inspection_completed boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET statement_timeout TO '5s'
AS $function$
  SELECT 
    p.id as property_id,
    p.name as property_name,
    p.address as property_address,
    p.vrbo_url as property_vrbo_url,
    p.airbnb_url as property_airbnb_url,
    p.status as property_status,
    p.created_at as property_created_at,
    COALESCE(inspection_stats.total_count, 0) as inspection_count,
    COALESCE(inspection_stats.completed_count, 0) as completed_inspection_count,
    COALESCE(inspection_stats.active_count, 0) as active_inspection_count,
    inspection_stats.latest_id as latest_inspection_id,
    inspection_stats.latest_completed as latest_inspection_completed
  FROM public.properties p
  LEFT JOIN (
    SELECT 
      i.property_id,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE i.completed = true) as completed_count,
      COUNT(*) FILTER (WHERE i.completed = false) as active_count,
      (array_agg(i.id ORDER BY i.start_time DESC NULLS LAST))[1] as latest_id,
      (array_agg(i.completed ORDER BY i.start_time DESC NULLS LAST))[1] as latest_completed
    FROM public.inspections i
    GROUP BY i.property_id
  ) inspection_stats ON p.id = inspection_stats.property_id
  WHERE p.status = 'active'
  ORDER BY p.created_at DESC;
$function$;

-- Create function for faster property status calculation
CREATE OR REPLACE FUNCTION public.get_property_status(
  _completed_count bigint,
  _active_count bigint
)
RETURNS TABLE (
  status text,
  color text,
  text_label text
)
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT 
    CASE 
      WHEN _active_count > 0 THEN 'in-progress'
      WHEN _completed_count > 0 THEN 'completed'
      ELSE 'pending'
    END as status,
    CASE 
      WHEN _active_count > 0 THEN 'bg-yellow-500'
      WHEN _completed_count > 0 THEN 'bg-green-500'
      ELSE 'bg-gray-500'
    END as color,
    CASE 
      WHEN _active_count > 0 THEN 'In Progress'
      WHEN _completed_count > 0 THEN 'Completed'
      ELSE 'Not Started'
    END as text_label;
$function$;
