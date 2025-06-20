
-- Step 1: Drop all triggers that depend on the old function first
DROP TRIGGER IF EXISTS property_created ON public.properties;
DROP TRIGGER IF EXISTS new_property_webhook_trigger ON public.properties;
DROP TRIGGER IF EXISTS new_property_trigger ON public.properties;

-- Step 2: Now we can safely drop the old function
DROP FUNCTION IF EXISTS public.new_property() CASCADE;

-- Step 3: Ensure we have the correct working webhook function
DROP FUNCTION IF EXISTS public.notify_property_insert() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_property_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_response record;
  error_message text;
BEGIN
  -- Always allow the property insert to succeed, even if webhook fails
  
  BEGIN
    -- Try to make the webhook call using the correct net.http_post function
    SELECT INTO webhook_response
      net.http_post(
        url := 'https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'event', 'property_inserted',
          'timestamp', now(),
          'source', 'doublecheck_app',
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

    -- Log successful webhook (optional)
    INSERT INTO webhook_notifications (property_id, webhook_url, status, response)
    VALUES (
      NEW.id,
      'https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator',
      'success',
      webhook_response::text
    );

  EXCEPTION WHEN OTHERS THEN
    -- If webhook fails, log the error but don't fail the property insert
    GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
    
    INSERT INTO webhook_notifications (property_id, webhook_url, status, response)
    VALUES (
      NEW.id,
      'https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator',
      'failed',
      error_message
    );

    -- Log a warning but don't stop the property insertion
    RAISE WARNING 'Webhook failed for property %: %', NEW.id, error_message;
  END;
  
  -- Always return NEW to allow the property insert to succeed
  RETURN NEW;
END;
$$;

-- Step 4: Create the single correct trigger
CREATE TRIGGER on_property_insert_trigger
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_property_insert();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, service_role;
