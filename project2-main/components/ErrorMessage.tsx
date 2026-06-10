import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorMessage({ message, onDismiss, type = 'error' }: ErrorMessageProps) {
  const getTypeColors = () => {
    switch (type) {
      case 'warning':
        return {
          background: COLORS.warningLight,
          border: COLORS.warning,
          text: '#92400E',
        };
      case 'info':
        return {
          background: '#DBEAFE',
          border: COLORS.primary,
          text: '#1E40AF',
        };
      default:
        return {
          background: COLORS.errorLight,
          border: COLORS.error,
          text: '#991B1B',
        };
    }
  };

  const colors = getTypeColors();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        borderColor: colors.border,
      }
    ]}>
      <AlertCircle size={20} color={colors.border} />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  message: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
  },
});
