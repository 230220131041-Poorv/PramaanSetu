// @ts-nocheck - Supabase type definitions incompatible with strict mode
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

export interface UserFilters {
  role?: 'student' | 'faculty' | 'admin';
  department?: string;
  searchQuery?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface UserListResult {
  data: Profile[];
  count: number;
  error?: string;
}

/**
 * Get all users with optional filters (admin only)
 */
export async function getUsers(
  filters?: UserFilters,
  pagination?: PaginationOptions
): Promise<UserListResult> {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.searchQuery) {
      query = query.or(
        `full_name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%,enrollment_number.ilike.%${filters.searchQuery}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('GetUsers error:', error);
    return { data: [], count: 0, error: 'Failed to fetch users' };
  }
}

/**
 * Get students only
 */
export async function getStudents(
  searchQuery?: string,
  pagination?: PaginationOptions
): Promise<UserListResult> {
  return getUsers({ role: 'student', searchQuery }, pagination);
}

/**
 * Get faculty only
 */
export async function getFaculty(
  searchQuery?: string,
  pagination?: PaginationOptions
): Promise<UserListResult> {
  return getUsers({ role: 'faculty', searchQuery }, pagination);
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('GetUserById error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('GetUserById error:', error);
    return null;
  }
}

/**
 * Get all departments
 */
export async function getDepartments(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .not('department', 'is', null);

    if (error) {
      console.error('GetDepartments error:', error);
      return [];
    }

    // Get unique departments
    const departments = [...new Set((data as any[] || []).map((p: any) => p.department).filter(Boolean))];
    return departments as string[];
  } catch (error) {
    console.error('GetDepartments error:', error);
    return [];
  }
}

/**
 * Get student with their stats (for admin view)
 */
export async function getStudentWithStats(studentId: string): Promise<{
  profile: Profile;
  stats: { total_activities: number; total_points: number; certificates_count: number };
} | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    const { data: statsData, error: statsError } = await supabase.rpc('get_student_stats', {
      student_id: studentId,
    } as any);

    if (statsError) {
      console.error('GetStudentStats error:', statsError);
      return { profile: profile as Profile, stats: { total_activities: 0, total_points: 0, certificates_count: 0 } };
    }

    const stats = Array.isArray(statsData) ? statsData[0] : statsData;

    return {
      profile: profile as Profile,
      stats: {
        total_activities: (stats as any)?.total_activities || 0,
        total_points: (stats as any)?.total_points || 0,
        certificates_count: (stats as any)?.certificates_count || 0,
      },
    };
  } catch (error) {
    console.error('GetStudentWithStats error:', error);
    return null;
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: 'student' | 'faculty' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('UpdateUserRole error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('UpdateUserRole error:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

/**
 * Delete user profile (admin only)
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('DeleteUser error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('DeleteUser error:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

/**
 * Upload user profile photo
 */
export async function uploadProfilePhoto(
  userId: string,
  photoUri: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Convert file URI to blob
    const response = await fetch(photoUri);
    const blob = await response.blob();
    
    const fileName = `${userId}_${Date.now()}.jpg`;
    const filePath = `profile-photos/${userId}/${fileName}`;

    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, blob, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to generate public URL' };
    }

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Update profile error:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('UploadProfilePhoto error:', error);
    return { success: false, error: 'Failed to upload photo' };
  }
}

