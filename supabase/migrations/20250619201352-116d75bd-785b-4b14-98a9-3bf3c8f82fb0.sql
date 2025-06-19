
-- Remove the blocking trigger and function
DROP TRIGGER IF EXISTS on_property_insert_trigger ON public.properties;
DROP FUNCTION IF EXISTS public.notify_property_insert();

-- Create a simple table to track webhook notifications if needed for debugging
CREATE TABLE IF NOT EXISTS public.webhook_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for webhook notifications
ALTER TABLE public.webhook_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert webhook notifications" 
  ON public.webhook_notifications 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can view webhook notifications" 
  ON public.webhook_notifications 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can update webhook notifications" 
  ON public.webhook_notifications 
  FOR UPDATE 
  USING (true);
