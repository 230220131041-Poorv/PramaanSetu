import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Mail, BookOpen, LogOut, ChevronRight, Edit } from 'lucide-react-native';
import { COLORS, GRADIENTS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { FacultyProfileFormData } from '@/types';
import FormInput from '@/components/FormInput';
import ErrorMessage from '@/components/ErrorMessage';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function FacultyProfile() {
  const { user, logout, updateProfile } = useAuth();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [formData, setFormData] = useState<FacultyProfileFormData>({
    full_name: user?.full_name || '',
    department: user?.department || '',
    avatar_url: user?.avatar_url || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FacultyProfileFormData, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    setSubmitError('');
    
    const result = await updateProfile({
      full_name: formData.full_name.trim(),
      department: formData.department.trim(),
      avatar_url: formData.avatar_url?.trim(),
    });
    
    if (result.success) {
      setShowEditModal(false);
    } else {
      setSubmitError(result.error || 'Failed to update profile');
    }
    
    setSubmitting(false);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={GRADIENTS.secondary}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'FC'}
                </Text>
              </View>
              <View style={styles.cameraIcon}>
                <Camera size={16} color={COLORS.white} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name || 'Faculty'}</Text>
              <Text style={styles.profileId}>ID: {user?.enrollment_number || 'N/A'}</Text>
              <Text style={styles.profileDepartment}>{user?.department || 'Department'}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Edit size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Role Badge */}
        <View style={styles.roleBadgeContainer}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Faculty Member</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Mail size={20} color={COLORS.secondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <BookOpen size={20} color={COLORS.secondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>{user?.department || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => setShowLogoutDialog(true)}
          >
            <LogOut size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {submitError && (
              <ErrorMessage
                message={submitError}
                onDismiss={() => setSubmitError('')}
              />
            )}

            <FormInput
              label="Full Name"
              value={formData.full_name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
              placeholder="Enter your full name"
              error={errors.full_name}
              required
            />

            <FormInput
              label="Department"
              value={formData.department}
              onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
              placeholder="e.g., Computer Science Engineering"
              error={errors.department}
              required
            />

            <FormInput
              label="Avatar URL"
              value={formData.avatar_url || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, avatar_url: text }))}
              placeholder="Link to your profile picture"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={submitting}
            >
              <LinearGradient colors={GRADIENTS.secondary} style={styles.saveButtonGradient}>
                {submitting ? (
                  <LoadingSpinner />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Logout Confirmation */}
      <ConfirmationDialog
        visible={showLogoutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="warning"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  editButton: {
    padding: 8,
  },
  roleBadgeContainer: {
    paddingHorizontal: 24,
    marginTop: -16,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: COLORS.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 24,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  menuList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  bottomPadding: {
    height: 40,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
