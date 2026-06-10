import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/constants/colors';
import { TrendData } from '@/types';

interface TrendChartProps {
  data: TrendData[];
  title?: string;
  type?: 'line' | 'bar';
  valueKey?: 'activities_count' | 'points_awarded' | 'approvals' | 'rejections';
  color?: string;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function TrendChart({
  data,
  title,
  type = 'bar',
  valueKey = 'activities_count',
  color = COLORS.primary,
  height = 200,
  showLabels = true,
  showValues = true,
}: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const values = data.map(d => d[valueKey]);
  const maxValue = Math.max(...values, 1);
  const chartHeight = height - (showLabels ? 60 : 20);
  const barWidth = (screenWidth - 80) / data.length - 8;

  const renderBarChart = () => (
    <View style={styles.barChartContainer}>
      <View style={[styles.chartArea, { height: chartHeight }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxValue}</Text>
          <Text style={styles.yAxisLabel}>{Math.round(maxValue / 2)}</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>
        
        {/* Bars */}
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const value = item[valueKey];
            const barHeight = (value / maxValue) * (chartHeight - 20);
            
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={[styles.barBackground, { height: chartHeight - 20 }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        width: barWidth,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                {showValues && value > 0 && (
                  <Text style={styles.barValue}>{value}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
      
      {/* X-axis labels */}
      {showLabels && (
        <View style={styles.xAxisContainer}>
          {data.map((item, index) => (
            <View key={index} style={[styles.xAxisLabel, { width: barWidth + 8 }]}>
              <Text style={styles.xAxisText} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * (screenWidth - 100) + 40;
      const y = chartHeight - 20 - (item[valueKey] / maxValue) * (chartHeight - 40);
      return { x, y, value: item[valueKey] };
    });

    return (
      <View style={styles.lineChartContainer}>
        <View style={[styles.chartArea, { height: chartHeight }]}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{maxValue}</Text>
            <Text style={styles.yAxisLabel}>{Math.round(maxValue / 2)}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>
          
          {/* Grid lines */}
          <View style={styles.gridContainer}>
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>
          
          {/* Line and dots */}
          <View style={styles.lineContainer}>
            {points.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    left: point.x - 6,
                    top: point.y - 6,
                    backgroundColor: color,
                  },
                ]}
              >
                {showValues && (
                  <Text style={[styles.dotValue, { color }]}>{point.value}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
        
        {/* X-axis labels */}
        {showLabels && (
          <View style={styles.xAxisContainer}>
            {data.map((item, index) => (
              <View key={index} style={styles.lineXAxisLabel}>
                <Text style={styles.xAxisText} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { height }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {type === 'bar' ? renderBarChart() : renderLineChart()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: COLORS.textMuted,
    fontSize: 14,
  },
  barChartContainer: {
    flex: 1,
  },
  lineChartContainer: {
    flex: 1,
  },
  chartArea: {
    flexDirection: 'row',
    flex: 1,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  barWrapper: {
    alignItems: 'center',
  },
  barBackground: {
    justifyContent: 'flex-end',
    backgroundColor: COLORS.borderLight,
    borderRadius: 4,
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 30,
    marginTop: 8,
  },
  xAxisLabel: {
    alignItems: 'center',
  },
  lineXAxisLabel: {
    flex: 1,
    alignItems: 'center',
  },
  xAxisText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  gridContainer: {
    position: 'absolute',
    left: 30,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  gridLine: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  lineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  dotValue: {
    position: 'absolute',
    top: -18,
    left: -8,
    fontSize: 10,
    fontWeight: '600',
    width: 28,
    textAlign: 'center',
  },
});
