
-- Fix the get_user_roles function with better performance and error handling
DROP FUNCTION IF EXISTS public.get_user_roles(uuid);

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET statement_timeout = '5s'
AS $$
  SELECT COALESCE(ur.role, 'inspector'::app_role)
  FROM (SELECT _user_id as user_id) u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.user_id
  LIMIT 1;
$$;

-- Ensure all authenticated users have a role assigned
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

-- Add performance indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_performance ON public.user_roles(user_id);

-- Create a simple backup function for role fetching
CREATE OR REPLACE FUNCTION public.get_user_role_simple(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET statement_timeout = '3s'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    'inspector'::app_role
  );
$$;
