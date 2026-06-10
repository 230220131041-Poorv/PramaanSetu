import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Award, 
  Target,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react-native';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getActivityTrends } from '@/services/statsService';

const { width: screenWidth } = Dimensions.get('window');

export default function StudentAnalytics() {
  const { user, studentStats, activities } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester' | 'all'>('month');
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number; points: number }[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);

  // Fetch activity trends on mount
  useEffect(() => {
    const fetchTrends = async () => {
      setTrendsLoading(true);
      const trends = await getActivityTrends(6, user?.id);
      setMonthlyData(trends);
      setTrendsLoading(false);
    };
    
    if (user?.id) {
      fetchTrends();
    }
  }, [user?.id]);

  // Calculate analytics data
  const approvedActivities = activities.filter(a => a.status === 'approved');
  const totalPoints = studentStats?.total_points || 0;

  // Category distribution
  const categoryDistribution = activities.reduce((acc, activity) => {
    const category = activity.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryColors: Record<string, string> = {
    workshop: '#2563EB',
    competition: '#10B981',
    certification: '#F59E0B',
    seminar: '#EF4444',
    sports: '#8B5CF6',
    cultural: '#EC4899',
    social_service: '#14B8A6',
    internship: '#F97316',
    other: '#6B7280',
  };

  const maxCategoryCount = Math.max(...Object.values(categoryDistribution), 1);

  const maxMonthlyCount = Math.max(...monthlyData.map(d => d.count), 1);

  // Performance metrics
  const approvalRate = activities.length > 0 
    ? Math.round((approvedActivities.length / activities.length) * 100) 
    : 0;

  const avgPointsPerActivity = approvedActivities.length > 0
    ? Math.round(totalPoints / approvedActivities.length)
    : 0;

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'semester', label: 'Semester' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Track your activity performance</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Award size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryValue}>{totalPoints}</Text>
            <Text style={styles.summaryLabel}>Total Points</Text>
            <View style={styles.summaryTrend}>
              <TrendingUp size={14} color={COLORS.success} />
              <Text style={[styles.trendText, { color: COLORS.success }]}>+12%</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Target size={24} color={COLORS.success} />
            </View>
            <Text style={styles.summaryValue}>{approvalRate}%</Text>
            <Text style={styles.summaryLabel}>Approval Rate</Text>
            <View style={styles.summaryTrend}>
              <TrendingUp size={14} color={COLORS.success} />
              <Text style={[styles.trendText, { color: COLORS.success }]}>+5%</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Activity size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.summaryValue}>{activities.length}</Text>
            <Text style={styles.summaryLabel}>Total Activities</Text>
            <View style={styles.summaryTrend}>
              <TrendingUp size={14} color={COLORS.success} />
              <Text style={[styles.trendText, { color: COLORS.success }]}>+3</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.accent + '15' }]}>
              <BarChart3 size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.summaryValue}>{avgPointsPerActivity}</Text>
            <Text style={styles.summaryLabel}>Avg Points</Text>
            <View style={styles.summaryTrend}>
              <TrendingDown size={14} color={COLORS.error} />
              <Text style={[styles.trendText, { color: COLORS.error }]}>-2</Text>
            </View>
          </View>
        </View>

        {/* Activity Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Activity Trend</Text>
              <Text style={styles.chartSubtitle}>Last 6 months</Text>
            </View>
            <Calendar size={20} color={COLORS.textMuted} />
          </View>
          
          <View style={styles.barChart}>
            {monthlyData.map((item, index) => (
              <View key={index} style={styles.barItem}>
                <View style={styles.barContainer}>
                  <LinearGradient
                    colors={GRADIENTS.primary}
                    style={[
                      styles.bar,
                      { height: `${(item.count / maxMonthlyCount) * 100}%` }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Distribution */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Category Distribution</Text>
              <Text style={styles.chartSubtitle}>Activities by type</Text>
            </View>
            <PieChart size={20} color={COLORS.textMuted} />
          </View>

          <View style={styles.categoryList}>
            {Object.entries(categoryDistribution).map(([category, count]) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View 
                    style={[
                      styles.categoryDot, 
                      { backgroundColor: categoryColors[category] || COLORS.textMuted }
                    ]} 
                  />
                  <Text style={styles.categoryName}>
                    {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.categoryBarContainer}>
                  <View 
                    style={[
                      styles.categoryBar,
                      { 
                        width: `${(count / maxCategoryCount) * 100}%`,
                        backgroundColor: categoryColors[category] || COLORS.textMuted
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryCount}>{count}</Text>
              </View>
            ))}
            {Object.keys(categoryDistribution).length === 0 && (
              <Text style={styles.emptyText}>No activities yet</Text>
            )}
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Performance Insights</Text>
          
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: COLORS.success + '15' }]}>
              <TrendingUp size={20} color={COLORS.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>
                Your approval rate is <Text style={styles.insightHighlight}>{approvalRate}%</Text>
              </Text>
              <Text style={styles.insightSubtext}>
                {approvalRate >= 80 ? 'Excellent! Keep maintaining quality submissions.' : 'Try to improve documentation for better approvals.'}
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Award size={20} color={COLORS.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>
                You've earned <Text style={styles.insightHighlight}>{totalPoints} points</Text>
              </Text>
              <Text style={styles.insightSubtext}>
                {totalPoints >= 500 ? 'Great progress towards your semester goal!' : 'Add more activities to reach your target.'}
              </Text>
            </View>
          </View>

          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Target size={20} color={COLORS.warning} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightText}>
                Most active in <Text style={styles.insightHighlight}>
                  {Object.entries(categoryDistribution).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace('_', ' ') || 'N/A'}
                </Text>
              </Text>
              <Text style={styles.insightSubtext}>
                Diversify your activities for a well-rounded portfolio.
              </Text>
            </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: COLORS.white,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    width: (screenWidth - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  summaryTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chartSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: 32,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    width: 30,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  insightsCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  insightSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
});
