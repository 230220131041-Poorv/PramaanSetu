import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Activity, Skill, Achievement, StudentStats, FacultyStats, AdminStats, ActivityCategory, Notification, PortfolioData, ShareableLink } from '@/types';

interface AuthContextType {
  // Auth State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Auth Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, role: 'student' | 'faculty') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  
  // Dev login for testing UI (remove in production)
  devLogin: (role: UserRole) => void;
  
  // Activities
  activities: Activity[];
  activitiesLoading: boolean;
  fetchActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'user_id' | 'status' | 'points' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  deleteActivity: (activityId: string) => Promise<{ success: boolean; error?: string }>;
  approveActivity: (activityId: string, points: number) => Promise<{ success: boolean; error?: string }>;
  rejectActivity: (activityId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  
  // Skills & Achievements
  skills: Skill[];
  achievements: Achievement[];
  skillsLoading: boolean;
  fetchSkills: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  addSkill: (skill: Omit<Skill, 'id' | 'user_id'>) => Promise<{ success: boolean; error?: string }>;
  updateSkill: (skillId: string, data: Partial<Skill>) => Promise<{ success: boolean; error?: string }>;
  deleteSkill: (skillId: string) => Promise<{ success: boolean; error?: string }>;
  addAchievement: (achievement: Omit<Achievement, 'id' | 'user_id'>) => Promise<{ success: boolean; error?: string }>;
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
  pendingActivities: Activity[];
  pendingLoading: boolean;
  fetchPendingActivities: () => Promise<void>;
  
  // Approved/Rejected by faculty
  facultyHistory: Activity[];
  historyLoading: boolean;
  fetchFacultyHistory: () => Promise<void>;

  // Notifications (for all users)
  notifications: Notification[];
  notificationsLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Portfolio & Sharing (for students)
  generatePortfolioPDF: () => Promise<{ success: boolean; uri?: string; error?: string }>;
  createShareableLink: (expiryDays?: number) => Promise<{ success: boolean; link?: ShareableLink; error?: string }>;
  getPortfolioData: () => PortfolioData | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default stats values
const defaultStudentStats: StudentStats = {
  total_activities: 0,
  pending_count: 0,
  approved_count: 0,
  rejected_count: 0,
  total_points: 0,
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
  const [user, setUser] = useState<User | null>(null);
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
  const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [facultyHistory, setFacultyHistory] = useState<Activity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // TODO: Replace with Supabase session check
        // const { data: { session } } = await supabase.auth.getSession();
        // if (session?.user) {
        //   const { data: profile } = await supabase
        //     .from('profiles')
        //     .select('*')
        //     .eq('id', session.user.id)
        //     .single();
        //   setUser(profile);
        // }
        setIsLoading(false);
      } catch (error) {
        console.error('Session check error:', error);
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Auth functions
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // TODO: Replace with Supabase auth
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // });
      // if (error) throw error;
      // 
      // const { data: profile } = await supabase
      //   .from('profiles')
      //   .select('*')
      //   .eq('id', data.user.id)
      //   .single();
      // 
      // setUser(profile);
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred during login' };
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
      // TODO: Replace with Supabase auth
      // const { data, error } = await supabase.auth.signUp({
      //   email,
      //   password,
      //   options: {
      //     data: {
      //       full_name: fullName,
      //       role: role,
      //     }
      //   }
      // });
      // if (error) throw error;
      // 
      // // Profile is auto-created via database trigger
      // const { data: profile } = await supabase
      //   .from('profiles')
      //   .select('*')
      //   .eq('id', data.user.id)
      //   .single();
      // 
      // setUser(profile);
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'An error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // TODO: Replace with Supabase auth
      // await supabase.auth.signOut();
      setUser(null);
      setActivities([]);
      setSkills([]);
      setAchievements([]);
      setStudentStats(defaultStudentStats);
      setFacultyStats(defaultFacultyStats);
      setAdminStats(defaultAdminStats);
      setPendingActivities([]);
      setFacultyHistory([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // DEV LOGIN - For testing UI without backend (REMOVE IN PRODUCTION)
  const devLogin = (role: UserRole) => {
    const mockUsers: Record<UserRole, User> = {
      student: {
        id: 'dev-student-1',
        email: 'student@test.com',
        full_name: 'John Student',
        role: 'student',
        enrollment_number: 'STU2024001',
        department: 'Computer Science',
        semester: 5,
        cgpa: 8.5,
        created_at: new Date().toISOString(),
      },
      faculty: {
        id: 'dev-faculty-1',
        email: 'faculty@test.com',
        full_name: 'Dr. Sarah Faculty',
        role: 'faculty',
        enrollment_number: 'FAC2020001',
        department: 'Computer Science',
        created_at: new Date().toISOString(),
      },
      admin: {
        id: 'dev-admin-1',
        email: 'admin@test.com',
        full_name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
    };
    setUser(mockUsers[role]);
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase update
      // const { error } = await supabase
      //   .from('profiles')
      //   .update(data)
      //   .eq('id', user.id);
      // 
      // if (error) throw error;
      // setUser({ ...user, ...data });
      // return { success: true };
      
      // DEV MODE: Update locally
      setUser({ ...user, ...data });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  };

  // Activities functions
  const fetchActivities = async (): Promise<void> => {
    if (!user) return;
    setActivitiesLoading(true);
    try {
      // TODO: Replace with Supabase fetch
      // let query = supabase.from('activities').select('*');
      // 
      // if (user.role === 'student') {
      //   query = query.eq('user_id', user.id);
      // }
      // 
      // const { data, error } = await query.order('created_at', { ascending: false });
      // if (error) throw error;
      // setActivities(data || []);
    } catch (error) {
      console.error('Fetch activities error:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const addActivity = async (
    activity: Omit<Activity, 'id' | 'user_id' | 'status' | 'points' | 'created_at'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase insert
      // const { data, error } = await supabase
      //   .from('activities')
      //   .insert({
      //     ...activity,
      //     user_id: user.id,
      //     status: 'pending',
      //     points: 0,
      //   })
      //   .select()
      //   .single();
      // 
      // if (error) throw error;
      // setActivities(prev => [data, ...prev]);
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add activity' };
    }
  };

  const deleteActivity = async (activityId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase delete
      // const { error } = await supabase
      //   .from('activities')
      //   .delete()
      //   .eq('id', activityId)
      //   .eq('user_id', user.id)
      //   .eq('status', 'pending');
      // 
      // if (error) throw error;
      // setActivities(prev => prev.filter(a => a.id !== activityId));
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete activity' };
    }
  };

  const approveActivity = async (activityId: string, points: number): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || user.role !== 'faculty') {
        return { success: false, error: 'Not authorized' };
      }
      
      if (points < 1 || points > 100) {
        return { success: false, error: 'Points must be between 1 and 100' };
      }
      
      // TODO: Replace with Supabase update
      // const { error } = await supabase
      //   .from('activities')
      //   .update({
      //     status: 'approved',
      //     points,
      //     approved_by: user.id,
      //     approved_at: new Date().toISOString(),
      //   })
      //   .eq('id', activityId);
      // 
      // if (error) throw error;
      // 
      // // Refresh pending activities
      // await fetchPendingActivities();
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to approve activity' };
    }
  };

  const rejectActivity = async (activityId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user || user.role !== 'faculty') {
        return { success: false, error: 'Not authorized' };
      }
      
      if (!reason.trim()) {
        return { success: false, error: 'Rejection reason is required' };
      }
      
      // TODO: Replace with Supabase update
      // const { error } = await supabase
      //   .from('activities')
      //   .update({
      //     status: 'rejected',
      //     rejection_reason: reason,
      //     approved_by: user.id,
      //     approved_at: new Date().toISOString(),
      //   })
      //   .eq('id', activityId);
      // 
      // if (error) throw error;
      // 
      // // Refresh pending activities
      // await fetchPendingActivities();
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to reject activity' };
    }
  };

