
-- Add user attribution fields to the media table
ALTER TABLE public.media 
ADD COLUMN user_id uuid REFERENCES auth.users(id),
ADD COLUMN uploaded_by_name text;

-- Add user attribution fields to checklist_items for notes tracking
ALTER TABLE public.checklist_items 
ADD COLUMN notes_history jsonb DEFAULT '[]'::jsonb;

-- Create a function to append user-attributed notes
CREATE OR REPLACE FUNCTION public.append_user_note(
  item_id uuid,
  note_text text,
  user_id uuid,
  user_name text
) RETURNS checklist_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_item checklist_items;
  new_note_entry jsonb;
BEGIN
  -- Create the new note entry
  new_note_entry := jsonb_build_object(
    'text', note_text,
    'user_id', user_id,
    'user_name', user_name,
    'timestamp', now()
  );
  
  -- Update the checklist item with the new note
  UPDATE checklist_items 
  SET 
    notes_history = COALESCE(notes_history, '[]'::jsonb) || new_note_entry,
    notes = note_text -- Keep the latest note in the notes field for backward compatibility
  WHERE id = item_id
  RETURNING * INTO updated_item;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checklist item with id % not found', item_id;
  END IF;
  
  RETURN updated_item;
END;
$$;

-- Create index for better performance on user-related queries
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_notes_history ON public.checklist_items USING gin(notes_history);

-- Enable real-time updates for collaborative features
ALTER TABLE public.media REPLICA IDENTITY FULL;
ALTER TABLE public.checklist_items REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.media;
ALTER publication supabase_realtime ADD TABLE public.checklist_items;
