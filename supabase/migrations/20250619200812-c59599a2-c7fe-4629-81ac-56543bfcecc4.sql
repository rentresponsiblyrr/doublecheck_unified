
-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to notify property insert via webhook
CREATE OR REPLACE FUNCTION public.notify_property_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Make HTTP POST request to webhook with property data
  PERFORM net.http_post(
    url := 'https://hook.eu2.make.com/3h8a4vv5fzf3tcxpho1ypxfvp10cdkzp',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'event', 'property_inserted',
      'timestamp', now(),
      'property', jsonb_build_object(
        'id', NEW.id,
        'name', NEW.name,
        'address', NEW.address,
        'vrbo_url', NEW.vrbo_url,
        'airbnb_url', NEW.airbnb_url,
        'status', NEW.status,
        'created_at', NEW.created_at,
        'added_by', NEW.added_by
      )
    )
  );
  
  -- Log the webhook attempt
  INSERT INTO checklist_audit_log (
    action_type,
    field_name,
    new_value,
    created_at
  ) VALUES (
    'webhook_triggered',
    'property_insert',
    jsonb_build_object(
      'property_id', NEW.id,
      'property_name', NEW.name,
      'webhook_url', 'https://hook.eu2.make.com/3h8a4vv5fzf3tcxpho1ypxfvp10cdkzp'
    )::text,
    now()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after property insert
CREATE OR REPLACE TRIGGER on_property_insert_trigger
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_property_insert();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, service_role;
