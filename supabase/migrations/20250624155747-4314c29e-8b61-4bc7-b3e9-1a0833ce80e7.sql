
-- Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'inspector', 'reviewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure the user_roles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles if not already enabled
DO $$ BEGIN
    ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Improve the assign_user_role function with better error handling
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if email ends with @rentresponsibly.org for admin role
  IF _email LIKE '%@rentresponsibly.org' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- All other users get inspector role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'inspector'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to assign role to user %: %', _user_id, SQLERRM;
END;
$$;

-- Improve the handle_new_user function with transaction safety
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
      NEW.email
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      updated_at = now();
    
    -- Assign role based on email domain
    PERFORM public.assign_user_role(NEW.id, NEW.email);
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
      -- Still return NEW to allow auth user creation to succeed
  END;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all existing users have roles assigned
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id, 
  CASE 
    WHEN au.email LIKE '%@rentresponsibly.org' THEN 'admin'::app_role
    ELSE 'inspector'::app_role
  END
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id
)
ON CONFLICT (user_id, role) DO NOTHING;
