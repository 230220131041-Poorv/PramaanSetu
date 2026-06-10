#!/bin/bash

# Supabase Setup and Verification Script
# This script helps set up and verify Supabase connection

echo "================================"
echo "Supabase Setup Verification"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create .env with your Supabase credentials:"
    echo ""
    echo "EXPO_PUBLIC_SUPABASE_URL=https://kikqnhzntldoevjpvsam.supabase.co"
    echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here"
    echo ""
    exit 1
fi

# Read env file
if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
    echo "✅ Supabase URL configured"
    SUPABASE_URL=$(grep EXPO_PUBLIC_SUPABASE_URL .env | cut -d '=' -f 2)
else
    echo "❌ EXPO_PUBLIC_SUPABASE_URL not found in .env"
    exit 1
fi

if grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
    echo "✅ Supabase anon key configured"
else
    echo "❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env"
    exit 1
fi

echo ""
echo "Setup Instructions:"
echo "=================="
echo ""
echo "1. Go to Supabase Dashboard: https://app.supabase.com"
echo "2. Open your project"
echo "3. Go to SQL Editor"
echo "4. Run the following scripts in order:"
echo ""
echo "   a) supabase/schema.sql           - Main database schema"
echo "   b) supabase/certificates_schema.sql - Certificates tables"
echo "   c) supabase/rls_policies.sql     - Row Level Security"
echo ""
echo "5. Verify in Database browser that these tables exist:"
echo "   - profiles"
echo "   - activities"
echo "   - skills"
echo "   - achievements"
echo "   - notifications"
echo "   - shareable_links"
echo ""
echo "6. Check Authentication → Providers → Email"
echo "   Disable 'Require email confirmation' for development"
echo ""
echo "7. Run your app: npm run dev"
echo "8. Test signup in web version (press 'w')"
echo ""

echo "Manual Database Checks:"
echo "======================"
echo ""
echo "In Supabase SQL Editor, run:"
echo ""
echo "-- Check tables"
echo "SELECT table_name FROM information_schema.tables"
echo "  WHERE table_schema = 'public' ORDER BY table_name;"
echo ""
echo "-- Check RLS is enabled"
echo "SELECT schemaname, tablename, rowsecurity FROM pg_tables"
echo "  WHERE schemaname = 'public' ORDER BY tablename;"
echo ""
echo "-- Check profiles"
echo "SELECT count(*) as profile_count FROM profiles;"
echo ""

echo "Next Steps:"
echo "=========="
echo "1. ✅ Create .env file (done)"
echo "2. ⬜ Initialize Supabase database"
echo "3. ⬜ Enable RLS policies"
echo "4. ⬜ Test connection"
echo "5. ⬜ Test signup/signin"
echo ""

echo "Run this command to start the dev server:"
echo "npm run dev"
echo ""
