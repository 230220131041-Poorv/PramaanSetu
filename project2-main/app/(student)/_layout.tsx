import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, Activity, FolderOpen, User, BarChart3 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Header from '@/components/Header';

function DashboardIcon({ size, color }: { size: number; color: string }) {
  return <Home size={size} color={color} />;
}

function ActivitiesIcon({ size, color }: { size: number; color: string }) {
  return <Activity size={size} color={color} />;
}

function PortfolioIcon({ size, color }: { size: number; color: string }) {
  return <FolderOpen size={size} color={color} />;
}

function AnalyticsIcon({ size, color }: { size: number; color: string }) {
  return <BarChart3 size={size} color={color} />;
}

function ProfileIcon({ size, color }: { size: number; color: string }) {
  return <User size={size} color={color} />;
}

export default function StudentTabLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Redirect if not student
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.role !== 'student') {
      // Redirect to correct role area
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else if (user.role === 'faculty') {
        router.replace('/(faculty)');
      }
    }
  }, [user, isLoading]);

  // Show loading while checking role
  if (isLoading || !user || user.role !== 'student') {
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
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: DashboardIcon,
          }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            title: 'Activities',
            tabBarIcon: ActivitiesIcon,
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: 'Portfolio',
            tabBarIcon: PortfolioIcon,
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
