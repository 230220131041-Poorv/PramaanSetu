import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Modal, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Bell, Settings, X, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';

interface HeaderProps {
  showUserMenu?: boolean;
}

export default function Header({ showUserMenu = true }: HeaderProps) {
  const { user, logout, notifications = [] } = useAuth();
  const router = useRouter();
  const [notificationVisible, setNotificationVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSettingsPress = () => {
    const role = user?.role;
    if (role === 'student') {
      router.push('/(student)/profile');
    } else if (role === 'faculty') {
      router.push('/(faculty)/profile');
    } else if (role === 'admin') {
      router.push('/(admin)/profile');
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning! Welcome back to PramaanSetu';
    if (hour < 17) return '☀️ Good afternoon! Keep up the great work';
    return '🌙 Good evening! Review your progress today';
  };

  const notificationList = [
    {
      id: 'welcome',
      title: 'Welcome to PramaanSetu',
      message: getWelcomeMessage(),
      time: 'Just now',
      type: 'info',
      icon: '👋',
    },
    ...(Array.isArray(notifications) ? notifications.map((notif: any) => ({
      ...notif,
      time: notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Recent',
      icon: notif.icon || '📌',
    })).slice(0, 4) : []),
  ];

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  return (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        ...Platform.select({
          web: {
            minHeight: 80,
          },
          default: {
            minHeight: 70,
          },
        }),
      }}
    >
      {/* Gradient top border */}
      <View
        style={{
          height: 4,
          backgroundColor: COLORS.primary,
          borderBottomColor: 'rgba(29, 78, 216, 0.1)',
          borderBottomWidth: 1,
        }}
      />

      {/* Main Header Content */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 12,
          flex: 1,
        }}
      >
        {/* Logo Section - Left */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: 'rgba(29, 78, 216, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              source={require('@/assets/images/PRAMAANSETU WHITEBG.png')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
              }}
            />
          </View>
        </View>

        {/* Middle Text */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#1D4ED8',
              fontFamily: 'Inter-Bold',
              letterSpacing: 0.5,
              textShadowColor: 'rgba(29, 78, 216, 0.15)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            }}
          >
            PramaanSetu
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '500',
              color: COLORS.textSecondary,
              fontFamily: 'Inter-Medium',
              marginTop: 2,
              letterSpacing: 0.5,
            }}
          >
            Student Portfolio Management
          </Text>
        </View>

        {/* User Details Section - Right */}
        {showUserMenu && user && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Notification Bell */}
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: 'rgba(29, 78, 216, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setNotificationVisible(true)}
            >
              <Bell size={20} color={COLORS.primary} />
              {notificationList.length > 1 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: COLORS.error,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 10, color: COLORS.white, fontWeight: '700' }}>
                    {notificationList.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View
              style={{
                width: 1,
                height: 30,
                backgroundColor: COLORS.border,
              }}
            />

            {/* User Info */}
            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: COLORS.textPrimary,
                  fontFamily: 'Inter-SemiBold',
                }}
              >
                {user.full_name || 'User'}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  fontFamily: 'Inter-Regular',
                  marginTop: 2,
                }}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>

            {/* Avatar with Border */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: 'rgba(29, 78, 216, 0.2)',
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
                overflow: 'hidden',
              }}
            >
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 11,
                  }}
                />
              ) : (
                <Text
                  style={{
                    color: COLORS.white,
                    fontWeight: '700',
                    fontSize: 13,
                    fontFamily: 'Inter-Bold',
                  }}
                >
                  {getInitials(user.full_name)}
                </Text>
              )}
            </View>

            {/* Settings Button */}
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: 'rgba(29, 78, 216, 0.08)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={handleSettingsPress}
            >
              <Settings size={20} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <LogOut size={20} color='#EF4444' />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notification Popup Modal */}
      <Modal
        visible={notificationVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNotificationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationPanel}>
            {/* Header */}
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationVisible(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <ScrollView style={styles.notificationList}>
              {notificationList.map((notification, index) => (
                <View
                  key={notification.id || index}
                  style={[
                    styles.notificationItem,
                    index !== notificationList.length - 1 && styles.notificationItemBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.notificationIconContainer,
                      { backgroundColor: getNotificationColor(notification.type) + '15' },
                    ]}
                  >
                    <Text style={styles.notificationIcon}>{notification.icon || '📌'}</Text>
                  </View>

                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationItemTitle}>{notification.title}</Text>
                    <Text style={styles.notificationItemMessage}>{notification.message}</Text>
                    <View style={styles.notificationTime}>
                      <Clock size={12} color={COLORS.textMuted} />
                      <Text style={styles.notificationTimeText}>{notification.time}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.notificationDot,
                      { backgroundColor: getNotificationColor(notification.type) },
                    ]}
                  />
                </View>
              ))}

              {notificationList.length === 0 && (
                <View style={styles.emptyNotifications}>
                  <Bell size={40} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                  <Text style={styles.emptySubtext}>You're all caught up!</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  notificationPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    maxHeight: 500,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  notificationList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
    gap: 12,
  },
  notificationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  notificationItemMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
    lineHeight: 18,
  },
  notificationTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTimeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'Inter-Regular',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    fontFamily: 'Inter-Bold',
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
});
