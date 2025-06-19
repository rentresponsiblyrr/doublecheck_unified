
-- Create a function to assign roles based on email domain
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if email ends with @rentresponsibly.org for admin role
  IF _email LIKE '%@rentresponsibly.org' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin'::app_role);
  ELSE
    -- All other users get inspector role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'inspector'::app_role);
  END IF;
END;
$$;

-- Update the handle_new_user function to assign roles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Assign role based on email domain
  PERFORM public.assign_user_role(NEW.id, NEW.email);
  
  RETURN NEW;
END;
$$;

-- Create a function to get user roles for easy access
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;
