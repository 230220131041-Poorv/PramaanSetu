# Testing the Fix - Step by Step Guide

## 🎯 Goal: Verify the "Failed to Fetch" error is fixed

---

## Step 1: Dev Server Status

### Check if dev server is running
Browser should show app at: **http://localhost:8081**

### If not running, start it:
```bash
cd c:\Users\kpoor\Downloads\SIH\ finalist\ 2025\project2-main\ -\ Copy\ -\ Copy\project2-main
npx expo start --web
```

Wait for Metro Bundler to complete (~30 seconds)

---

## Step 2: Open Browser DevTools

### On Windows/Mac/Linux:
```
Press: F12
Or: Right-click → Inspect
Or: Ctrl+Shift+I (Windows) / Cmd+Option+I (Mac)
```

### In DevTools:
1. Click **Console** tab
2. Clear console (⊘ icon)
3. Keep DevTools open on the side

---

## Step 3: Test Signup Flow

### 3.1 Navigate to Signup
- Click "Sign Up" link on home screen
- Or go to: http://localhost:8081 → Sign Up

### 3.2 Fill Out Form
```
Full Name:          Test User
Email:              test@example.com
Password:           TestPassword123
Confirm Password:   TestPassword123
Role:               Student
```

### 3.3 Submit
- Click "Sign Up" button
- **DON'T CLOSE DEVTOOLS** - watch console

---

## Step 4: Watch Console for Success Logs

### ✅ Success Pattern (You should see):
```
🔄 Attempting sign up for: test@example.com
🌐 Supabase URL: https://kikqnhzntldoevjpvsam.supabase.co
✔️ Environment: production
✅ Network connectivity OK (142ms, Status: 200)
📝 Sign up took 543ms
⏳ Waiting for profile trigger...
🔍 Fetching profile for user: 550e8400-e29b-41d4-a716-446655440000
✅ Profile fetched from trigger
🎉 Signup successful, profile: {...}
```

### ❌ If You See This (STOP and Check):
```
❌ Failed to fetch
❌ NetworkError: Failed to fetch
❌ Auth error: Invalid API key
```
→ See Troubleshooting section below

---

## Step 5: Verify Profile Created

### 5.1 In Supabase Dashboard
1. Go to: https://app.supabase.com
2. Open your project: `kikqnhzntldoevjpvsam`
3. Click **Table Editor** (left sidebar)
4. Click **profiles** table
5. Look for email: `test@example.com`

### 5.2 Check Profile Details
```
id:            550e8400-... (auto-generated)
email:         test@example.com
full_name:     Test User
role:          student
department:    (empty)
semester:      (empty)
cgpa:          (empty)
created_at:    Just now (current timestamp)
updated_at:    (empty)
```

✅ **If you see this profile, step 5 is PASSED!**

---

## Step 6: Test Signin

### 6.1 Logout
- App should show "Continue as Test User"
- Or go to Profile → Sign Out
- Confirm logout

### 6.2 Navigate to Signin
- Click "Sign In" link
- Or go to: http://localhost:8081 → Sign In

### 6.3 Enter Credentials
```
Email:    test@example.com
Password: TestPassword123
```

### 6.4 Click Sign In
- **Watch console for logs**
- Should see signin success logs
- Should redirect to home/dashboard

### 6.5 Check Console
```
✅ Network connectivity OK (XXXms)
🔐 Sign in took XXXms
✅ Profile fetched successfully
🎉 Sign in successful, user: test@example.com
```

✅ **If you see these logs, step 6 is PASSED!**

---

## Step 7: Test Session Persistence

### 7.1 Refresh Browser
- Press `F5` or `Ctrl+R` (Windows) / `Cmd+R` (Mac)
- Wait for app to reload

### 7.2 Check Status
- Should still be logged in
- Should NOT ask for password again
- Should show your profile info

✅ **If still logged in after refresh, step 7 is PASSED!**

---

## 🏁 Complete Test Results

### ✅ All Steps Passed Means:
- [x] Signup works
- [x] Profile created
- [x] Signin works
- [x] Session persists
- [x] **"Failed to Fetch" error is FIXED**

---

## 🆘 Troubleshooting

### Issue: "Still seeing 'Failed to Fetch'"

**Check 1: Clear Browser Cache**
```
Right-click refresh button → Empty cache and hard refresh
Or: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
Try signup again
```

**Check 2: Verify Console Logs**
Look for these in order:
1. 🔄 Attempting sign up - ✅ Should appear
2. ✅ Network connectivity OK - ✅ Should appear
3. 📝 Sign up took XXXms - ✅ Should appear

