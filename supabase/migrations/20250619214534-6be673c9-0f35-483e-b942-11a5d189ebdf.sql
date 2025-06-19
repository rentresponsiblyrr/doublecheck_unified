
-- Drop any existing incorrect webhook function
DROP FUNCTION IF EXISTS public.notify_property_insert() CASCADE;

-- Create the correct webhook function using valid action types  
CREATE OR REPLACE FUNCTION public.notify_property_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_response record;
  error_message text;
BEGIN
  -- Log the webhook attempt start (using UPDATE which is a valid action type)
  INSERT INTO checklist_audit_log (
    action_type,
    field_name,
    new_value,
    created_at
  ) VALUES (
    'UPDATE',
    'webhook_start',
    jsonb_build_object(
      'property_id', NEW.id,
      'property_name', NEW.name,
      'webhook_url', 'https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator'
    )::text,
    now()
  );

  BEGIN
    -- Make HTTP POST request to the CORRECT n8n webhook
    SELECT INTO webhook_response
      net.http_post(
        url := 'https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator',
        headers := '{\"Content-Type\": \"application/json\"}'::jsonb,
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

    -- Log successful webhook
    INSERT INTO checklist_audit_log (
      action_type,
      field_name,
      new_value,
      created_at
    ) VALUES (
      'UPDATE',
      'webhook_success',
      jsonb_build_object(
        'property_id', NEW.id,
        'property_name', NEW.name,
        'webhook_url', 'https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator',
        'response', webhook_response
      )::text,
      now()
    );

  EXCEPTION WHEN OTHERS THEN
    -- Log webhook failure with error details
    GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
    
    INSERT INTO checklist_audit_log (
      action_type,
      field_name,
      new_value,
      created_at
    ) VALUES (
      'UPDATE',
      'webhook_error',
      jsonb_build_object(
        'property_id', NEW.id,
        'property_name', NEW.name,
        'webhook_url', 'https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator',
        'error', error_message,
        'sqlstate', SQLSTATE
      )::text,
      now()
    );

    -- Don't fail the insert even if webhook fails
    RAISE WARNING 'Webhook failed for property %: %', NEW.id, error_message;
  END;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_property_insert_trigger ON public.properties;

-- Create trigger that fires after property insert
CREATE TRIGGER on_property_insert_trigger
  AFTER INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_property_insert();

-- Grant necessary permissions for the webhook function
GRANT USAGE ON SCHEMA net TO postgres, service_role;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres, service_role;

-- Add a test entry to verify the webhook is working (using UPDATE action type)
INSERT INTO checklist_audit_log (
  action_type,
  field_name,
  new_value,
  created_at
) VALUES (
  'UPDATE',
  'webhook_system_ready',
  'Property webhook system configured for: https://rentresponsibly.app.n8n.cloud/webhook-test/checklist-generator',
  now()
);
