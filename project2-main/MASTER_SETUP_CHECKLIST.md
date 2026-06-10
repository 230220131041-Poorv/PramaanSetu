# Complete Supabase Setup - Master Checklist

## Pre-Setup Verification
- [ ] You have access to Supabase project: https://app.supabase.com
- [ ] You have `.env` file with Supabase credentials
- [ ] Project URL: `kikqnhzntldoevjpvsam.supabase.co`
- [ ] You can access: https://app.supabase.com/project/kikqnhzntldoevjpvsam

## Phase 1: Database Schema (10 minutes)

### 1.1 Initialize Main Schema
- [ ] Go to Supabase Dashboard
- [ ] Click **SQL Editor** → **New Query**
- [ ] Copy entire contents of `supabase/schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click **Run**
- [ ] Wait for "Done" message
- [ ] See ✅ All SQL executed successfully

**Expected:** 10-15 functions, indexes, and tables created

### 1.2 Initialize Certificates Schema
- [ ] Click **SQL Editor** → **New Query**
- [ ] Copy entire contents of `supabase/certificates_schema.sql`
- [ ] Paste into SQL Editor
- [ ] Click **Run**
- [ ] Wait for "Done" message

**Expected:** Certificate, validation, and badge-related tables created

### 1.3 Enable Row Level Security Policies
- [ ] Click **SQL Editor** → **New Query**
- [ ] Copy entire contents of `supabase/rls_policies.sql`
- [ ] Paste into SQL Editor
- [ ] Click **Run**
- [ ] Wait for "Done" message

**Expected:** All RLS policies and permission rules created

## Phase 2: Verify Database Structure (5 minutes)

### 2.1 Check Tables Exist
- [ ] In Supabase, go to **Table Editor**
- [ ] You should see these tables:
  - [ ] profiles
  - [ ] activities
  - [ ] skills
  - [ ] achievements
  - [ ] notifications
  - [ ] shareable_links
  - [ ] certificates (NEW)
  - [ ] validation_tasks (NEW)
  - [ ] verification_badges (NEW)
  - [ ] certificate_embeddings (NEW)
  - [ ] portfolios (NEW)
  - [ ] chat_messages (NEW)
  - [ ] audit_reports (NEW)

### 2.2 Verify Columns in profiles Table
- [ ] Click **profiles** table
- [ ] Verify these columns exist:
  - [ ] id (UUID)
  - [ ] email (TEXT)
  - [ ] full_name (TEXT)
  - [ ] role (user_role enum)
  - [ ] department (TEXT)
  - [ ] semester (INTEGER)
  - [ ] cgpa (DECIMAL)
  - [ ] enrollment_number (TEXT)
  - [ ] avatar_url (TEXT)
  - [ ] created_at (TIMESTAMP)
  - [ ] updated_at (TIMESTAMP)

### 2.3 Check RLS is Enabled
- [ ] Go to **Authentication** → **Policies**
- [ ] Each table should show a lock icon 🔒
- [ ] All tables have RLS enabled:
  - [ ] profiles
  - [ ] activities
  - [ ] skills
  - [ ] achievements
  - [ ] notifications
  - [ ] shareable_links

## Phase 3: Authentication Configuration (5 minutes)

### 3.1 Email Provider Setup
- [ ] Go to **Authentication** → **Providers**
- [ ] Click **Email**
- [ ] **For Development:** Toggle OFF "Require email confirmation"
- [ ] Click **Save**

### 3.2 Optional: Email Templates
- [ ] Go to **Authentication** → **Email Templates**
- [ ] Verify "Confirm signup" template exists
- [ ] Update sender email if needed (optional)

## Phase 4: Application Configuration (5 minutes)

### 4.1 Check .env File
- [ ] .env file exists in project root
- [ ] Contains:
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://kikqnhzntldoevjpvsam.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  ```

### 4.2 Verify Environment Variables
- [ ] In project root, check file exists: `.env`
- [ ] URL is correct: `https://kikqnhzntldoevjpvsam.supabase.co`
- [ ] Anon key starts with: `eyJhbGc...`

## Phase 5: Application Startup (5 minutes)

### 5.1 Install Dependencies
- [ ] Run: `npm install`
- [ ] No errors
- [ ] node_modules created

### 5.2 Start Development Server
- [ ] Run: `npm run dev`
- [ ] App starts with Metro Bundler
- [ ] QR code displayed
- [ ] No error messages

### 5.3 Open Web Version
- [ ] Press `w` in terminal
- [ ] Browser opens to http://localhost:8081
- [ ] App loads
- [ ] Navigation working

## Phase 6: Test Authentication (5 minutes)

### 6.1 Open DevTools
- [ ] Press `F12` or right-click → **Inspect**
- [ ] Click **Console** tab
- [ ] Keep console open

