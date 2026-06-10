import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface NotificationBellProps {
  count: number;
  onPress: () => void;
  color?: string;
  size?: number;
}

export default function NotificationBell({
  count,
  onPress,
  color = COLORS.white,
  size = 24,
}: NotificationBellProps) {
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Bell size={size} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
  },
});
