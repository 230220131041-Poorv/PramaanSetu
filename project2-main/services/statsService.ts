import { supabase } from '@/lib/supabase';

export interface StudentStats {
  total_activities: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_points: number;
  certificates_count: number;
}

export interface FacultyStats {
  pending_count: number;
  approved_today: number;
  rejected_today: number;
  total_reviewed: number;
  total_approved: number;
  total_rejected: number;
}

export interface AdminStats {
  total_students: number;
  total_faculty: number;
  total_activities: number;
  activities_pending: number;
  activities_approved: number;
  activities_rejected: number;
  total_points_awarded: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
}

export interface TopStudent {
  id: string;
  full_name: string;
  department: string;
  total_points: number;
  activity_count: number;
}

/**
 * Get statistics for a student
 */
export async function getStudentStats(studentId: string): Promise<StudentStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_student_stats', {
      student_id: studentId,
    } as any);

    if (error) {
      console.error('GetStudentStats error:', error);
      return null;
    }

    // Function returns an array, take first item
    const stats = Array.isArray(data) ? data[0] : data;
    return stats as StudentStats;
  } catch (error) {
    console.error('GetStudentStats error:', error);
    return null;
  }
}

/**
 * Get statistics for a faculty member
 */
export async function getFacultyStats(facultyId: string): Promise<FacultyStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_faculty_stats', {
      faculty_id: facultyId,
    } as any);

    if (error) {
      console.error('GetFacultyStats error:', error);
      return null;
    }

    const stats = Array.isArray(data) ? data[0] : data;
    return stats as FacultyStats;
  } catch (error) {
    console.error('GetFacultyStats error:', error);
    return null;
  }
}

/**
 * Get statistics for admin dashboard
 */
export async function getAdminStats(): Promise<AdminStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_admin_stats');

    if (error) {
      console.error('GetAdminStats error:', error);
      return null;
    }

    const stats = Array.isArray(data) ? data[0] : data;
    return stats as AdminStats;
  } catch (error) {
    console.error('GetAdminStats error:', error);
    return null;
  }
}

/**
 * Get activities breakdown by category
 */
export async function getActivitiesByCategory(): Promise<CategoryBreakdown[]> {
  try {
    const { data, error } = await supabase.rpc('get_activities_by_category');

    if (error) {
      console.error('GetActivitiesByCategory error:', error);
      return [];
    }

    return (data || []) as CategoryBreakdown[];
  } catch (error) {
    console.error('GetActivitiesByCategory error:', error);
    return [];
  }
}

/**
 * Get top students by points
 */
export async function getTopStudents(limit: number = 5): Promise<TopStudent[]> {
  try {
    const { data, error } = await supabase.rpc('get_top_students', {
      limit_count: limit,
    } as any);

    if (error) {
      console.error('GetTopStudents error:', error);
      return [];
    }

    return (data || []) as TopStudent[];
  } catch (error) {
    console.error('GetTopStudents error:', error);
    return [];
  }
}

/**
 * Get activity trends for analytics (monthly data)
 */
export async function getActivityTrends(
  months: number = 6,
  userId?: string
): Promise<{ month: string; count: number; points: number }[]> {
  try {
    let query = supabase
      .from('activities')
      .select('created_at, points, status')
      .eq('status', 'approved')
      .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('GetActivityTrends error:', error);
      return [];
    }

    // Group by month
    const monthlyData: Record<string, { count: number; points: number }> = {};

    ((data || []) as any[]).forEach((activity) => {
      const month = new Date(activity.created_at).toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });

      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, points: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].points += activity.points;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      points: data.points,
    }));
  } catch (error) {
    console.error('GetActivityTrends error:', error);
    return [];
  }
}

/**
 * Get department-wise statistics (admin)
 */
export async function getDepartmentStats(): Promise<
  { department: string; students: number; activities: number; points: number }[]
> {
  try {
    // Get students per department
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('department')
      .eq('role', 'student')
      .not('department', 'is', null);

    if (profileError) {
      console.error('GetDepartmentStats profile error:', profileError);
      return [];
    }

    // Get activities and points per user
    const { data: activityData, error: activityError } = await supabase
      .from('activities')
      .select(`
        user_id,
        points,
        profiles!activities_user_id_fkey (
          department
        )
      `)
      .eq('status', 'approved');

    if (activityError) {
      console.error('GetDepartmentStats activity error:', activityError);
      return [];
    }

    // Aggregate by department
    const deptStats: Record<string, { students: Set<string>; activities: number; points: number }> = {};

    // Count students per department
    ((profileData || []) as any[]).forEach((profile) => {
      if (profile.department) {
        if (!deptStats[profile.department]) {
          deptStats[profile.department] = { students: new Set(), activities: 0, points: 0 };
        }
      }
    });

    // Count activities and points
    (activityData || []).forEach((activity: any) => {
      const dept = activity.profiles?.department;
      if (dept) {
        if (!deptStats[dept]) {
          deptStats[dept] = { students: new Set(), activities: 0, points: 0 };
        }
        deptStats[dept].students.add(activity.user_id);
        deptStats[dept].activities++;
        deptStats[dept].points += activity.points;
      }
    });

    return Object.entries(deptStats).map(([department, data]) => ({
      department,
      students: data.students.size,
      activities: data.activities,
      points: data.points,
    }));
  } catch (error) {
    console.error('GetDepartmentStats error:', error);
    return [];
  }
}
