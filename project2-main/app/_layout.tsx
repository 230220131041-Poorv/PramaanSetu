import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// This component handles navigation based on auth state
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      // User is not signed in and not in auth group, redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // User is signed in and in auth group, redirect based on role
      switch (user.role) {
        case 'student':
          router.replace('/(student)');
          break;
        case 'faculty':
          router.replace('/(faculty)');
          break;
        case 'admin':
          router.replace('/(admin)');
          break;
        default:
          router.replace('/(auth)/login');
      }
    }
  }, [user, segments, isLoading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(faculty)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}