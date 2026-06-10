import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, Activity, Skill, Achievement, Notification, PortfolioData, ShareableLink } from '@/types/database';
import * as authService from '@/services/authService';

// Types
export type UserRole = 'student' | 'faculty' | 'admin';

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
  activities_by_category: Array<{ category: string; count: number }>;
  top_students: Array<{ id: string; full_name: string; department: string; total_points: number; activity_count: number }>;
}

interface AuthContextType {
  // Auth State
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, role: 'student' | 'faculty') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  
  // Activities
  activities: Activity[];
  activitiesLoading: boolean;
  fetchActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'user_id' | 'status' | 'points' | 'created_at' | 'approved_by' | 'approved_at' | 'rejection_reason'>) => Promise<{ success: boolean; error?: string }>;
  deleteActivity: (activityId: string) => Promise<{ success: boolean; error?: string }>;
  approveActivity: (activityId: string, points: number) => Promise<{ success: boolean; error?: string }>;
  rejectActivity: (activityId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  
  // Skills & Achievements
  skills: Skill[];
  achievements: Achievement[];
  skillsLoading: boolean;
  fetchSkills: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  addSkill: (skill: Omit<Skill, 'id' | 'user_id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  updateSkill: (skillId: string, data: Partial<Skill>) => Promise<{ success: boolean; error?: string }>;
  deleteSkill: (skillId: string) => Promise<{ success: boolean; error?: string }>;
  addAchievement: (achievement: Omit<Achievement, 'id' | 'user_id' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  deleteAchievement: (achievementId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Stats
  studentStats: StudentStats;
  facultyStats: FacultyStats;
  adminStats: AdminStats;
  statsLoading: boolean;
  fetchStudentStats: () => Promise<void>;
  fetchFacultyStats: () => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  
  // Pending activities (for faculty)
  pendingActivities: (Activity & { student?: any })[];
  pendingLoading: boolean;
  fetchPendingActivities: () => Promise<void>;
  
  // Faculty review history
  facultyHistory: Activity[];
  historyLoading: boolean;
  fetchFacultyHistory: () => Promise<void>;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Portfolio Export
  exportToPDF: () => Promise<{ success: boolean; error?: string }>;
  exportToCSV: () => Promise<{ success: boolean; error?: string }>;
  previewPDF: () => Promise<{ success: boolean; error?: string }>;
  getPortfolioData: () => Promise<PortfolioData | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default stats values
const defaultStudentStats: StudentStats = {
  total_activities: 0,
  pending_count: 0,
  approved_count: 0,
  rejected_count: 0,
  total_points: 0,
  certificates_count: 0,
};

const defaultFacultyStats: FacultyStats = {
  pending_count: 0,
  approved_today: 0,
  rejected_today: 0,
  total_reviewed: 0,
  total_approved: 0,
  total_rejected: 0,
};

const defaultAdminStats: AdminStats = {
  total_students: 0,
  total_faculty: 0,
  total_activities: 0,
  activities_pending: 0,
  activities_approved: 0,
  activities_rejected: 0,
  total_points_awarded: 0,
  activities_by_category: [],
  top_students: [],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  
  // Skills & Achievements state
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  
  // Stats state
  const [studentStats, setStudentStats] = useState<StudentStats>(defaultStudentStats);
  const [facultyStats, setFacultyStats] = useState<FacultyStats>(defaultFacultyStats);
  const [adminStats, setAdminStats] = useState<AdminStats>(defaultAdminStats);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Faculty specific state
  const [pendingActivities, setPendingActivities] = useState<(Activity & { student?: any })[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [facultyHistory, setFacultyHistory] = useState<Activity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      if (!user) {
        resetState();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Remove real-time notifications subscription
  useEffect(() => {
    // Notifications disabled without database
    return;
  }, [user]);

  const resetState = () => {
    setActivities([]);
    setSkills([]);
    setAchievements([]);
    setStudentStats(defaultStudentStats);
    setFacultyStats(defaultFacultyStats);
    setAdminStats(defaultAdminStats);
    setPendingActivities([]);
    setFacultyHistory([]);
    setNotifications([]);
    setUnreadCount(0);
  };

  // Auth functions
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await authService.signIn({ email, password });
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    fullName: string, 
    role: 'student' | 'faculty'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await authService.signUp({ email, password, full_name: fullName, role });
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      resetState();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    const result = await authService.updateUserProfile(user.id, data);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Refresh profile error:', error);
    }
  };

  // Activities functions (dummy implementations - no database)
  const fetchActivities = async (): Promise<void> => {
    setActivitiesLoading(true);
    try {
      // In demo mode, return empty activities
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const addActivity = async (
    activity: Omit<Activity, 'id' | 'user_id' | 'status' | 'points' | 'created_at' | 'approved_by' | 'approved_at' | 'rejection_reason'>
  ): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Activity management disabled in demo mode' };
  };

  const deleteActivity = async (activityId: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Activity management disabled in demo mode' };
  };

  const approveActivity = async (activityId: string, points: number): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Activity approval disabled in demo mode' };
  };

  const rejectActivity = async (activityId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Activity rejection disabled in demo mode' };
  };

  // Skills functions (dummy implementations - no database)
  const fetchSkills = async (): Promise<void> => {
    setSkillsLoading(true);
    try {
      setSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  };

  const addSkill = async (
    skill: Omit<Skill, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Skill management disabled in demo mode' };
  };

  const updateSkill = async (skillId: string, data: Partial<Skill>): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Skill management disabled in demo mode' };
  };

  const deleteSkill = async (skillId: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Skill management disabled in demo mode' };
  };

  const fetchAchievements = async (): Promise<void> => {
    setSkillsLoading(true);
    try {
      setAchievements([]);
    } finally {
      setSkillsLoading(false);
    }
  };

  const addAchievement = async (
    achievement: Omit<Achievement, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Achievement management disabled in demo mode' };
  };

  const deleteAchievement = async (achievementId: string): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Achievement management disabled in demo mode' };
  };

  // Stats functions (dummy implementations - no database)
  const fetchStudentStats = async (): Promise<void> => {
    setStatsLoading(true);
    try {
      setStudentStats(defaultStudentStats);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFacultyStats = async (): Promise<void> => {
    setStatsLoading(true);
    try {
      setFacultyStats(defaultFacultyStats);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAdminStats = async (): Promise<void> => {
    setStatsLoading(true);
    try {
      setAdminStats(defaultAdminStats);
    } finally {
      setStatsLoading(false);
    }
  };

  // Faculty review functions (dummy implementations - no database)
  const fetchPendingActivities = async (): Promise<void> => {
    setPendingLoading(true);
    try {
      setPendingActivities([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchFacultyHistory = async (): Promise<void> => {
    setHistoryLoading(true);
    try {
      setFacultyHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Notification functions (dummy implementations - no database)
  const fetchNotifications = async (): Promise<void> => {
    setNotificationsLoading(true);
    try {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationRead = async (notificationId: string): Promise<void> => {
    // In demo mode, do nothing
  };

  const markAllNotificationsRead = async (): Promise<void> => {
    // In demo mode, do nothing
  };

  // Portfolio export functions (dummy implementations - no database)
  const exportToPDF = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'PDF export disabled in demo mode' };
  };

  const exportToCSV = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'CSV export disabled in demo mode' };
  };

  const previewPDF = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'PDF preview disabled in demo mode' };
  };

  const getPortfolioData = async (): Promise<PortfolioData | null> => {
    return null;
  };

  // Remove old Supabase-based implementations (keeping dummy versions above)

  return (
    <AuthContext.Provider
      value={{
        // Auth State
        user,
        isLoading,
        isAuthenticated: !!user,
        
        // Auth Actions
        login,
        register,
        logout,
        updateProfile,
        refreshProfile,
        
        // Activities
        activities,
        activitiesLoading,
        fetchActivities,
        addActivity,
        deleteActivity,
        approveActivity,
        rejectActivity,
        
        // Skills & Achievements
        skills,
        achievements,
        skillsLoading,
        fetchSkills,
        fetchAchievements,
        addSkill,
        updateSkill,
        deleteSkill,
        addAchievement,
        deleteAchievement,
        
        // Stats
        studentStats,
        facultyStats,
        adminStats,
        statsLoading,
        fetchStudentStats,
        fetchFacultyStats,
        fetchAdminStats,
        
        // Pending activities (faculty)
        pendingActivities,
        pendingLoading,
        fetchPendingActivities,
        
        // Faculty history
        facultyHistory,
        historyLoading,
        fetchFacultyHistory,

        // Notifications
        notifications,
        unreadCount,
        notificationsLoading,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,

        // Portfolio Export
        exportToPDF,
        exportToCSV,
        previewPDF,
        getPortfolioData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
