
-- Fix the get_properties_with_inspections function to properly filter by user
CREATE OR REPLACE FUNCTION public.get_properties_with_inspections(_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(property_id uuid, property_name text, property_address text, property_vrbo_url text, property_airbnb_url text, property_status text, property_created_at timestamp without time zone, inspection_count bigint, completed_inspection_count bigint, active_inspection_count bigint, latest_inspection_id uuid, latest_inspection_completed boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
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
    AND (_user_id IS NULL OR p.added_by = _user_id)
  ORDER BY p.created_at DESC;
$function$
