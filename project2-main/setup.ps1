# Supabase Setup and Verification Script for Windows
# Run this in PowerShell to set up Supabase

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Supabase Setup Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env with your Supabase credentials:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "EXPO_PUBLIC_SUPABASE_URL=https://kikqnhzntldoevjpvsam.supabase.co" -ForegroundColor Gray
    Write-Host "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Read env file
$envContent = Get-Content ".env" -Raw

if ($envContent -match "EXPO_PUBLIC_SUPABASE_URL") {
    Write-Host "✅ Supabase URL configured" -ForegroundColor Green
    $urlMatch = $envContent | Select-String "EXPO_PUBLIC_SUPABASE_URL=(.+)"
    $supabaseUrl = $urlMatch.Matches[0].Groups[1].Value
} else {
    Write-Host "❌ EXPO_PUBLIC_SUPABASE_URL not found in .env" -ForegroundColor Red
    exit 1
}

if ($envContent -match "EXPO_PUBLIC_SUPABASE_ANON_KEY") {
    Write-Host "✅ Supabase anon key configured" -ForegroundColor Green
} else {
    Write-Host "❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setup Instructions:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to Supabase Dashboard: https://app.supabase.com" -ForegroundColor White
Write-Host "2. Open your project" -ForegroundColor White
Write-Host "3. Go to SQL Editor" -ForegroundColor White
Write-Host "4. Run the following scripts in order:" -ForegroundColor White
Write-Host ""
Write-Host "   a) supabase/schema.sql              - Main database schema" -ForegroundColor Gray
Write-Host "   b) supabase/certificates_schema.sql - Certificates tables" -ForegroundColor Gray
Write-Host "   c) supabase/rls_policies.sql        - Row Level Security" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Verify these tables exist in Database browser:" -ForegroundColor White
Write-Host "   - profiles" -ForegroundColor Gray
Write-Host "   - activities" -ForegroundColor Gray
Write-Host "   - skills" -ForegroundColor Gray
Write-Host "   - achievements" -ForegroundColor Gray
Write-Host "   - notifications" -ForegroundColor Gray
Write-Host "   - shareable_links" -ForegroundColor Gray
Write-Host ""
Write-Host "6. In Authentication → Providers → Email:" -ForegroundColor White
Write-Host "   Disable 'Require email confirmation' for development" -ForegroundColor Gray
Write-Host ""
Write-Host "7. Run your app: npm run dev" -ForegroundColor White
Write-Host "8. Test signup in web version (press 'w')" -ForegroundColor White
Write-Host ""

Write-Host "Database Verification Queries:" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these in Supabase SQL Editor:" -ForegroundColor White
Write-Host ""
Write-Host "-- Check all tables exist" -ForegroundColor Gray
Write-Host "SELECT table_name FROM information_schema.tables" -ForegroundColor Gray
Write-Host "WHERE table_schema = 'public' ORDER BY table_name;" -ForegroundColor Gray
Write-Host ""
Write-Host "-- Check RLS is enabled" -ForegroundColor Gray
Write-Host "SELECT schemaname, tablename, rowsecurity FROM pg_tables" -ForegroundColor Gray
Write-Host "WHERE schemaname = 'public' ORDER BY tablename;" -ForegroundColor Gray
Write-Host ""
Write-Host "-- Count profiles" -ForegroundColor Gray
Write-Host "SELECT count(*) as profile_count FROM profiles;" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "1. ✅ Create .env file (done)" -ForegroundColor Green
Write-Host "2. ✅ Supabase credentials found" -ForegroundColor Green
Write-Host "3. ⬜ Initialize Supabase database (run SQL scripts)" -ForegroundColor Yellow
Write-Host "4. ⬜ Enable RLS policies" -ForegroundColor Yellow
Write-Host "5. ⬜ Test connection" -ForegroundColor Yellow
Write-Host "6. ⬜ Test signup/signin" -ForegroundColor Yellow
Write-Host ""

Write-Host "Detected Supabase Project:" -ForegroundColor Cyan
Write-Host $supabaseUrl -ForegroundColor Gray
Write-Host ""

Write-Host "Run this command to start the dev server:" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host ""

# Test connectivity
Write-Host "Testing connectivity to Supabase..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $supabaseUrl -Method HEAD -ErrorAction Stop
    Write-Host "✅ Supabase is reachable (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not reach Supabase URL" -ForegroundColor Yellow
    Write-Host "This might be due to:" -ForegroundColor Yellow
    Write-Host "  - Network connectivity issue" -ForegroundColor Gray
    Write-Host "  - Firewall blocking" -ForegroundColor Gray
    Write-Host "  - Invalid Supabase URL" -ForegroundColor Gray
}
