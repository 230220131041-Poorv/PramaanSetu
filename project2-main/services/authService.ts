import { Profile, ProfileUpdate } from '@/types/database';
import { DUMMY_USERS, DUMMY_CREDENTIALS } from '@/constants/dummyUsers';

let currentSession: { user: Profile; sessionId: string } | null = null;
const authStateListeners: Array<(user: Profile | null) => void> = [];

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'faculty';
  department?: string;
  semester?: number;
  cgpa?: number;
  enrollment_number?: string;
  avatar_url?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: Profile;
}

/**
 * Sign up a new user (dummy implementation)
 */
export async function signUp(data: SignUpData): Promise<AuthResult> {
  try {
    console.log('🔄 Attempting sign up for:', data.email);
    
    // Check if dummy user exists
    if (DUMMY_USERS[data.email.toLowerCase()]) {
      return { 
        success: false, 
        error: 'User already exists. Please sign in instead.' 
      };
    }
    
    // For demo purposes, we only allow the predefined dummy users
    console.log('ℹ️ New user registration not available. Please use demo credentials.');
    return { 
      success: false, 
      error: 'User registration is disabled. Please use demo accounts.' 
    };
  } catch (error) {
    console.error('❌ SignUp error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Unexpected error: ${errorMsg}` };
  }
}

/**
 * Sign in an existing user (dummy implementation)
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  try {
    console.log('🔄 Attempting sign in for:', data.email);
    
    const email = data.email.toLowerCase();
    const user = DUMMY_USERS[email];
    const correctPassword = DUMMY_CREDENTIALS[email];
    
    // Validate credentials
    if (!user) {
      return { 
        success: false, 
        error: 'User not found. Available demo accounts: admin@sap.edu, faculty@sap.edu, student@sap.edu' 
      };
    }
    
    if (correctPassword !== data.password) {
      return { 
        success: false, 
        error: 'Invalid password. Please try again.' 
      };
    }
    
    // Create session
    const sessionId = `session-${Date.now()}-${Math.random()}`;
    currentSession = { user, sessionId };
    
    // Store session in localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('authSession', JSON.stringify({ user, sessionId }));
    }
    
    console.log('🎉 Sign in successful for:', user.email);
    
    // Notify all listeners
    authStateListeners.forEach(listener => listener(user));
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ SignIn error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Unexpected error: ${errorMsg}` };
  }
}

/**
 * Sign out the current user (dummy implementation)
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    currentSession = null;
    
    // Clear session from localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authSession');
    }
    
    // Notify all listeners
    authStateListeners.forEach(listener => listener(null));
    
    return { success: true };
  } catch (error) {
    console.error('SignOut error:', error);
    return { success: false, error: 'Failed to sign out' };
  }
}

/**
 * Get the current session and user profile (dummy implementation)
 */
export async function getCurrentUser(): Promise<Profile | null> {
  try {
    // Check if we have a current session
    if (currentSession) {
      return currentSession.user;
    }
    
    // Try to restore session from localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('authSession');
      if (stored) {
        const { user, sessionId } = JSON.parse(stored);
        currentSession = { user, sessionId };
        return user;
      }
    }
    
    return null;
  } catch (error) {
    console.error('GetCurrentUser error:', error);
    return null;
  }
}

/**
 * Update user profile (dummy implementation)
 */
export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<AuthResult> {
  try {
    if (!currentSession) {
      return { success: false, error: 'Not authenticated' };
    }
    
    // Update the current user in memory
    const updatedUser = { ...currentSession.user, ...updates, updated_at: new Date().toISOString() };
    currentSession.user = updatedUser as Profile;
    
    // Update in localStorage
    if (typeof localStorage !== 'undefined') {
      const session = JSON.parse(localStorage.getItem('authSession') || '{}');
      session.user = updatedUser;
      localStorage.setItem('authSession', JSON.stringify(session));
    }
    
    console.log('✅ Profile updated');
    return { success: true, user: updatedUser as Profile };
  } catch (error) {
    console.error('UpdateProfile error:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

/**
 * Reset password request (dummy implementation - disabled)
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('ℹ️ Password reset is not available in demo mode');
    return { success: false, error: 'Password reset is disabled in demo mode' };
  } catch (error) {
    console.error('ResetPassword error:', error);
    return { success: false, error: 'Failed to send reset email' };
  }
}

/**
 * Listen to auth state changes (dummy implementation)
 */
export function onAuthStateChange(callback: (user: Profile | null) => void) {
  // Register the callback
  authStateListeners.push(callback);
  
  // Call immediately with current state
  callback(currentSession?.user || null);
  
  // Return unsubscribe function
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
}
