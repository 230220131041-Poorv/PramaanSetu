import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GraduationCap, User } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface RolePickerProps {
  selectedRole: 'student' | 'faculty' | null;
  onSelectRole: (role: 'student' | 'faculty') => void;
  error?: string;
}

export default function RolePicker({ selectedRole, onSelectRole, error }: RolePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Select Role <Text style={styles.required}>*</Text>
      </Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            selectedRole === 'student' && styles.optionSelected,
          ]}
          onPress={() => onSelectRole('student')}
        >
          <View style={[
            styles.iconContainer,
            selectedRole === 'student' && styles.iconContainerSelected,
          ]}>
            <GraduationCap 
              size={32} 
              color={selectedRole === 'student' ? COLORS.white : COLORS.primary} 
            />
          </View>
          <Text style={[
            styles.optionTitle,
            selectedRole === 'student' && styles.optionTitleSelected,
          ]}>
            Student
          </Text>
          <Text style={styles.optionDescription}>
            Log activities and earn points
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.option,
            selectedRole === 'faculty' && styles.optionSelected,
          ]}
          onPress={() => onSelectRole('faculty')}
        >
          <View style={[
            styles.iconContainer,
            selectedRole === 'faculty' && styles.iconContainerSelected,
          ]}>
            <User 
              size={32} 
              color={selectedRole === 'faculty' ? COLORS.white : COLORS.primary} 
            />
          </View>
          <Text style={[
            styles.optionTitle,
            selectedRole === 'faculty' && styles.optionTitleSelected,
          ]}>
            Faculty
          </Text>
          <Text style={styles.optionDescription}>
            Review and approve activities
          </Text>
        </TouchableOpacity>
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  required: {
    color: COLORS.error,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 8,
  },
});
