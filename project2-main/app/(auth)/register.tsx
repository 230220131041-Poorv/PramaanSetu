import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import FormInput from '@/components/FormInput';
import RolePicker from '@/components/RolePicker';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'faculty' | null>(null);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm() || !role) return;
    
    const result = await register(email.trim().toLowerCase(), password, fullName.trim(), role);
    
    if (!result.success) {
      setErrors({ general: result.error });
    }
    // Navigation will happen automatically via root layout when user is set
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
              <UserPlus size={48} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the Student Activity Portal</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <ErrorMessage 
                message={errors.general} 
                onDismiss={() => setErrors(prev => ({ ...prev, general: undefined }))}
              />
            )}
            
            <FormInput
              label="Full Name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
              }}
              placeholder="Enter your full name"
              autoCapitalize="words"
              error={errors.fullName}
              required
            />
            
            <FormInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              required
            />
            
            <FormInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder="Create a password"
              secureTextEntry
              error={errors.password}
              required
            />
            
            <FormInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="Confirm your password"
              secureTextEntry
              error={errors.confirmPassword}
              required
            />

            <RolePicker
              selectedRole={role}
              onSelectRole={(selectedRole) => {
                setRole(selectedRole);
                if (errors.role) setErrors(prev => ({ ...prev, role: undefined }));
              }}
              error={errors.role}
            />

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              style={styles.buttonContainer}
            >
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.registerButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Note */}
          <View style={styles.adminNote}>
            <Text style={styles.adminNoteText}>
              Note: Admin accounts are created by system administrators only.
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
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
  form: {
    marginBottom: 24,
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  registerButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  adminNote: {
    backgroundColor: COLORS.borderLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  adminNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