**If logs don't appear:**
- Dev server might not be running
- Restart: `Ctrl+C` in terminal, then `npx expo start --web`
- Close and reopen browser

**Check 3: Verify .env File**
```
File location: project2-main/.env
Must contain:
EXPO_PUBLIC_SUPABASE_URL=https://kikqnhzntldoevjpvsam.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**If missing:**
- Create/update .env file
- Restart dev server
- Try again

**Check 4: Database Not Initialized**
If error is: `relation "profiles" does not exist`

1. Go to Supabase Dashboard
2. SQL Editor → New Query
3. Copy from: `supabase/schema.sql`
4. Paste → Run
5. Repeat for `supabase/certificates_schema.sql`
6. Repeat for `supabase/rls_policies.sql`
7. Try signup again

### Issue: App Loads But No Auth Page

**Check: Router Configuration**
1. Open `app/_layout.tsx`
2. Verify auth flow logic
3. Check if user state is being set
4. Clear browser cache and reload

### Issue: "Profile Already Exists"

This is normal if signup succeeded but page didn't navigate.
- Go to Signin
- Use: test@example.com / TestPassword123
- Should work

### Issue: Supabase Connection Timeout

**Check:**
1. Internet connection working?
2. Firewall blocking Supabase?
3. Try: https://app.supabase.com in browser
4. Should load without error

**If not accessible:**
- Check your network
- Try different network/WiFi
- Check: https://status.supabase.com

---

## 📊 Test Report Template

Copy this and fill out:

```
TEST DATE: ________
TESTER: ________
BROWSER: Chrome / Firefox / Safari / Edge

✅ Dev Server Running: YES / NO
✅ Console Logs Visible: YES / NO
✅ Signup Completed: YES / NO
✅ Profile Created in DB: YES / NO
✅ Signin Worked: YES / NO
✅ Session Persists: YES / NO

ISSUES FOUND:
_________________________________
_________________________________

NOTES:
_________________________________
_________________________________

STATUS: ✅ PASSED / ⚠️ NEEDS WORK / ❌ FAILED
```

---

## Quick Command Reference

```bash
# Start dev server
cd project2-main
npx expo start --web

# Open Supabase SQL Editor
https://app.supabase.com → SQL Editor

# Open Profile Table
https://app.supabase.com → Table Editor → profiles

# Clear Browser Cache
DevTools (F12) → Settings (⚙️) → Clear site data

# Check Network Tab
DevTools (F12) → Network → Refresh → Look for supabase requests
```

---

## Success Indicators

### Console Shows:
- ✅ 🔄 Attempting sign up
- ✅ ✅ Network connectivity OK
- ✅ 📝 Sign up took XXXms
- ✅ 🎉 Signup successful

### Browser Shows:
- ✅ Welcome message or dashboard
- ✅ Logged in status
- ✅ No error popups

### Database Shows:
- ✅ New row in `profiles` table
- ✅ Correct email and name
- ✅ Role set to `student`

### After Refresh:
- ✅ Still logged in
- ✅ Session preserved
- ✅ No need to login again

---

## Expected Times

| Operation | Expected Time |
|-----------|---------------|
| Load app | 2-3 seconds |
| Network test | 100-300ms |
| Signup request | 400-600ms |
| Profile fetch | 50-200ms |
| **Total signup** | 1-2 seconds |
| Signin request | 300-500ms |
| **Total signin** | <1 second |

---

## Post-Fix Actions

After testing passes:

1. **Clean Up Test Data**
   - Delete test@example.com profile from DB (optional)
   - Or keep for reference

2. **Test Real Scenarios**
   - Create activity
   - Upload certificate
   - Test portfolio
   - Test notifications

3. **Prepare for Deployment**
   - Test on staging environment
   - Get user feedback
   - Document any issues

4. **Monitor Production**
   - Track signup errors
   - Monitor success rate
   - Check response times

---

## ✅ Final Checklist

Before declaring the fix complete:

- [ ] Signup works on web
- [ ] Console shows detailed logs
- [ ] Profile created in database
- [ ] Signin works
- [ ] Session persists after refresh
- [ ] No "Failed to fetch" errors
- [ ] Works on multiple browsers (Chrome, Firefox, Safari)
- [ ] Mobile/Expo Go still works (if applicable)

**All checked? FIX IS COMPLETE! ✅ 🎉**

---

Need help? Check:
1. Console error message
2. TROUBLESHOOTING_FAILED_TO_FETCH.md
3. FAILED_TO_FETCH_FIX_SUMMARY.md
