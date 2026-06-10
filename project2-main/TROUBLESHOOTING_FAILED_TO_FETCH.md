# "Failed to Fetch" Error - Complete Troubleshooting Guide

## Quick Diagnosis

If you're seeing **"Failed to fetch"** when trying to sign up or sign in, follow these steps:

### Step 1: Open Browser Developer Tools
1. Press `F12` or right-click → **Inspect**
2. Go to **Console** tab
3. Look for blue logs starting with "Attempting sign up/in for:"
4. This will tell you exactly what's happening

### Step 2: Check Environment Variables Are Loaded
You should see logs like:
```
✅ "Attempting sign up for: test@example.com"
✅ "Supabase URL: https://kikqnhzntldoevjpvsam.supabase.co"
```

If you don't see these logs:
- Your .env file might not be loaded
- Try reloading the app: Close and restart `npm run dev`

### Step 3: Check Network Tab
1. Go to **Network** tab in DevTools
2. Try signing up again
3. Look for requests to `kikqnhzntldoevjpvsam.supabase.co`
4. Click on failed request to see response

---

## Common Issues & Solutions

### Issue 1: "EXPO_PUBLIC_SUPABASE_URL is not defined"

**Cause:** Environment variables not loaded

**Solutions:**
```bash
# Windows PowerShell
$env:EXPO_PUBLIC_SUPABASE_URL="https://kikqnhzntldoevjpvsam.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="your_key_here"
npm run dev

# Mac/Linux
export EXPO_PUBLIC_SUPABASE_URL="https://kikqnhzntldoevjpvsam.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your_key_here"
npm run dev
```

Or create a `.env.local` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://kikqnhzntldoevjpvsam.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Issue 2: Network Error - Can't reach Supabase

**Error message:** "Failed to fetch" or "Network error"

**Test connectivity:**
```javascript
// Open DevTools Console and run:
fetch('https://kikqnhzntldoevjpvsam.supabase.co')
  .then(r => console.log('✅ Connected! Status:', r.status))
  .catch(e => console.log('❌ Error:', e.message))
```

**If it fails:**
1. Check your internet connection
2. Try opening Supabase URL in browser: https://kikqnhzntldoevjpvsam.supabase.co
3. Check if Supabase is down: https://status.supabase.com
4. Check firewall/proxy settings blocking external requests

### Issue 3: "Auth error details: ..."

**Cause:** Database schema not initialized

**Solutions:**
1. Go to Supabase Dashboard: https://app.supabase.com
2. Click **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/schema.sql`
5. Paste into SQL Editor
6. Click **Run**
7. Wait for "Done" message
8. Repeat for `supabase/certificates_schema.sql`
9. Also run `supabase/rls_policies.sql`

Then try signing up again.

### Issue 4: "Permission denied" or "User already exists"

**Cause:** RLS policies not properly configured

**Solution:**
Run `supabase/rls_policies.sql` in SQL Editor to ensure all policies are set up.

### Issue 5: Email Confirmation Required

**Error:** "Please confirm your email before signing in"

**Solution:**
In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Click **Email**
3. Toggle off **Require email confirmation**
4. Click **Save**

This is for development. In production, keep it enabled.

### Issue 6: "Profile not found" but user created

**Cause:** Profile creation trigger doesn't work correctly

**Status:** ✅ Handled - auth service automatically creates profile manually

**Verify:** 
1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Open **profiles** table
4. You should see your test user



---

## Step-by-Step Setup Flow

```
START
 ↓
1. Check .env file exists with correct values
   └─→ ❌ Create/fix .env
   └─→ ✅ Continue
 ↓
2. Test Supabase URL in browser
   └─→ ❌ Fix URL, check internet, check firewall
   └─→ ✅ Continue
 ↓
3. Initialize database schema
   └─→ Run supabase/schema.sql in SQL Editor
   └─→ Run supabase/certificates_schema.sql
   └─→ Run supabase/rls_policies.sql
   └─→ ✅ Continue
 ↓
4. Disable email verification (development only)
   └─→ Auth → Providers → Email → Toggle off
   └─→ ✅ Continue
 ↓
5. Start dev server
   └─→ npm run dev
   └─→ ✅ Continue
 ↓
6. Test signup
   └─→ Press 'w' for web
   └─→ Fill signup form
   └─→ Check DevTools Console for logs
   └─→ ❌ See error? Go back to troubleshooting
   └─→ ✅ Profile created? SUCCESS!
 ↓
7. Test signin
   └─→ Sign out
   └─→ Go to login
   └─→ Use same credentials
   └─→ ✅ Logged in? SUCCESS!
 ↓
END - Connection working!
```

---

## Verification Checklist

- [ ] .env file exists with Supabase URL and key
- [ ] Supabase URL is accessible in browser
- [ ] schema.sql executed successfully
- [ ] certificates_schema.sql executed successfully
- [ ] rls_policies.sql executed successfully
- [ ] All 6 tables exist in Database Editor
- [ ] Email confirmation is disabled (dev mode)
- [ ] npm run dev runs without errors
- [ ] Web version opens (press 'w')
- [ ] DevTools shows blue "Attempting sign up" logs
- [ ] Can create new user account
- [ ] Profile appears in Supabase profiles table
- [ ] Can sign out
- [ ] Can sign in with same credentials

---

## Database Verification Queries

Run these in Supabase SQL Editor to verify everything is set up:

```sql
-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Should show: profiles, activities, skills, achievements, notifications, shareable_links

-- 2. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
-- Should show rowsecurity = true for all tables

-- 3. Check triggers
SELECT schemaname, tablename, trigname 
FROM pg_trigger 
WHERE schemaname = 'public';
-- Should show: on_auth_user_created trigger

-- 4. Count profiles
SELECT count(*) as profile_count FROM profiles;

-- 5. Test select from profiles
SELECT id, email, full_name, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;
```

---

## Performance Tips

If sign up/in is slow:

1. **Check network latency:**
   ```javascript
   console.time('signup');
   // ... signup code
   console.timeEnd('signup');
   ```

2. **Optimize profile fetching:**
   - The auth service waits 1 second for trigger
   - Then fetches profile
   - Total time: ~1-2 seconds expected

3. **Check Supabase metrics:**
   - Dashboard → Logs
   - Look for slow queries

4. **Verify connection pooling:**
   - Supabase automatically handles this
   - No config needed

---

## Getting Help

If you still have issues:

1. **Check DevTools Console** (F12) for exact error
2. **Check Supabase Dashboard Logs:**
   - Click your avatar → Logs
   - Look for specific error messages
3. **Verify URLs:**
   - Supabase URL: `https://kikqnhzntldoevjpvsam.supabase.co`
   - Anon Key: Should start with `eyJhbGc...`
4. **Check status:**
   - Supabase: https://status.supabase.com
   - Your network: Can you access google.com?

---

## Next Steps After Setup

Once connection is working:

1. ✅ Test creating an activity
2. ✅ Test uploading certificate
3. ✅ Test portfolio generation
4. ✅ Test analytics
5. ✅ Test admin dashboard

See documentation for each feature.
