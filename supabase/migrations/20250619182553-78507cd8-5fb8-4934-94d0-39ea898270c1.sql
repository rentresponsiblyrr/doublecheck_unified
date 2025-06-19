
-- Add airbnb_url column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS airbnb_url text;

-- Update inspections table to ensure status column exists with proper default
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';

-- Update any existing inspections that might not have a status
UPDATE public.inspections 
SET status = 'available' 
WHERE status IS NULL;
