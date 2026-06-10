export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'faculty' | 'admin';

export type ActivityCategory = 
  | 'workshop'
  | 'competition'
  | 'certification'
  | 'seminar'
  | 'sports'
  | 'cultural'
  | 'social_service'
  | 'internship'
  | 'other';

export type ActivityStatus = 'pending' | 'approved' | 'rejected';

export type NotificationType =
  | 'activity_approved'
  | 'activity_rejected'
  | 'new_pending'
  | 'achievement_earned'
  | 'points_milestone'
  | 'system_announcement'
  | 'deadline_reminder';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          department: string | null;
          semester: number | null;
          cgpa: number | null;
          enrollment_number: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          department?: string | null;
          semester?: number | null;
          cgpa?: number | null;
          enrollment_number?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          department?: string | null;
          semester?: number | null;
          cgpa?: number | null;
          enrollment_number?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: ActivityCategory;
          activity_date: string;
          location: string | null;
          proof_url: string;
          status: ActivityStatus;
          points: number;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          category: ActivityCategory;
          activity_date: string;
          location?: string | null;
          proof_url: string;
          status?: ActivityStatus;
          points?: number;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          category?: ActivityCategory;
          activity_date?: string;
          location?: string | null;
          proof_url?: string;
          status?: ActivityStatus;
          points?: number;
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          proficiency: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          proficiency: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          proficiency?: number;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          date_earned: string;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          date_earned: string;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          date_earned?: string;
          icon?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          icon: string | null;
          action_url: string | null;
          related_id: string | null;
          read: boolean;
          data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          icon?: string | null;
          action_url?: string | null;
          related_id?: string | null;
          read?: boolean;
          data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          icon?: string | null;
          action_url?: string | null;
          related_id?: string | null;
          read?: boolean;
          data?: Json | null;
          created_at?: string;
        };
      };
      shareable_links: {
        Row: {
          id: string;
          user_id: string;
          short_code: string;
          full_url: string;
          expires_at: string | null;
          is_public: boolean;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          short_code: string;
          full_url: string;
          expires_at?: string | null;
          is_public?: boolean;
          view_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          short_code?: string;
          full_url?: string;
          expires_at?: string | null;
          is_public?: boolean;
          view_count?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_student_stats: {
        Args: { student_id: string };
        Returns: {
          total_activities: number;
          pending_count: number;
          approved_count: number;
          rejected_count: number;
          total_points: number;
          certificates_count: number;
        };
      };
      get_faculty_stats: {
        Args: { faculty_id: string };
        Returns: {
          pending_count: number;
          approved_today: number;
          rejected_today: number;
          total_reviewed: number;
          total_approved: number;
          total_rejected: number;
        };
      };
      get_admin_stats: {
        Args: Record<string, never>;
        Returns: {
          total_students: number;
          total_faculty: number;
          total_activities: number;
          activities_pending: number;
          activities_approved: number;
          activities_rejected: number;
          total_points_awarded: number;
        };
      };
      get_activities_by_category: {
        Args: Record<string, never>;
        Returns: Array<{
          category: ActivityCategory;
          count: number;
        }>;
      };
      get_top_students: {
        Args: { limit_count: number };
        Returns: Array<{
          id: string;
          full_name: string;
          department: string;
          total_points: number;
          activity_count: number;
        }>;
      };
      get_portfolio_data: {
        Args: { student_id: string };
        Returns: {
          profile: Database['public']['Tables']['profiles']['Row'];
          activities: Database['public']['Tables']['activities']['Row'][];
          skills: Database['public']['Tables']['skills']['Row'][];
          achievements: Database['public']['Tables']['achievements']['Row'][];
          stats: {
            total_activities: number;
            total_points: number;
            certificates_count: number;
          };
        };
      };
    };
    Enums: {
      user_role: UserRole;
      activity_category: ActivityCategory;
      activity_status: ActivityStatus;
      notification_type: NotificationType;
    };
  };
}

// Helper types for easier access
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Activity = Database['public']['Tables']['activities']['Row'];
export type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
export type ActivityUpdate = Database['public']['Tables']['activities']['Update'];

export type Skill = Database['public']['Tables']['skills']['Row'];
export type SkillInsert = Database['public']['Tables']['skills']['Insert'];
export type SkillUpdate = Database['public']['Tables']['skills']['Update'];

export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type AchievementInsert = Database['public']['Tables']['achievements']['Insert'];
export type AchievementUpdate = Database['public']['Tables']['achievements']['Update'];

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type ShareableLink = Database['public']['Tables']['shareable_links']['Row'];
export type ShareableLinkInsert = Database['public']['Tables']['shareable_links']['Insert'];
export type ShareableLinkUpdate = Database['public']['Tables']['shareable_links']['Update'];

// Activity with joined profile data (for faculty review list)
export type ActivityWithStudent = Activity & {
  student: Pick<Profile, 'id' | 'full_name' | 'enrollment_number' | 'department' | 'avatar_url'>;
};

// Portfolio data structure for export
export interface PortfolioData {
  profile: Profile;
  activities: Activity[];
  skills: Skill[];
  achievements: Achievement[];
  stats: {
    total_activities: number;
    total_points: number;
    certificates_count: number;
    approved_activities: number;
    category_breakdown: Record<ActivityCategory, number>;
  };
  generated_at: string;
}
