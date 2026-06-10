import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Activity,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react-native';
import { COLORS, GRADIENTS, getCategoryColor } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { getActivityTrends, getDepartmentStats } from '@/services/statsService';

const { width: screenWidth } = Dimensions.get('window');

type MonthlyTrend = { month: string; activities: number; approvals: number };
type DepartmentData = { name: string; activities: number; students: number; avg: number };

export default function AdminAnalytics() {
  const { adminStats } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'semester' | 'year'>('month');
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);

  // Calculate months based on period
  const getMonthsForPeriod = (period: string): number => {
    switch (period) {
      case 'week': return 1;
      case 'month': return 3;
      case 'semester': return 6;
      case 'year': return 12;
      default: return 6;
    }
  };

  // Fetch analytics data when period changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      setTrendLoading(true);
      setDeptLoading(true);
      try {
        const months = getMonthsForPeriod(selectedPeriod);
        
        // Fetch activity trends
        const trends = await getActivityTrends(months);
        const formattedTrends = trends.map(t => ({
          month: t.month,
          activities: t.count,
          approvals: t.count, // All fetched are approved
        }));
        setMonthlyTrend(formattedTrends);
        setTrendLoading(false);

        // Fetch department stats
        const deptStats = await getDepartmentStats();
        const formattedDepts = deptStats.map(d => ({
          name: d.department,
          activities: d.activities,
          students: d.students,
          avg: d.students > 0 ? parseFloat((d.activities / d.students).toFixed(1)) : 0,
        }));
        setDepartmentData(formattedDepts);
        setDeptLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setTrendLoading(false);
        setDeptLoading(false);
      }
      setLoading(false);
    };
    
    fetchAnalytics();
  }, [selectedPeriod]);

  const maxActivities = Math.max(...monthlyTrend.map(d => d.activities), 1);

  // Category distribution
  const categoryData = adminStats.activities_by_category?.length > 0
    ? adminStats.activities_by_category
    : [];

  const totalCategoryCount = categoryData.reduce((sum, c) => sum + c.count, 0);

  const maxDeptActivities = Math.max(...departmentData.map(d => d.activities), 1);

  const periods = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'semester', label: 'Semester' },
    { key: 'year', label: 'Year' },
  ];

  const handleExport = (format: 'csv' | 'pdf') => {
    Alert.alert(
      'Export Report',
      `Exporting ${format.toUpperCase()} report...`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Analytics</Text>
              <Text style={styles.headerSubtitle}>Institution performance insights</Text>
            </View>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => handleExport('pdf')}
            >
              <Download size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
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
              <Activity size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.summaryValue}>{adminStats.total_activities || 456}</Text>
            <Text style={styles.summaryLabel}>Total Activities</Text>
            <View style={styles.summaryTrend}>
              <TrendingUp size={14} color={COLORS.success} />
              <Text style={[styles.trendText, { color: COLORS.success }]}>+18%</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Award size={24} color={COLORS.success} />
            </View>
            <Text style={styles.summaryValue}>{adminStats.total_points_awarded || 3250}</Text>
            <Text style={styles.summaryLabel}>Points Awarded</Text>
            <View style={styles.summaryTrend}>
              <TrendingUp size={14} color={COLORS.success} />
              <Text style={[styles.trendText, { color: COLORS.success }]}>+24%</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <BarChart3 size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.summaryValue}>85%</Text>
            <Text style={styles.summaryLabel}>Approval Rate</Text>
            <View style={styles.summaryTrend}>
              <TrendingUp size={14} color={COLORS.success} />
              <Text style={[styles.trendText, { color: COLORS.success }]}>+3%</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.accent + '15' }]}>
              <PieChart size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.summaryValue}>12.5</Text>
            <Text style={styles.summaryLabel}>Avg per Student</Text>
            <View style={styles.summaryTrend}>
              <TrendingDown size={14} color={COLORS.error} />
              <Text style={[styles.trendText, { color: COLORS.error }]}>-2%</Text>
            </View>
          </View>
        </View>

        {/* Activity Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Activity Trend</Text>
              <Text style={styles.chartSubtitle}>Monthly submissions</Text>
            </View>
            <Calendar size={20} color={COLORS.textMuted} />
          </View>
          
          {trendLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.chartLoadingText}>Loading trends...</Text>
            </View>
          ) : monthlyTrend.length === 0 ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>No activity data available</Text>
            </View>
          ) : (
            <View style={styles.barChart}>
              {monthlyTrend.map((item, index) => (
                <View key={index} style={styles.barItem}>
                  <View style={styles.barContainer}>
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      style={[
                        styles.bar,
                        { height: `${(item.activities / maxActivities) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.barValue}>{item.activities}</Text>
                  <Text style={styles.barLabel}>{item.month}</Text>
                </View>
              ))}
            </View>
          )}
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
            {categoryData.map((item, index) => {
              const color = getCategoryColor(item.category);
              const percentage = Math.round((item.count / totalCategoryCount) * 100);
              return (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: color }]} />
                    <Text style={styles.categoryName}>
                      {item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View 
                      style={[
                        styles.categoryBar,
                        { width: `${percentage}%`, backgroundColor: color }
                      ]} 
                    />
                  </View>
                  <Text style={styles.categoryCount}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Department Performance */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Department Performance</Text>
              <Text style={styles.chartSubtitle}>Activities by department</Text>
            </View>
          </View>

          {deptLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="large" color={COLORS.secondary} />
              <Text style={styles.chartLoadingText}>Loading departments...</Text>
            </View>
          ) : departmentData.length === 0 ? (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>No department data available</Text>
            </View>
          ) : (
            <View style={styles.departmentList}>
              {departmentData.map((dept, index) => (
                <View key={index} style={styles.departmentItem}>
                  <View style={styles.departmentHeader}>
                    <Text style={styles.departmentName}>{dept.name}</Text>
                    <Text style={styles.departmentAvg}>Avg: {dept.avg} pts/student</Text>
                  </View>
                  <View style={styles.departmentBarContainer}>
                    <LinearGradient
                      colors={GRADIENTS.secondary}
                      style={[
                        styles.departmentBar,
                        { width: `${(dept.activities / maxDeptActivities) * 100}%` }
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <View style={styles.departmentStats}>
                    <Text style={styles.departmentStat}>{dept.activities} activities</Text>
                    <Text style={styles.departmentStat}>•</Text>
                    <Text style={styles.departmentStat}>{dept.students} students</Text>
                  </View>
                </View>
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
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
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
    width: 28,
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
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
  departmentList: {
    gap: 16,
  },
  departmentItem: {},
  departmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  departmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  departmentAvg: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  departmentBarContainer: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  departmentBar: {
    height: '100%',
    borderRadius: 4,
  },
  departmentStats: {
    flexDirection: 'row',
    gap: 8,
  },
  departmentStat: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chartLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  chartEmpty: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  bottomPadding: {
    height: 100,
  },
});
