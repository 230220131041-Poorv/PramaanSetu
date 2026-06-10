import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { 
  Activity as ActivityIcon, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Award,
  TrendingUp
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { ActivityFeedItem } from '@/types';

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  onItemPress?: (item: ActivityFeedItem) => void;
  maxDisplay?: number;
  title?: string;
}

const getItemIcon = (type: ActivityFeedItem['type']) => {
  switch (type) {
    case 'new_activity':
      return { icon: Plus, defaultColor: COLORS.primary };
    case 'status_change':
      return { icon: CheckCircle, defaultColor: COLORS.success };
    case 'achievement':
      return { icon: Award, defaultColor: COLORS.warning };
    case 'milestone':
      return { icon: TrendingUp, defaultColor: COLORS.success };
    default:
      return { icon: ActivityIcon, defaultColor: COLORS.textMuted };
  }
};

const formatTimeAgo = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function ActivityFeed({
  items,
  onItemPress,
  maxDisplay = 5,
  title = 'Recent Activity',
}: ActivityFeedProps) {
  const displayItems = items.slice(0, maxDisplay);

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <ActivityIcon size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.timeline}>
        {displayItems.map((item, index) => {
          const { icon: Icon, defaultColor } = getItemIcon(item.type);
          const iconColor = item.color || defaultColor;
          const isLast = index === displayItems.length - 1;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.feedItem}
              onPress={() => onItemPress?.(item)}
              activeOpacity={0.7}
            >
              {/* Timeline line */}
              {!isLast && <View style={styles.timelineLine} />}
              
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                <Icon size={16} color={iconColor} />
              </View>
              
              {/* Content */}
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTime}>{formatTimeAgo(item.timestamp)}</Text>
                  {item.user_name && (
                    <>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.itemUser}>{item.user_name}</Text>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  timeline: {
    position: 'relative',
  },
  feedItem: {
    flexDirection: 'row',
    paddingBottom: 16,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.borderLight,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metaDot: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },
  itemUser: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
