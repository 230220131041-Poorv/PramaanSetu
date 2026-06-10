// @ts-nocheck - Supabase type definitions incompatible with strict mode
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  ActivityInsert, 
  ActivityUpdate, 
  ActivityWithStudent,
  ActivityCategory,
  ActivityStatus 
} from '@/types/database';

export interface ActivityFilters {
  status?: ActivityStatus;
  category?: ActivityCategory;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface ActivityListResult {
  data: Activity[] | ActivityWithStudent[];
  count: number;
  error?: string;
}

/**
 * Get activities for a student (their own activities)
 */
export async function getStudentActivities(
  studentId: string,
  filters?: ActivityFilters,
  pagination?: PaginationOptions
): Promise<ActivityListResult> {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.startDate) {
      query = query.gte('activity_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('activity_date', filters.endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('GetStudentActivities error:', error);
    return { data: [], count: 0, error: 'Failed to fetch activities' };
  }
}

/**
 * Get all pending activities (for faculty review)
 */
export async function getPendingActivities(
  pagination?: PaginationOptions
): Promise<ActivityListResult> {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('activities')
      .select(`
        *,
        student:profiles!activities_user_id_fkey (
          id,
          full_name,
          enrollment_number,
          department,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('GetPendingActivities error:', error);
    return { data: [], count: 0, error: 'Failed to fetch pending activities' };
  }
}

/**
 * Get all activities (for admin)
 */
export async function getAllActivities(
  filters?: ActivityFilters,
  pagination?: PaginationOptions
): Promise<ActivityListResult> {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('activities')
      .select(`
        *,
        student:profiles!activities_user_id_fkey (
          id,
          full_name,
          enrollment_number,
          department,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.startDate) {
      query = query.gte('activity_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('activity_date', filters.endDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('GetAllActivities error:', error);
    return { data: [], count: 0, error: 'Failed to fetch activities' };
  }
}

/**
 * Get single activity by ID
 */
export async function getActivityById(activityId: string): Promise<Activity | null> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) {
      console.error('GetActivityById error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('GetActivityById error:', error);
    return null;
  }
}

/**
 * Create a new activity (student)
 */
export async function createActivity(
  activity: Omit<ActivityInsert, 'id' | 'created_at' | 'status' | 'points'>
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...activity,
        status: 'pending',
        points: 0,
      } as any)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Activity };
  } catch (error) {
    console.error('CreateActivity error:', error);
    return { success: false, error: 'Failed to create activity' };
  }
}

/**
 * Update an activity (student - only pending)
 */
export async function updateActivity(
  activityId: string,
  updates: Pick<ActivityUpdate, 'title' | 'description' | 'category' | 'activity_date' | 'location' | 'proof_url'>
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  try {
    // @ts-expect-error Supabase types issue
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', activityId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Activity };
  } catch (error) {
    console.error('UpdateActivity error:', error);
    return { success: false, error: 'Failed to update activity' };
  }
}

/**
 * Delete an activity (student - only pending)
 */
export async function deleteActivity(
  activityId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('DeleteActivity error:', error);
    return { success: false, error: 'Failed to delete activity' };
  }
}

/**
 * Approve an activity (faculty)
 */
export async function approveActivity(
  activityId: string,
  facultyId: string,
  points: number
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  try {
    if (points < 1 || points > 100) {
      return { success: false, error: 'Points must be between 1 and 100' };
    }

    const { data, error } = await supabase
      .from('activities')
      .update({
        status: 'approved',
        points,
        approved_by: facultyId,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      } as any)
      .eq('id', activityId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Activity };
  } catch (error) {
    console.error('ApproveActivity error:', error);
    return { success: false, error: 'Failed to approve activity' };
  }
}

/**
 * Reject an activity (faculty)
 */
export async function rejectActivity(
  activityId: string,
  facultyId: string,
  reason: string
): Promise<{ success: boolean; data?: Activity; error?: string }> {
  try {
    if (!reason.trim()) {
      return { success: false, error: 'Rejection reason is required' };
    }

    const { data, error } = await supabase
      .from('activities')
      .update({
        status: 'rejected',
        points: 0,
        approved_by: facultyId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
      } as any)
      .eq('id', activityId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Activity };
  } catch (error) {
    console.error('RejectActivity error:', error);
    return { success: false, error: 'Failed to reject activity' };
  }
}

/**
 * Get recent activities for dashboard
 */
export async function getRecentActivities(
  userId: string,
  limit: number = 5
): Promise<Activity[]> {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('GetRecentActivities error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('GetRecentActivities error:', error);
    return [];
  }
}
