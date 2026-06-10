import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Bell, 
  Award, 
  Clock, 
  AlertCircle,
  Trash2,
  CheckCheck
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { Notification, NotificationType } from '@/types';

interface NotificationListProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNotificationPress?: (notification: Notification) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'activity_approved':
      return { icon: CheckCircle, color: COLORS.success };
    case 'activity_rejected':
      return { icon: XCircle, color: COLORS.error };
    case 'new_pending':
      return { icon: Clock, color: COLORS.warning };
    case 'achievement_earned':
      return { icon: Award, color: COLORS.primary };
    case 'points_milestone':
      return { icon: Award, color: COLORS.success };
    case 'system_announcement':
      return { icon: AlertCircle, color: COLORS.info };
    case 'deadline_reminder':
      return { icon: Clock, color: COLORS.warning };
    default:
      return { icon: Bell, color: COLORS.textMuted };
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
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

export default function NotificationList({
  visible,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNotificationPress,
}: NotificationListProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const handlePress = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNotificationPress?.(notification);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllButton} onPress={onMarkAllAsRead}>
                <CheckCheck size={18} color={COLORS.primary} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyMessage}>
                You're all caught up! Check back later for updates.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => {
              const { icon: Icon, color } = getNotificationIcon(notification.type);
              
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.notificationUnread,
                  ]}
                  onPress={() => handlePress(notification)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                    <Icon size={20} color={color} />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.read && styles.notificationTitleUnread,
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTimeAgo(notification.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => onDelete(notification.id)}
                  >
                    <Trash2 size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  notificationUnread: {
    backgroundColor: COLORS.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});
