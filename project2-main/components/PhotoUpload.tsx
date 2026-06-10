import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, X } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoSelected: (photoUrl: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PhotoUpload({ currentPhotoUrl, onPhotoSelected, isLoading = false }: PhotoUploadProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(currentPhotoUrl || null);

  const pickImageFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Permission to access media library is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setUploading(true);
        try {
          await onPhotoSelected(asset.uri);
          setModalVisible(false);
        } catch (error) {
          console.error('Error uploading photo:', error);
          alert('Failed to upload photo. Please try again.');
          setPreviewUri(currentPhotoUrl || null);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alert('Permission to access camera is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setUploading(true);
        try {
          await onPhotoSelected(asset.uri);
          setModalVisible(false);
        } catch (error) {
          console.error('Error uploading photo:', error);
          alert('Failed to upload photo. Please try again.');
          setPreviewUri(currentPhotoUrl || null);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo. Please try again.');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setModalVisible(true)}
        disabled={isLoading || uploading}
      >
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.placeholder}>
            <Camera size={24} color={COLORS.white} />
          </View>
        )}
        {(isLoading || uploading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.white} />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !uploading && setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Profile Photo</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={uploading}
              >
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Preview */}
            {previewUri && (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: previewUri }}
                  style={styles.previewImage}
                />
                <Text style={styles.previewText}>Preview</Text>
              </View>
            )}

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.option}
                onPress={takePhotoWithCamera}
                disabled={uploading}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                  <Camera size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.optionTitle}>Take a Photo</Text>
                <Text style={styles.optionDescription}>Use camera to capture</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={pickImageFromLibrary}
                disabled={uploading}
              >
                <View style={[styles.optionIcon, { backgroundColor: COLORS.secondary + '15' }]}>
                  <Upload size={24} color={COLORS.secondary} />
                </View>
                <Text style={styles.optionTitle}>Choose from Gallery</Text>
                <Text style={styles.optionDescription}>Select from your device</Text>
              </TouchableOpacity>
            </View>

            {/* Upload Status */}
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.uploadingText}>Uploading photo...</Text>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, uploading && styles.closeButtonDisabled]}
              onPress={() => setModalVisible(false)}
              disabled={uploading}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  uploadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadingText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 12,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
});
