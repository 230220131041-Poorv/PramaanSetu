import { Platform } from 'react-native';

// Dummy Supabase client for demo purposes
// No actual connection to Supabase is needed

export const supabase = {
  auth: {
    signUp: async () => ({ data: {}, error: null }),
    signInWithPassword: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => ({ 
      data: { subscription: { unsubscribe: () => {} } } 
    }),
    resetPasswordForEmail: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({ 
      eq: () => ({ single: async () => ({ data: null, error: { code: 'PGRST116' } }) }),
      order: () => ({ 
        limit: () => ({ data: [], error: null }) 
      }),
      data: [],
      error: null,
    }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
  }),
};
