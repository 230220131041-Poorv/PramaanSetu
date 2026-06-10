import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { AcademicInfo } from '@/types';

interface CGPATrendProps {
  academicInfo: AcademicInfo;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function CGPATrend({ academicInfo, compact = false }: CGPATrendProps) {
  const { cgpa_history, current_cgpa, current_semester } = academicInfo;

  // Calculate trend
  const getTrend = () => {
    if (cgpa_history.length < 2) return 'stable';
    const lastTwo = cgpa_history.slice(-2);
    const diff = lastTwo[1].cgpa - lastTwo[0].cgpa;
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'stable';
  };

  const trend = getTrend();
  const trendConfig = {
    up: { icon: TrendingUp, color: COLORS.success, label: 'Improving' },
    down: { icon: TrendingDown, color: COLORS.error, label: 'Needs Attention' },
    stable: { icon: Minus, color: COLORS.textMuted, label: 'Stable' },
  };

  const { icon: TrendIcon, color: trendColor, label: trendLabel } = trendConfig[trend];

  // Chart calculations
  const chartHeight = compact ? 60 : 100;
  const chartWidth = screenWidth - (compact ? 160 : 80);
  const maxCGPA = 10;
  const minCGPA = Math.max(0, Math.min(...cgpa_history.map(h => h.cgpa)) - 1);
  const range = maxCGPA - minCGPA;

  const getY = (cgpa: number) => {
    return chartHeight - ((cgpa - minCGPA) / range) * chartHeight;
  };

  const renderMiniChart = () => {
    if (cgpa_history.length === 0) return null;

    const points = cgpa_history.map((item, index) => {
      const x = (index / (cgpa_history.length - 1)) * chartWidth;
      const y = getY(item.cgpa);
      return { x, y, cgpa: item.cgpa, semester: item.semester };
    });

    return (
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        {/* Grid lines */}
        <View style={styles.gridLines}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>

        {/* Points */}
        <View style={styles.pointsContainer}>
          {points.map((point, index) => (
            <View
              key={index}
              style={[
                styles.point,
                {
                  left: point.x - 4,
                  top: point.y - 4,
                  backgroundColor: index === points.length - 1 ? COLORS.primary : COLORS.primaryLight,
                  borderColor: COLORS.primary,
                },
              ]}
            />
          ))}
        </View>

        {/* Semester labels */}
        {!compact && (
          <View style={styles.xAxisLabels}>
            {points.map((point, index) => (
              <Text
                key={index}
                style={[styles.xAxisLabel, { left: point.x - 10, width: 20 }]}
              >
                S{point.semester}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactLeft}>
          <Text style={styles.compactLabel}>Current CGPA</Text>
          <View style={styles.compactCGPARow}>
            <Text style={styles.compactCGPA}>{current_cgpa.toFixed(2)}</Text>
            <View style={[styles.trendBadge, { backgroundColor: `${trendColor}20` }]}>
              <TrendIcon size={12} color={trendColor} />
            </View>
          </View>
          <Text style={styles.compactSemester}>Semester {current_semester}</Text>
        </View>
        <View style={styles.compactChart}>
          {renderMiniChart()}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Academic Progress</Text>
        <View style={[styles.trendIndicator, { backgroundColor: `${trendColor}20` }]}>
          <TrendIcon size={14} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>{trendLabel}</Text>
        </View>
      </View>

      <View style={styles.cgpaSection}>
        <View style={styles.currentCGPA}>
          <Text style={styles.cgpaLabel}>Current CGPA</Text>
          <Text style={styles.cgpaValue}>{current_cgpa.toFixed(2)}</Text>
          <Text style={styles.cgpaMax}>/ 10.0</Text>
        </View>
        <View style={styles.semesterInfo}>
          <Text style={styles.semesterLabel}>Semester</Text>
          <Text style={styles.semesterValue}>{current_semester}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(current_cgpa / 10) * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>0</Text>
          <Text style={styles.progressLabel}>5</Text>
          <Text style={styles.progressLabel}>10</Text>
        </View>
      </View>

      {/* Chart */}
      {cgpa_history.length > 1 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>CGPA History</Text>
          {renderMiniChart()}
        </View>
      )}

      {/* Additional stats */}
      {academicInfo.credits_completed && academicInfo.total_credits_required && (
        <View style={styles.creditsSection}>
          <View style={styles.creditItem}>
            <Text style={styles.creditValue}>{academicInfo.credits_completed}</Text>
            <Text style={styles.creditLabel}>Credits Earned</Text>
          </View>
          <View style={styles.creditDivider} />
          <View style={styles.creditItem}>
            <Text style={styles.creditValue}>
              {academicInfo.total_credits_required - academicInfo.credits_completed}
            </Text>
            <Text style={styles.creditLabel}>Credits Remaining</Text>
          </View>
          {academicInfo.attendance_percentage !== undefined && (
            <>
              <View style={styles.creditDivider} />
              <View style={styles.creditItem}>
                <Text style={styles.creditValue}>{academicInfo.attendance_percentage}%</Text>
                <Text style={styles.creditLabel}>Attendance</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cgpaSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  currentCGPA: {
    flex: 1,
  },
  cgpaLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  cgpaValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cgpaMax: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: -4,
  },
  semesterInfo: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  semesterLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  semesterValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  chartSection: {
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  chartContainer: {
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  pointsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  xAxisLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -16,
    height: 16,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  creditsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  creditItem: {
    flex: 1,
    alignItems: 'center',
  },
  creditValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  creditLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  creditDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  compactLeft: {
    marginRight: 16,
  },
  compactLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  compactCGPARow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactCGPA: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  trendBadge: {
    padding: 4,
    borderRadius: 8,
  },
  compactSemester: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  compactChart: {
    flex: 1,
  },
});
