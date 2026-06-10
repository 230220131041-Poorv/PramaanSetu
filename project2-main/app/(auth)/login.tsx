import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GraduationCap, Shield, BookOpen, User } from 'lucide-react-native';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { AVAILABLE_USERS, DUMMY_CREDENTIALS } from '@/constants/dummyUsers';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const [errors, setErrors] = useState<{ general?: string }>({});

  const handleQuickLogin = async (email: string) => {
    setErrors({});
    const password = DUMMY_CREDENTIALS[email];
    
    const result = await login(email, password);
    
    if (!result.success) {
      setErrors({ general: result.error });
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin':
        return <Shield size={32} color={COLORS.white} />;
      case 'faculty':
        return <BookOpen size={32} color={COLORS.white} />;
      case 'student':
        return <User size={32} color={COLORS.white} />;
      default:
        return <GraduationCap size={32} color={COLORS.white} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin':
        return ['#FF6B6B', '#C92A2A'];
      case 'faculty':
        return ['#4C6EF5', '#1C7ED6'];
      case 'student':
        return ['#11A835', '#08822A'];
      default:
        return GRADIENTS.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.iconContainer}
            >
              <GraduationCap size={48} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.title}>Student Activity Portal</Text>
            <Text style={styles.subtitle}>Demo Mode - Select Your Role</Text>
          </View>

          {/* Error Message */}
          {errors.general && (
            <ErrorMessage 
              message={errors.general} 
              onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
            />
          )}

          {/* Quick Login Cards */}
          <View style={styles.cardsContainer}>
            {AVAILABLE_USERS.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => handleQuickLogin(user.email)}
                disabled={isLoading}
                style={styles.cardContainer}
              >
                <LinearGradient
                  colors={getRoleColor(user.role)}
                  style={styles.card}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardIcon}>
                    {getRoleIcon(user.role)}
                  </View>
                  
                  <Text style={styles.cardTitle}>{user.role.toUpperCase()}</Text>
                  <Text style={styles.cardName}>{user.full_name}</Text>
                  <Text style={styles.cardEmail}>{user.email}</Text>
                  
                  {isLoading && (
                    <View style={styles.loadingOverlay}>
                      <LoadingSpinner />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Credentials Info */}
          <View style={styles.credentialsBox}>
            <Text style={styles.credentialsTitle}>Demo Credentials</Text>
            <View style={styles.credentialsList}>
              {AVAILABLE_USERS.map((user) => (
                <View key={user.id} style={styles.credentialItem}>
                  <Text style={styles.credentialText}>
                    <Text style={styles.credentialLabel}>Email: </Text>
                    {user.email}
                  </Text>
                  <Text style={styles.credentialText}>
                    <Text style={styles.credentialLabel}>Password: </Text>
                    {DUMMY_CREDENTIALS[user.email]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info Message */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              This is a demo application. No database connection is required. All data is stored locally in your browser session.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  cardsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  cardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  card: {
    padding: 20,
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  credentialsBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  credentialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  credentialsList: {
    gap: 12,
  },
  credentialItem: {
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
  },
  credentialText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  credentialLabel: {
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoBox: {
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
