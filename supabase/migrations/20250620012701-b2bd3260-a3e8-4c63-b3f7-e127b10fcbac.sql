
-- First, let's update existing properties with null added_by values
-- We'll set them to the first admin user, or create a system user if none exists
UPDATE public.properties 
SET added_by = (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'::app_role 
  LIMIT 1
)
WHERE added_by IS NULL;

-- If no admin exists, we'll need to handle this differently
-- Let's check if there are any users at all and assign to the first authenticated user
UPDATE public.properties 
SET added_by = (
  SELECT id 
  FROM auth.users 
  LIMIT 1
)
WHERE added_by IS NULL;

-- Now we can safely make added_by NOT NULL
ALTER TABLE public.properties ALTER COLUMN added_by SET NOT NULL;

-- Create proper RLS policies for the properties table
-- First, let's drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to insert properties" ON public.properties;
DROP POLICY IF EXISTS "Allow authenticated users to update properties" ON public.properties;

-- Create specific RLS policies for the properties table
-- Allow all authenticated users to read properties (inspectors need to see all properties)
CREATE POLICY "Authenticated users can view all properties" 
ON public.properties FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert properties
CREATE POLICY "Authenticated users can insert properties" 
ON public.properties FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update properties they added or allow admins to update any property
CREATE POLICY "Users can update their own properties or admins can update any" 
ON public.properties FOR UPDATE 
TO authenticated 
USING (
  added_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Allow users to delete properties they added or allow admins to delete any property
CREATE POLICY "Users can delete their own properties or admins can delete any" 
ON public.properties FOR DELETE 
TO authenticated 
USING (
  added_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Add a default value for status if it doesn't exist
ALTER TABLE public.properties ALTER COLUMN status SET DEFAULT 'active';

-- Add updated_at column if it doesn't exist (for tracking changes)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'updated_at') THEN
        ALTER TABLE public.properties ADD COLUMN updated_at timestamp without time zone DEFAULT now();
    END IF;
END $$;

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
