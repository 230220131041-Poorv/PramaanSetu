// Re-export database types for backward compatibility
export * from './database';

// User Roles
export type UserRole = 'student' | 'faculty' | 'admin';

// Activity Status
export type ActivityStatus = 'pending' | 'approved' | 'rejected';

// Activity Categories
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

// Category display names mapping
export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  workshop: 'Workshop',
  competition: 'Competition',
  certification: 'Certification',
  seminar: 'Seminar',
  sports: 'Sports',
  cultural: 'Cultural',
  social_service: 'Social Service',
  internship: 'Internship',
  other: 'Other',
};

// User Profile
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  semester?: number; // Students only
  cgpa?: number; // Students only
  enrollment_number?: string; // Students only
  avatar_url?: string;
  created_at: string;
}

// Activity
export interface Activity {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  activity_date: string;
  location?: string;
  proof_url?: string;
  status: ActivityStatus;
  points: number;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  // Joined fields (when fetching with user info)
  student_name?: string;
  student_email?: string;
  student_department?: string;
  approver_name?: string;
}

// Skill
export interface Skill {
  id: string;
  user_id: string;
  name: string;
  proficiency: number; // 0-100
}

// Achievement
export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date_earned: string;
  icon?: string;
}

// Form States
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  role: 'student' | 'faculty';
}

export interface ActivityFormData {
  title: string;
  description: string;
  category: ActivityCategory;
  activity_date: string;
  location?: string;
  proof_url?: string;
}

export interface StudentProfileFormData {
  full_name: string;
  department: string;
  semester: number;
  cgpa: number;
  avatar_url?: string;
}

export interface FacultyProfileFormData {
  full_name: string;
  department: string;
  avatar_url?: string;
}

export interface ApprovalFormData {
  points: number;
}

export interface RejectionFormData {
  rejection_reason: string;
}

// Stats Types
export interface StudentStats {
  total_activities: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_points: number;
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
  activities_by_category: { category: ActivityCategory; count: number }[];
  top_students: { id: string; name: string; points: number; department: string }[];
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Navigation
export type AuthStackParamList = {
  login: undefined;
  register: undefined;
};

// ===== Portfolio & Sharing Types =====

// Auto-generated portfolio data for export/sharing
export interface PortfolioData {
  user: User;
  skills: Skill[];
  achievements: Achievement[];
  activities: Activity[]; // Approved activities only
  stats: StudentStats;
  generatedAt: string;
  shareableId?: string;
  qrCodeUrl?: string;
  verificationUrl?: string;
}

// Shareable portfolio link
export interface ShareableLink {
  id: string;
  user_id: string;
  short_code: string;
  full_url: string;
  expires_at?: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
}

// Portfolio export options
export type PortfolioExportFormat = 'pdf' | 'web_link' | 'qr_code';

export interface PortfolioExportOptions {
  format: PortfolioExportFormat;
  includeActivities: boolean;
  includeSkills: boolean;
  includeAchievements: boolean;
  includeStats: boolean;
  expiresInDays?: number; // For shareable links
}

// ===== Analytics & Reporting Types =====

// Date range filter for analytics
export interface AnalyticsFilter {
  startDate: string;
  endDate: string;
  department?: string;
  category?: ActivityCategory;
  status?: ActivityStatus;
}

// Trend data for charts
export interface TrendData {
  period: string; // e.g., "2024-01", "Week 1", "Mon"
  label: string; // Display label
  activities_count: number;
  points_awarded: number;
  approvals: number;
  rejections: number;
}

// Department statistics
export interface DepartmentStats {
  department: string;
  student_count: number;
  total_activities: number;
  approved_activities: number;
  total_points: number;
  avg_points_per_student: number;
}

// Faculty performance stats
export interface FacultyPerformanceStats {
  faculty_id: string;
  faculty_name: string;
  department: string;
  total_reviewed: number;
  approved_count: number;
  rejected_count: number;
  avg_response_time_hours: number;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  action: 'approve' | 'reject' | 'create' | 'update' | 'delete' | 'login' | 'export';
  performed_by: string;
  performer_name: string;
  performer_role: UserRole;
  target_type: 'activity' | 'user' | 'portfolio' | 'system';
  target_id?: string;
  target_name?: string;
  details?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

// Report export options
export type ReportFormat = 'csv' | 'pdf' | 'excel';

export interface ReportExportOptions {
  format: ReportFormat;
  filter: AnalyticsFilter;
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
}

// ===== Dynamic Dashboard & Notifications =====

// Notification types
export type NotificationType = 
  | 'activity_approved'
  | 'activity_rejected'
  | 'new_pending'
  | 'achievement_earned'
  | 'points_milestone'
  | 'system_announcement'
  | 'deadline_reminder';

// Notification
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  action_url?: string;
  related_id?: string; // Activity ID, Achievement ID, etc.
  read: boolean;
  created_at: string;
  data?: Record<string, any>; // Additional data for navigation/actions
}

// Academic info for student dashboard
export interface AcademicInfo {
  current_semester: number;
  current_cgpa: number;
  cgpa_history: { semester: number; cgpa: number }[];
  attendance_percentage?: number;
  credits_completed?: number;
  total_credits_required?: number;
}

// Dashboard event/deadline
export type DashboardEventType = 'deadline' | 'event' | 'reminder' | 'holiday';

export interface DashboardEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: DashboardEventType;
  category?: ActivityCategory;
  is_important: boolean;
  location?: string;
}

// Activity feed item (for real-time updates)
export interface ActivityFeedItem {
  id: string;
  type: 'new_activity' | 'status_change' | 'achievement' | 'milestone';
  title: string;
  description: string;
  user_name?: string;
  user_department?: string;
  timestamp: string;
  icon?: string;
  color?: string;
}

// Dashboard widget data
export interface DashboardWidgetData {
  notifications: Notification[];
  unreadCount: number;
  upcomingEvents: DashboardEvent[];
  activityFeed: ActivityFeedItem[];
  academicInfo?: AcademicInfo;
}

// Real-time subscription types
export type RealtimeEventType = 
  | 'activity_created'
  | 'activity_updated'
  | 'notification_created'
  | 'stats_updated';

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
}
