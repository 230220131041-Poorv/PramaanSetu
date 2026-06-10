import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Clock, Award, FileText, Plus, Share2, ChevronRight, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

export default function StudentDashboard() {
  const router = useRouter();
  const { user, studentStats, statsLoading, fetchStudentStats, activities, fetchActivities, activitiesLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStudentStats();
    fetchActivities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStudentStats(), fetchActivities()]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Academic data from user profile
  const academicInfo = {
    currentSemester: user?.semester ? `${user.semester}${getOrdinalSuffix(user.semester)}` : '-',
    cgpa: user?.cgpa || 0,
    progress: user?.semester ? Math.round((user.semester / 8) * 100) : 0,
  };

  function getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  // Stats for grid display - using real data
  const statsGrid = [
    {
      label: 'Total Activities',
      value: studentStats?.total_activities ?? 0,
      icon: Activity,
      color: COLORS.primary,
      bgColor: COLORS.primary + '10',
    },
    {
      label: 'Pending Approval',
      value: studentStats?.pending_count ?? 0,
      icon: Clock,
      color: COLORS.warning,
      bgColor: COLORS.warning + '10',
    },
    {
      label: 'Certificates',
      value: studentStats?.certificates_count ?? 0,
      icon: FileText,
      color: COLORS.secondary,
      bgColor: COLORS.secondary + '10',
    },
    {
      label: 'Score Points',
      value: studentStats?.total_points ?? 0,
      icon: Award,
      color: COLORS.success,
      bgColor: COLORS.success + '10',
    },
  ];

  const recentActivities = activities.slice(0, 4);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.studentName}>{user?.full_name || 'Student'}</Text>
          <Text style={styles.studentId}>📚 {user?.enrollment_number || 'Not assigned'}</Text>
        </View>

        {/* Academic Progress Card */}
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.academicCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.academicContent}>
            <View style={styles.academicLeft}>
              <View style={styles.academicBadge}>
                <TrendingUp size={16} color={COLORS.white} />
                <Text style={styles.academicBadgeText}>Current Progress</Text>
              </View>
              <Text style={styles.academicTitle}>Academic Performance</Text>
              <Text style={styles.academicSemester}>Semester {academicInfo.currentSemester}</Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${academicInfo.progress}%` }]} />
                </View>
              </View>
              <Text style={styles.progressText}>{academicInfo.progress}% Complete</Text>
            </View>
            <View style={styles.academicRight}>
              <View style={styles.cgpaContainer}>
                <Text style={styles.cgpaValue}>{academicInfo.cgpa}</Text>
                <Text style={styles.cgpaLabel}>CGPA</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : (
          <View style={styles.statsGridContainer}>
            <Text style={styles.statsTitle}>Your Statistics</Text>
            <View style={styles.statsGrid}>
              {statsGrid.map((stat, index) => (
                <TouchableOpacity key={index} activeOpacity={0.7}>
                  <View style={styles.statCard}>
                    <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                      <stat.icon size={24} color={stat.color} />
                    </View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(student)/activities')}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Plus size={20} color={COLORS.white} />
                <Text style={styles.actionText}>Add Activity</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(student)/portfolio')}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Share2 size={20} color={COLORS.white} />
                <Text style={styles.actionText}>Generate Portfolio</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(student)/activities')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {activitiesLoading ? (
            <LoadingSpinner />
          ) : recentActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Activity size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No activities yet</Text>
              <Text style={styles.emptySubtext}>Start by adding your first activity</Text>
            </View>
          ) : (
            <View style={styles.activitiesList}>
              {recentActivities.map((activity, index) => (
                <TouchableOpacity 
                  key={activity.id} 
                  style={[
                    styles.activityCard,
                    index === recentActivities.length - 1 && styles.lastActivityCard
                  ]}
                >
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {activity.title}
                    </Text>
                    <Text style={styles.activityMeta}>
                      {activity.category.replace('_', ' ')} • {new Date(activity.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          activity.status === 'approved'
                            ? COLORS.success + '15'
                            : activity.status === 'rejected'
                            ? COLORS.error + '15'
                            : COLORS.warning + '15',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            activity.status === 'approved'
                              ? COLORS.success
                              : activity.status === 'rejected'
                              ? COLORS.error
                              : COLORS.warning,
                        },
                      ]}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  studentName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  studentId: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  academicCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  academicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  academicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  academicContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  academicLeft: {
    flex: 1,
  },
  academicTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  academicSemester: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    fontWeight: '600',
  },
  academicRight: {
    alignItems: 'center',
    marginLeft: 20,
  },
  cgpaContainer: {
    alignItems: 'center',
  },
  cgpaValue: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
  },
  cgpaLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  statsGridContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  activitiesList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastActivityCard: {
    borderBottomWidth: 0,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  activityMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    letterSpacing: -0.2,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});
