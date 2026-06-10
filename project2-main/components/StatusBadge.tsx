import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityStatus } from '@/types';
import { STATUS_COLORS, COLORS } from '@/constants/colors';

interface StatusBadgeProps {
  status: ActivityStatus;
  size?: 'small' | 'medium' | 'large';
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const backgroundColor = STATUS_COLORS[status];
  
  const getStatusText = (status: ActivityStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 8,
          paddingVertical: 2,
          fontSize: 10,
        };
      case 'large':
        return {
          paddingHorizontal: 16,
          paddingVertical: 8,
          fontSize: 14,
        };
      default:
        return {
          paddingHorizontal: 12,
          paddingVertical: 4,
          fontSize: 12,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      styles.badge, 
      { 
        backgroundColor,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
      }
    ]}>
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>
        {getStatusText(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
