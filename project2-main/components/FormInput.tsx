import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  required?: boolean;
}

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  required = false,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
        !editable && styles.inputDisabled,
      ]}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && styles.disabledText,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color={COLORS.textMuted} />
            ) : (
              <Eye size={20} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>
        )}
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
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    paddingVertical: 14,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
  },
});
