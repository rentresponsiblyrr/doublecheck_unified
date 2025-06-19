
-- Enable Row Level Security on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_safety_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for properties table
-- Since this is an inspector app, inspectors should see all properties available for inspection
CREATE POLICY "Allow public read access to properties" 
ON public.properties FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert properties" 
ON public.properties FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update properties" 
ON public.properties FOR UPDATE 
TO authenticated 
USING (true);

-- Create RLS policies for inspections table
-- Inspectors should see all inspections
CREATE POLICY "Allow public read access to inspections" 
ON public.inspections FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert inspections" 
ON public.inspections FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update inspections" 
ON public.inspections FOR UPDATE 
TO authenticated 
USING (true);

-- Create RLS policies for checklist_items table
-- Inspectors should see all checklist items
CREATE POLICY "Allow public read access to checklist_items" 
ON public.checklist_items FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert checklist_items" 
ON public.checklist_items FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update checklist_items" 
ON public.checklist_items FOR UPDATE 
TO authenticated 
USING (true);

-- Create RLS policies for media table
-- Inspectors should see all media evidence
CREATE POLICY "Allow public read access to media" 
ON public.media FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert media" 
ON public.media FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update media" 
ON public.media FOR UPDATE 
TO authenticated 
USING (true);

-- Create RLS policies for static_safety_items table
-- These are template items that should be readable by all
CREATE POLICY "Allow public read access to static_safety_items" 
ON public.static_safety_items FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to manage static_safety_items" 
ON public.static_safety_items FOR ALL 
TO authenticated 
USING (true);