### 6.2 Test Signup
- [ ] Click "Sign Up" button
- [ ] Fill form:
  - [ ] Email: `test@example.com`
  - [ ] Password: `TestPassword123`
  - [ ] Full Name: `Test User`
  - [ ] Role: `Student`
- [ ] Click Sign Up
- [ ] **Check Console for logs:**
  - [ ] ✅ "Attempting sign up for: test@example.com"
  - [ ] ✅ "Supabase URL: https://kikqnhzntldoevjpvsam.supabase.co"
  - [ ] ✅ "Signup successful, profile: ..."

### 6.3 Verify Profile Created
- [ ] Go to Supabase Dashboard
- [ ] Click **Table Editor** → **profiles**
- [ ] You should see new row:
  - [ ] email: `test@example.com`
  - [ ] full_name: `Test User`
  - [ ] role: `student`
  - [ ] created_at: Just now

### 6.4 Test Signin
- [ ] App should navigate to home
- [ ] Click "Sign Out"
- [ ] Go back to login
- [ ] Enter credentials:
  - [ ] Email: `test@example.com`
  - [ ] Password: `TestPassword123`
- [ ] Click Sign In
- [ ] Should login successfully
- [ ] **Check Console:**
  - [ ] ✅ "Attempting sign in for: test@example.com"
  - [ ] ✅ "Signup successful, profile: ..." (profile data)

## Phase 7: Test Data Operations (10 minutes)

### 7.1 Create Activity
- [ ] Go to activities/create page
- [ ] Fill form:
  - [ ] Title: "Test Activity"
  - [ ] Description: "This is a test"
  - [ ] Category: Any
  - [ ] Date: Today
- [ ] Upload proof (any image)
- [ ] Submit
- [ ] Should succeed

### 7.2 Verify Activity in Database
- [ ] Go to Supabase Dashboard
- [ ] Table Editor → **activities**
- [ ] You should see new row with your activity

### 7.3 Update Profile
- [ ] Go to profile page
- [ ] Update information:
  - [ ] Department: "Computer Science"
  - [ ] Semester: "4"
  - [ ] CGPA: "3.50"
- [ ] Save
- [ ] Should succeed

### 7.4 Verify Profile Update
- [ ] Supabase Dashboard → **profiles** table
- [ ] Your row should show updated values

## Phase 8: Troubleshooting (As Needed)

### If Signup Fails:

**"Failed to fetch"**
- [ ] Check DevTools Console for exact error
- [ ] Verify .env variables are loaded
- [ ] Check Supabase URL is accessible
- [ ] Verify database schema is initialized
- [ ] See: `TROUBLESHOOTING_FAILED_TO_FETCH.md`

**"Profile not found"**
- [ ] Trigger should auto-create profile
- [ ] Check Supabase Logs for trigger execution
- [ ] Manually create profile if needed

**"Permission denied"**
- [ ] Verify RLS policies are enabled
- [ ] Re-run `supabase/rls_policies.sql`

**"Email confirmation required"**
- [ ] Disable in Auth → Providers → Email
- [ ] No "Require email confirmation" toggle

## Final Verification

### All Done? Check These:
- [ ] npm run dev runs without errors
- [ ] Web version opens (press 'w')
- [ ] Can sign up new account
- [ ] Profile created in database
- [ ] Can sign out
- [ ] Can sign in
- [ ] Can see home page
- [ ] Can navigate app
- [ ] Can create activity
- [ ] Can update profile

## Documentation Files

After setup is complete, refer to:
- [ ] `QUICK_START_SUPABASE.md` - Quick reference
- [ ] `SUPABASE_CONNECTION_GUIDE.md` - Detailed setup
- [ ] `TROUBLESHOOTING_FAILED_TO_FETCH.md` - Error solutions

## Next Steps

Once verified:
1. [ ] Test all major features
2. [ ] Set up admin users if needed
3. [ ] Configure additional settings
4. [ ] Deploy to production (see deployment docs)

---

## Time Estimates

| Phase | Time |
|-------|------|
| 1. Database Schema | 10 min |
| 2. Verify Structure | 5 min |
| 3. Auth Config | 5 min |
| 4. App Config | 5 min |
| 5. App Startup | 5 min |
| 6. Test Auth | 10 min |
| 7. Test Data | 10 min |
| 8. Troubleshooting | As needed |
| **Total** | **50-60 min** |

---

## Estimated Total Time: **~1 Hour**

This includes all setup, verification, and basic testing.

---

## Support

If stuck at any phase:
1. Check the relevant guide:
   - Schema issues → `SUPABASE_CONNECTION_GUIDE.md`
   - Auth errors → `TROUBLESHOOTING_FAILED_TO_FETCH.md`
2. Review the Phase checklist
3. Check DevTools Console
4. Review Supabase Logs

Good luck! 🚀
