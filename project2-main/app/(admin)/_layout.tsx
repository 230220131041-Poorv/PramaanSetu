import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, BarChart3, Users, User } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Header from '@/components/Header';
import { View } from 'react-native';

function DashboardIcon({ size, color }: { size: number; color: string }) {
  return <Home size={size} color={color} />;
}

function AnalyticsIcon({ size, color }: { size: number; color: string }) {
  return <BarChart3 size={size} color={color} />;
}

function UsersIcon({ size, color }: { size: number; color: string }) {
  return <Users size={size} color={color} />;
}

function ProfileIcon({ size, color }: { size: number; color: string }) {
  return <User size={size} color={color} />;
}

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect if not admin
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.role !== 'admin') {
      // Redirect to correct role area
      if (user.role === 'student') {
        router.replace('/(student)');
      } else if (user.role === 'faculty') {
        router.replace('/(faculty)');
      }
    }
  }, [user, isLoading]);

  // Show loading while checking role
  if (isLoading || !user || user.role !== 'admin') {
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
            borderTopColor: COLORS.border,
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
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: AnalyticsIcon,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarIcon: UsersIcon,
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