  // Skills functions
  const fetchSkills = async (): Promise<void> => {
    if (!user) return;
    setSkillsLoading(true);
    try {
      // TODO: Replace with Supabase fetch
      // const { data, error } = await supabase
      //   .from('skills')
      //   .select('*')
      //   .eq('user_id', user.id);
      // 
      // if (error) throw error;
      // setSkills(data || []);
    } catch (error) {
      console.error('Fetch skills error:', error);
    } finally {
      setSkillsLoading(false);
    }
  };

  const fetchAchievements = async (): Promise<void> => {
    if (!user) return;
    try {
      // TODO: Replace with Supabase fetch
      // const { data, error } = await supabase
      //   .from('achievements')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('date_earned', { ascending: false });
      // 
      // if (error) throw error;
      // setAchievements(data || []);
    } catch (error) {
      console.error('Fetch achievements error:', error);
    }
  };

  const addSkill = async (skill: Omit<Skill, 'id' | 'user_id'>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase insert
      // const { data, error } = await supabase
      //   .from('skills')
      //   .insert({ ...skill, user_id: user.id })
      //   .select()
      //   .single();
      // 
      // if (error) throw error;
      // setSkills(prev => [...prev, data]);
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add skill' };
    }
  };

  const updateSkill = async (skillId: string, data: Partial<Skill>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase update
      // const { error } = await supabase
      //   .from('skills')
      //   .update(data)
      //   .eq('id', skillId)
      //   .eq('user_id', user.id);
      // 
      // if (error) throw error;
      // setSkills(prev => prev.map(s => s.id === skillId ? { ...s, ...data } : s));
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update skill' };
    }
  };

  const deleteSkill = async (skillId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase delete
      // const { error } = await supabase
      //   .from('skills')
      //   .delete()
      //   .eq('id', skillId)
      //   .eq('user_id', user.id);
      // 
      // if (error) throw error;
      // setSkills(prev => prev.filter(s => s.id !== skillId));
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete skill' };
    }
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id' | 'user_id'>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase insert
      // const { data, error } = await supabase
      //   .from('achievements')
      //   .insert({ ...achievement, user_id: user.id })
      //   .select()
      //   .single();
      // 
      // if (error) throw error;
      // setAchievements(prev => [data, ...prev]);
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add achievement' };
    }
  };

  const deleteAchievement = async (achievementId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) return { success: false, error: 'Not authenticated' };
      
      // TODO: Replace with Supabase delete
      // const { error } = await supabase
      //   .from('achievements')
      //   .delete()
      //   .eq('id', achievementId)
      //   .eq('user_id', user.id);
      // 
      // if (error) throw error;
      // setAchievements(prev => prev.filter(a => a.id !== achievementId));
      // return { success: true };
      
      return { success: false, error: 'Backend not connected. Please setup Supabase.' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to delete achievement' };
    }
  };

  // Stats functions
  const fetchStudentStats = async (): Promise<void> => {
    if (!user || user.role !== 'student') return;
    setStatsLoading(true);
    try {
      // TODO: Replace with Supabase RPC or aggregation
      // const { data, error } = await supabase.rpc('get_student_stats', { student_id: user.id });
      // if (error) throw error;
      // setStudentStats(data);
    } catch (error) {
      console.error('Fetch student stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchFacultyStats = async (): Promise<void> => {
    if (!user || user.role !== 'faculty') return;
    setStatsLoading(true);
    try {
      // TODO: Replace with Supabase RPC or aggregation
      // const { data, error } = await supabase.rpc('get_faculty_stats', { faculty_id: user.id });
      // if (error) throw error;
      // setFacultyStats(data);
    } catch (error) {
      console.error('Fetch faculty stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAdminStats = async (): Promise<void> => {
    if (!user || user.role !== 'admin') return;
    setStatsLoading(true);
    try {
      // TODO: Replace with Supabase RPC or aggregation
      // const { data, error } = await supabase.rpc('get_admin_stats');
      // if (error) throw error;
      // setAdminStats(data);
    } catch (error) {
      console.error('Fetch admin stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Faculty specific functions
  const fetchPendingActivities = async (): Promise<void> => {
    if (!user || user.role !== 'faculty') return;
    setPendingLoading(true);
    try {
      // TODO: Replace with Supabase fetch with join
      // const { data, error } = await supabase
      //   .from('activities')
      //   .select(`
      //     *,
      //     profiles:user_id (full_name, email, department)
      //   `)
      //   .eq('status', 'pending')
      //   .order('created_at', { ascending: false });
      // 
      // if (error) throw error;
      // setPendingActivities(data || []);
    } catch (error) {
      console.error('Fetch pending activities error:', error);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchFacultyHistory = async (): Promise<void> => {
    if (!user || user.role !== 'faculty') return;
    setHistoryLoading(true);
    try {
      // TODO: Replace with Supabase fetch
      // const { data, error } = await supabase
      //   .from('activities')
      //   .select(`
      //     *,
      //     profiles:user_id (full_name, email, department)
      //   `)
      //   .eq('approved_by', user.id)
      //   .neq('status', 'pending')
      //   .order('approved_at', { ascending: false });
      // 
      // if (error) throw error;
      // setFacultyHistory(data || []);
    } catch (error) {
      console.error('Fetch faculty history error:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ===== Notifications Functions =====
  const fetchNotifications = async (): Promise<void> => {
    if (!user) return;
    setNotificationsLoading(true);
    try {
      // TODO: Replace with Supabase fetch
      // const { data, error } = await supabase
      //   .from('notifications')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('created_at', { ascending: false })
      //   .limit(50);
      // 
      // if (error) throw error;
      // setNotifications(data || []);
      
      // Mock notifications for testing
      setNotifications([]);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationRead = async (notificationId: string): Promise<void> => {
    try {
      // TODO: Replace with Supabase update
      // const { error } = await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .eq('id', notificationId);
      // 
      // if (error) throw error;
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Mark notification read error:', error);
    }
  };

  const markAllNotificationsRead = async (): Promise<void> => {
    if (!user) return;
    try {
      // TODO: Replace with Supabase update
      // const { error } = await supabase
      //   .from('notifications')
      //   .update({ read: true })
      //   .eq('user_id', user.id)
      //   .eq('read', false);
      // 
      // if (error) throw error;
      
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Mark all notifications read error:', error);
    }
  };

  // ===== Portfolio & Sharing Functions =====
  const getPortfolioData = (): PortfolioData | null => {
    if (!user || user.role !== 'student') return null;
    
    const approvedActivities = activities.filter(a => a.status === 'approved');
    const totalPoints = approvedActivities.reduce((sum, a) => sum + (a.points || 0), 0);
    
    return {
      user,
      skills,
      achievements,
      activities: approvedActivities,
      stats: {
        ...studentStats,
        total_points: totalPoints,
      },
      generatedAt: new Date().toISOString(),
    };
  };

  const generatePortfolioPDF = async (): Promise<{ success: boolean; uri?: string; error?: string }> => {
    if (!user || user.role !== 'student') {
      return { success: false, error: 'Only students can generate portfolio' };
    }
    
    try {
      // TODO: Implement PDF generation using expo-print
      // const portfolioData = getPortfolioData();
      // const html = generatePortfolioHTML(portfolioData);
      // const { uri } = await Print.printToFileAsync({ html });
      // return { success: true, uri };
      
      // For now, return mock success
      console.log('Portfolio PDF generation - Backend TODO');
      return { success: false, error: 'PDF generation not yet implemented' };
    } catch (error) {
      console.error('Generate portfolio PDF error:', error);
      return { success: false, error: 'Failed to generate PDF' };
    }
  };

  const createShareableLink = async (expiryDays: number = 30): Promise<{ success: boolean; link?: ShareableLink; error?: string }> => {
    if (!user || user.role !== 'student') {
      return { success: false, error: 'Only students can create shareable links' };
    }
    
    try {
      // TODO: Replace with Supabase insert and URL generation
      // const linkId = generateUniqueId();
      // const expiryDate = new Date();
      // expiryDate.setDate(expiryDate.getDate() + expiryDays);
      // 
      // const { data, error } = await supabase
      //   .from('shareable_links')
      //   .insert({
      //     user_id: user.id,
      //     link_id: linkId,
      //     expires_at: expiryDate.toISOString(),
      //   })
      //   .select()
      //   .single();
      // 
      // if (error) throw error;
      // 
      // return {
      //   success: true,
      //   link: {
      //     ...data,
      //     url: `https://portfolio.studentportal.edu/${linkId}`,
      //   }
      // };
      
      // For now, return mock success
      console.log('Shareable link creation - Backend TODO');
      return { success: false, error: 'Link creation not yet implemented' };
    } catch (error) {
      console.error('Create shareable link error:', error);
      return { success: false, error: 'Failed to create shareable link' };
    }
  };

  const value: AuthContextType = {
    // Auth
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    devLogin,
    
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
    
    // Faculty specific
    pendingActivities,
    pendingLoading,
    fetchPendingActivities,
    facultyHistory,
    historyLoading,
    fetchFacultyHistory,

    // Notifications
    notifications,
    notificationsLoading,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Portfolio & Sharing
    generatePortfolioPDF,
    createShareableLink,
    getPortfolioData,
  };

  return (
    <AuthContext.Provider value={value}>
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
