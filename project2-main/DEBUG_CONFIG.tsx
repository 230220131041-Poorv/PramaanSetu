// Temporary debug file - check if env vars are loaded
import { useEffect } from 'react';

export function DebugConfig() {
  useEffect(() => {
    console.log('=== DEBUG CONFIG ===');
    console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ LOADED' : '❌ MISSING');
    console.log('SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ LOADED' : '❌ MISSING');
    console.log('URL Value:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    
    // Test fetch to Supabase
    fetch(process.env.EXPO_PUBLIC_SUPABASE_URL || '')
      .then(r => console.log('✅ Supabase reachable. Status:', r.status))
      .catch(e => console.log('❌ Supabase unreachable:', e.message));
  }, []);

  return null;
}
