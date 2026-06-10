import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, ClipboardCheck, History, User } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Header from '@/components/Header';

function DashboardIcon({ size, color }: { size: number; color: string }) {
  return <Home size={size} color={color} />;
}

function PendingIcon({ size, color }: { size: number; color: string }) {
  return <ClipboardCheck size={size} color={color} />;
}

function HistoryIcon({ size, color }: { size: number; color: string }) {
  return <History size={size} color={color} />;
}

function ProfileIcon({ size, color }: { size: number; color: string }) {
  return <User size={size} color={color} />;
}

export default function FacultyLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect if not faculty
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.role !== 'faculty') {
      // Redirect to correct role area
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else if (user.role === 'student') {
        router.replace('/(student)');
      }
    }
  }, [user, isLoading]);

  // Show loading while checking role
  if (isLoading || !user || user.role !== 'faculty') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header showUserMenu={true} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.borderLight,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: DashboardIcon,
          }}
        />
        <Tabs.Screen
          name="pending"
          options={{
            title: 'Pending',
            tabBarIcon: PendingIcon,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: HistoryIcon,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ProfileIcon,
          }}
        />
      </Tabs>
    </View>
  );
}
