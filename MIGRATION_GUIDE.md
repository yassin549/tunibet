# Database Migration Guide

## 🗄️ Add Session ID for Telegram Bot

### Step 1: Run Migration in Supabase

#### Option A: Via Supabase Dashboard (Easiest)
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the following SQL:

```sql
-- Add session_id column to users table for Telegram bot integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id);

-- Add comment
COMMENT ON COLUMN users.session_id IS 'Unique session ID for Telegram bot integration';
```

5. Click "Run" button
6. ✅ Done! The column is added

#### Option B: Via Supabase CLI
```bash
# Navigate to project directory
cd c:/Users/khoua/OneDrive/Desktop/tunibet/tunibet

# Push migration
supabase db push
```

### Step 2: Verify Migration

Run this query in SQL Editor to verify:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'session_id';
```

Expected result:
```
column_name | data_type | is_nullable
------------|-----------|-------------
session_id  | text      | YES
```

### Step 3: Test Session ID Generation

1. Restart your dev server:
```bash
npm run dev
```

2. Log in to your account
3. Go to Profile → Settings tab
4. Scroll to "Telegram Bot Integration" section
5. You should see a session ID generated automatically
6. Click "Copy ID" to test clipboard functionality
7. Click "Regenerate" to test regeneration

### Troubleshooting

#### Migration Fails
**Error:** `column "session_id" already exists`
- **Solution:** Column is already added, skip migration

**Error:** `permission denied`
- **Solution:** Make sure you're logged into Supabase CLI:
```bash
supabase login
```

#### Session ID Not Showing
**Check:**
1. Browser console for errors (F12)
2. Verify API endpoint exists: `/api/user/session-id`
3. Check Supabase auth is working
4. Verify migration ran successfully

#### API Errors
**Error:** `Failed to fetch session ID`
- Check Supabase connection
- Verify `.env.local` has correct credentials
- Check user is authenticated

**Error:** `Failed to create session ID`
- Check database permissions
- Verify users table exists
- Check column was added correctly

### Rollback (If Needed)

If you need to remove the session_id column:
```sql
-- Remove column
ALTER TABLE users DROP COLUMN IF EXISTS session_id;

-- Remove index
DROP INDEX IF EXISTS idx_users_session_id;
```

⚠️ **Warning:** This will delete all session IDs. Users will need to regenerate them.

### Next Steps After Migration

1. ✅ Test session ID generation
2. ✅ Test copy to clipboard
3. ✅ Test regeneration
4. ✅ Verify database storage
5. 🔄 Build Telegram bot (separate task)

### Security Notes

- Session IDs are unique per user
- 32-character hex strings (highly secure)
- Stored with UNIQUE constraint
- Can be regenerated if compromised
- Never shared in logs or errors

---

**Status:** Ready to migrate ✅
**Estimated Time:** 2 minutes
**Risk Level:** Low (non-destructive, optional column)
