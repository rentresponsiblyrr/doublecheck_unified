
-- Create the categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color_class TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-800 border-gray-200',
  icon_name TEXT DEFAULT 'Check',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories to maintain backward compatibility
INSERT INTO public.categories (name, description, color_class, icon_name, sort_order) VALUES
('safety', 'Safety-related inspection items', 'bg-red-100 text-red-800 border-red-200', 'AlertTriangle', 1),
('amenity', 'Amenity verification items', 'bg-blue-100 text-blue-800 border-blue-200', 'Camera', 2),
('cleanliness', 'Cleanliness assessment items', 'bg-green-100 text-green-800 border-green-200', 'Sparkles', 3),
('maintenance', 'Maintenance-related items', 'bg-yellow-100 text-yellow-800 border-yellow-200', 'Wrench', 4);

-- Add foreign key constraint to checklist_items
ALTER TABLE public.checklist_items 
ADD CONSTRAINT fk_checklist_items_category 
FOREIGN KEY (category) REFERENCES public.categories(name)
ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add foreign key constraint to static_safety_items
ALTER TABLE public.static_safety_items 
ADD CONSTRAINT fk_static_safety_items_category 
FOREIGN KEY (category) REFERENCES public.categories(name)
ON UPDATE CASCADE ON DELETE RESTRICT;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at_trigger
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_categories_updated_at();

-- Enable RLS for categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories (readable by all authenticated users, modifiable by admins)
CREATE POLICY "Categories are viewable by authenticated users" 
  ON public.categories 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Categories are editable by admins" 
  ON public.categories 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
