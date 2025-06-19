
-- First, let's see what action types are currently allowed
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%action_type%';

-- Let's also check what values are already in the table to understand the pattern
SELECT DISTINCT action_type FROM checklist_audit_log ORDER BY action_type;

-- Check the table structure to understand the constraint
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'checklist_audit_log' 
AND table_schema = 'public';
