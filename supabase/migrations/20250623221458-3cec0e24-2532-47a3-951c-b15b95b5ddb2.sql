
-- Add notes column to checklist_items if it doesn't exist (it already exists based on the schema)
-- Add failed status support by updating the status field to allow 'failed' value
-- The status field already exists and can store text, so no schema changes needed

-- Add an index for better performance on checklist item queries
CREATE INDEX IF NOT EXISTS idx_checklist_items_inspection_status 
ON checklist_items(inspection_id, status);

-- Add an index for media queries
CREATE INDEX IF NOT EXISTS idx_media_checklist_item 
ON media(checklist_item_id, created_at DESC);

-- Create a function to update checklist item with notes and status
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
  UPDATE checklist_items 
  SET 
    status = item_status,
    notes = COALESCE(item_notes, notes)
  WHERE id = item_id
  RETURNING * INTO updated_item;
  
  RETURN updated_item;
END;
$$;
