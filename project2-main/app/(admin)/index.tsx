import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, GraduationCap, UserCog, Activity, CheckCircle, XCircle, Clock, Trophy, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const { user, adminStats, statsLoading, fetchAdminStats } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdminStats();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Stats grid - using real data
  const statsGrid = [
    {
      label: 'Total Students',
      value: adminStats.total_students ?? 0,
      icon: GraduationCap,
      color: COLORS.primary,
      bgColor: COLORS.primary + '10',
    },
    {
      label: 'Total Faculty',
      value: adminStats.total_faculty ?? 0,
      icon: UserCog,
      color: COLORS.secondary,
      bgColor: COLORS.secondary + '10',
    },
    {
      label: 'Total Activities',
      value: adminStats.total_activities ?? 0,
      icon: Activity,
      color: COLORS.success,
      bgColor: COLORS.success + '10',
    },
    {
      label: 'Points Awarded',
      value: adminStats.total_points_awarded ?? 0,
      icon: Trophy,
      color: COLORS.warning,
      bgColor: COLORS.warning + '10',
    },
  ];

  // Activity status breakdown - using real data
  const activityStats = [
    {
      label: 'Pending',
      value: adminStats.activities_pending ?? 0,
      color: COLORS.warning,
    },
    {
      label: 'Approved',
      value: adminStats.activities_approved ?? 0,
      color: COLORS.success,
    },
    {
      label: 'Rejected',
      value: adminStats.activities_rejected ?? 0,
      color: COLORS.error,
    },
  ];

  const totalActivities = activityStats.reduce((sum, s) => sum + s.value, 0);

  // Top performers - using real data only
  const topStudents = adminStats.top_students?.slice(0, 5) ?? [];

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
          <Text style={styles.adminName}>{user?.full_name || 'Administrator'}</Text>
          <Text style={styles.adminRole}>⚙️ System Administrator</Text>
        </View>

        {/* Overview Card */}
        <LinearGradient
          colors={['#7C3AED', '#8B5CF6']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.overviewContent}>
            <View style={styles.overviewLeft}>
              <Text style={styles.overviewTitle}>Institution Overview</Text>
              <Text style={styles.overviewSubtitle}>Academic Year 2024-25</Text>
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{adminStats.total_students ?? 0}</Text>
                  <Text style={styles.overviewStatLabel}>Students</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{adminStats.total_faculty ?? 0}</Text>
                  <Text style={styles.overviewStatLabel}>Faculty</Text>
                </View>
              </View>
            </View>
            <View style={styles.overviewRight}>
              <Users size={48} color="rgba(255,255,255,0.3)" />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {statsGrid.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                  <stat.icon size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Activity Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity Status</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View Details</Text>
              <ChevronRight size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statusCard}>
            {/* Progress Bar */}
            <View style={styles.progressBarFull}>
              {activityStats.map((stat, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    {
                      width: `${(stat.value / totalActivities) * 100}%`,
                      backgroundColor: stat.color,
                      borderTopLeftRadius: index === 0 ? 4 : 0,
                      borderBottomLeftRadius: index === 0 ? 4 : 0,
                      borderTopRightRadius: index === activityStats.length - 1 ? 4 : 0,
                      borderBottomRightRadius: index === activityStats.length - 1 ? 4 : 0,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Status Items */}
            <View style={styles.statusItems}>
              {activityStats.map((stat, index) => (
                <View key={index} style={styles.statusItem}>
                  <View style={styles.statusDot}>
                    <View style={[styles.dot, { backgroundColor: stat.color }]} />
                  </View>
                  <View style={styles.statusInfo}>
                    <Text style={styles.statusLabel}>{stat.label}</Text>
                    <Text style={styles.statusValue}>{stat.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.performersList}>
            {topStudents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No top performers yet</Text>
              </View>
            ) : (
              topStudents.map((student, index) => (
                <View
                  key={student.id}
                  style={[
                    styles.performerCard,
                    index === topStudents.length - 1 && styles.lastPerformerCard,
                  ]}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>{student.full_name}</Text>
                    <Text style={styles.performerDept}>{student.department || 'Department'}</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Trophy size={14} color={COLORS.warning} />
                    <Text style={styles.pointsText}>{student.total_points}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(admin)/users')}
            >
              <LinearGradient
                colors={['#7C3AED', '#8B5CF6']}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Users size={20} color={COLORS.white} />
                <Text style={styles.actionText}>Manage Users</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(admin)/analytics')}
            >
              <View style={styles.actionSecondary}>
                <Activity size={20} color={COLORS.primary} />
                <Text style={styles.actionSecondaryText}>View Reports</Text>
              </View>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  userRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  overviewCard: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLeft: {
    flex: 1,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  overviewSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  overviewStats: {
    flexDirection: 'row',
    marginTop: 16,
  },
  overviewStat: {
    marginRight: 24,
  },
  overviewStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  overviewStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 24,
  },
  overviewRight: {
    opacity: 0.5,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: (screenWidth - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 24,
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
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressBarFull: {
    height: 8,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressSegment: {
    height: '100%',
  },
  statusItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    marginRight: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusInfo: {},
  statusLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  performersList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  performerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastPerformerCard: {
    borderBottomWidth: 0,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  performerDept: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.warning,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  actionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  actionSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bottomPadding: {
    height: 20,
  },
});
