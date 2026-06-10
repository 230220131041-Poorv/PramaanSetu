import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ClipboardCheck, CheckCircle, XCircle, Clock, TrendingUp, ChevronRight, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

export default function FacultyDashboard() {
  const router = useRouter();
  const { user, facultyStats, statsLoading, fetchFacultyStats, pendingActivities, fetchPendingActivities } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFacultyStats();
    fetchPendingActivities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFacultyStats(), fetchPendingActivities()]);
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
      label: 'Pending Reviews',
      value: facultyStats.pending_count ?? 0,
      icon: Clock,
      color: COLORS.warning,
      bgColor: COLORS.warning + '10',
      onPress: () => router.push('/(faculty)/pending'),
    },
    {
      label: 'Approved Today',
      value: facultyStats.approved_today ?? 0,
      icon: CheckCircle,
      color: COLORS.success,
      bgColor: COLORS.success + '10',
    },
    {
      label: 'Rejected Today',
      value: facultyStats.rejected_today ?? 0,
      icon: XCircle,
      color: COLORS.error,
      bgColor: COLORS.error + '10',
    },
    {
      label: 'Total Reviewed',
      value: facultyStats.total_reviewed ?? 0,
      icon: ClipboardCheck,
      color: COLORS.primary,
      bgColor: COLORS.primary + '10',
    },
  ];

  // Use real pending activities for recent list
  const recentPending = pendingActivities.slice(0, 3);

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
          <Text style={styles.userName}>{user?.full_name || 'Faculty'}</Text>
          <Text style={styles.userRole}>👨‍🏫 Faculty • {user?.department || 'Department'}</Text>
        </View>

        {/* Overview Card */}
        <LinearGradient
          colors={GRADIENTS.secondary}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.overviewContent}>
            <View style={styles.overviewLeft}>
              <Text style={styles.overviewTitle}>Review Overview</Text>
              <Text style={styles.overviewSubtitle}>This Semester</Text>
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{facultyStats.total_approved ?? 0}</Text>
                  <Text style={styles.overviewStatLabel}>Approved</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{facultyStats.total_rejected ?? 0}</Text>
                  <Text style={styles.overviewStatLabel}>Rejected</Text>
                </View>
              </View>
            </View>
            <View style={styles.overviewRight}>
              <Text style={styles.overviewPercentage}>
                {facultyStats.total_reviewed > 0 
                  ? Math.round((facultyStats.total_approved / facultyStats.total_reviewed) * 100)
                  : 0}%
              </Text>
              <Text style={styles.overviewPercentLabel}>Approval Rate</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Pending Alert */}
        {(facultyStats.pending_count ?? 0) > 0 && (
          <TouchableOpacity 
            style={styles.alertCard}
            onPress={() => router.push('/(faculty)/pending')}
          >
            <View style={styles.alertIcon}>
              <AlertCircle size={24} color={COLORS.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{facultyStats.pending_count} activities awaiting review</Text>
              <Text style={styles.alertSubtitle}>Tap to review pending submissions</Text>
            </View>
            <ChevronRight size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {statsGrid.map((stat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.statCard}
                onPress={stat.onPress}
                disabled={!stat.onPress}
              >
                <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                  <stat.icon size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(faculty)/pending')}
            >
              <LinearGradient
                colors={GRADIENTS.secondary}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ClipboardCheck size={20} color={COLORS.white} />
                <Text style={styles.actionText}>Review Pending</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(faculty)/history')}
            >
              <View style={styles.actionSecondary}>
                <TrendingUp size={20} color={COLORS.primary} />
                <Text style={styles.actionSecondaryText}>View History</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => router.push('/(faculty)/history')}
            >
              <Text style={styles.seeAllText}>See All</Text>
              <ChevronRight size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.reviewsList}>
            {recentPending.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Text style={styles.emptyText}>No recent activities</Text>
              </View>
            ) : (
              recentPending.map((activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.reviewCard,
                    index === recentPending.length - 1 && styles.lastReviewCard,
                  ]}
                >
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewTitle} numberOfLines={1}>
                      {activity.title}
                    </Text>
                    <Text style={styles.reviewMeta}>
                      {activity.student?.full_name || 'Unknown'} • {new Date(activity.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: COLORS.warning + '15' },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: COLORS.warning }]}>
                      Pending
                    </Text>
                  </View>
                </View>
              ))
            )}
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
    marginRight: 20,
  },
  overviewStatValue: {
    fontSize: 22,
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
    marginRight: 20,
  },
  overviewRight: {
    alignItems: 'center',
  },
  overviewPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
  },
  overviewPercentLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '10',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  alertSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
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
  reviewsList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  emptyReviews: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastReviewCard: {
    borderBottomWidth: 0,
  },
  reviewInfo: {
    flex: 1,
    marginRight: 12,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  reviewMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
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
  bottomPadding: {
    height: 20,
  },
});
