import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle size={48} color={COLORS.warning} />,
          buttonColor: COLORS.warning,
        };
      case 'success':
        return {
          icon: <CheckCircle size={48} color={COLORS.success} />,
          buttonColor: COLORS.success,
        };
      default:
        return {
          icon: <XCircle size={48} color={COLORS.error} />,
          buttonColor: COLORS.error,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconContainer}>
            {config.icon}
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: config.buttonColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Please wait...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.borderLight,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
