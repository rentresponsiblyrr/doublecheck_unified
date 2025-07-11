# Database Migration for Inspector Presence System

This directory contains the database migration needed to complete the Lovable transition by adding the missing `inspector_presence` table and related functions.

## What This Fixes

The app was failing with a 500 error because it was trying to query the `inspector_presence` table which didn't exist in the database, even though it was defined in the TypeScript types from the original Lovable implementation.

## Files

- `create_inspector_presence.sql` - Complete SQL migration script
- `run_migration.js` - Node.js script to run the migration (requires service role key)
- `README.md` - This file

## Quick Setup (Recommended)

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `create_inspector_presence.sql`
4. Paste and run the SQL script
5. Restart your app

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db reset  # This will reset your database
# Or apply just this migration:
supabase db push
```

### Option 3: Node.js Script

```bash
# Requires SUPABASE_SERVICE_ROLE_KEY in your .env file
npm install @supabase/supabase-js dotenv
node database/run_migration.js
```

## What Gets Created

### Tables
- **inspector_presence** - Tracks real-time inspector activity
  - `inspection_id` - Which inspection they're working on
  - `inspector_id` - Which user is present
  - `status` - online, offline, viewing, working
  - `current_item_id` - Which checklist item they're on
  - `last_seen` - Timestamp of last activity
  - `metadata` - Additional presence data

### Functions
- **update_inspector_presence()** - RPC function to update presence
- **get_active_inspectors()** - Get all active inspectors for an inspection
- **cleanup_stale_presence()** - Clean up old presence records

### Security
- Row Level Security (RLS) policies
- Users can only see presence for inspections they have access to
- Admins/auditors can see all presence data
- Proper validation and error handling

## Features This Enables

After running this migration, your app will have:

✅ **Real-time Collaboration**
- See which inspectors are currently working on inspections
- Track which checklist items they're viewing/working on
- Automatic cleanup of stale presence data

✅ **Conflict Prevention**
- Multiple inspectors can see each other's activity
- Prevents duplicate work on checklist items
- Real-time presence indicators

✅ **Activity Monitoring**
- Track inspector engagement and activity
- Monitor inspection progress in real-time
- Audit trail of inspector presence

## Verification

After running the migration, you can verify it worked by:

1. **Check the table exists:**
   ```sql
   SELECT COUNT(*) FROM inspector_presence;
   ```

2. **Test the RPC function:**
   ```sql
   SELECT update_inspector_presence('your-inspection-id'::uuid, 'online');
   ```

3. **Restart your app** - The 500 errors should be gone!

## Troubleshooting

**500 Error Still Happening?**
- Make sure you ran the complete SQL script
- Check that the `update_inspector_presence` function exists
- Verify your user has the necessary permissions

**Permission Denied?**
- Make sure you're using a service role key or admin account
- Check that RLS policies were created correctly

**Table Already Exists?**
- The script uses `IF NOT EXISTS` so it's safe to run multiple times
- If you have a partial table, you may need to drop it first

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify all SQL was executed successfully
3. Test the functions manually in SQL Editor
4. Check that your user has proper permissions