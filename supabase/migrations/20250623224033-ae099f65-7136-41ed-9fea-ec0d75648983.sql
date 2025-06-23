
-- Update the check constraint to allow the new status values
ALTER TABLE checklist_items DROP CONSTRAINT IF EXISTS checklist_items_status_check;

-- Add new check constraint that allows NULL, 'completed', 'failed', and 'not_applicable'
ALTER TABLE checklist_items 
ADD CONSTRAINT checklist_items_status_check 
CHECK (status IS NULL OR status IN ('completed', 'failed', 'not_applicable'));

-- Update the function to handle all status types including 'not_applicable'
CREATE OR REPLACE FUNCTION update_checklist_item_complete(
  item_id UUID,
  item_status TEXT,
  item_notes TEXT DEFAULT NULL
)
RETURNS checklist_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_item checklist_items;
BEGIN
  -- Validate status value
  IF item_status IS NOT NULL AND item_status NOT IN ('completed', 'failed', 'not_applicable') THEN
    RAISE EXCEPTION 'Invalid status value: %. Must be NULL, completed, failed, or not_applicable', item_status;
  END IF;

  UPDATE checklist_items 
  SET 
    status = item_status,
    notes = COALESCE(item_notes, notes)
  WHERE id = item_id
  RETURNING * INTO updated_item;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checklist item with id % not found', item_id;
  END IF;
  
  RETURN updated_item;
END;
$$;
