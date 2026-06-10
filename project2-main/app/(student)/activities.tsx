import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Trash2, Calendar, MapPin, X, ChevronDown } from 'lucide-react-native';
import { COLORS, GRADIENTS, getCategoryColor } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { ActivityCategory, CATEGORY_LABELS, ActivityFormData } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import FormInput from '@/components/FormInput';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import ErrorMessage from '@/components/ErrorMessage';

const CATEGORIES: ActivityCategory[] = [
  'workshop', 'competition', 'certification', 'seminar', 
  'sports', 'cultural', 'social_service', 'internship', 'other'
];

export default function StudentActivities() {
  const { activities, activitiesLoading, fetchActivities, addActivity, deleteActivity } = useAuth();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<ActivityFormData>({
    title: '',
    description: '',
    category: 'workshop',
    activity_date: '',
    location: '',
    proof_url: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ActivityFormData, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.activity_date) {
      errors.activity_date = 'Date is required';
    }
    if (!formData.proof_url?.trim()) {
      errors.proof_url = 'Proof URL is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitActivity = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    setSubmitError('');
    
    const result = await addActivity({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      activity_date: formData.activity_date,
      location: formData.location?.trim() || null,
      proof_url: formData.proof_url?.trim() || '',
    });
    
    if (result.success) {
      setShowAddModal(false);
      resetForm();
    } else {
      setSubmitError(result.error || 'Failed to add activity');
    }
    
    setSubmitting(false);
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivityId) return;
    
    setDeleting(true);
    const result = await deleteActivity(selectedActivityId);
    
    if (result.success) {
      setShowDeleteDialog(false);
      setSelectedActivityId(null);
    } else {
      // Show error
      setSubmitError(result.error || 'Failed to delete activity');
    }
    setDeleting(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'workshop',
      activity_date: '',
      location: '',
      proof_url: '',
    });
    setFormErrors({});
    setSubmitError('');
  };

  const openDeleteDialog = (activityId: string) => {
    setSelectedActivityId(activityId);
    setShowDeleteDialog(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activities</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.addButtonGradient}>
            <Plus size={20} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            placeholder="Search activities..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipSelected]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextSelected]}>
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, selectedCategory === category && styles.categoryChipSelected]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === category && styles.categoryChipTextSelected]}>
              {CATEGORY_LABELS[category]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Activities List */}
      <ScrollView 
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activitiesLoading ? (
          <LoadingSpinner />
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            title="No activities found"
            message={searchText ? "Try a different search term" : "Add your first activity to get started"}
            icon="file"
          />
        ) : (
          filteredActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(activity.category) + '20' }]}>
                  <Text style={[styles.categoryText, { color: getCategoryColor(activity.category) }]}>
                    {CATEGORY_LABELS[activity.category]}
                  </Text>
                </View>
                <StatusBadge status={activity.status} />
              </View>
              
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDescription} numberOfLines={2}>
                {activity.description}
              </Text>
              
              <View style={styles.activityDetails}>
                <View style={styles.detailItem}>
                  <Calendar size={14} color={COLORS.textMuted} />
                  <Text style={styles.detailText}>{activity.activity_date}</Text>
                </View>
                {activity.location && (
                  <View style={styles.detailItem}>
                    <MapPin size={14} color={COLORS.textMuted} />
                    <Text style={styles.detailText}>{activity.location}</Text>
                  </View>
                )}
              </View>

              {activity.status === 'approved' && (
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{activity.points} pts</Text>
                </View>
              )}

              {activity.status === 'rejected' && activity.rejection_reason && (
                <View style={styles.rejectionContainer}>
                  <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                  <Text style={styles.rejectionText}>{activity.rejection_reason}</Text>
                </View>
              )}

              {/* Delete button only for pending activities */}
              {activity.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => openDeleteDialog(activity.id)}
                >
                  <Trash2 size={16} color={COLORS.error} />
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowAddModal(false); resetForm(); }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Activity</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <X size={24} color={COLORS.textPrimary} />
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
              label="Activity Title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Machine Learning Workshop"
              error={formErrors.title}
              required
            />

            <FormInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe your activity..."
              multiline
              numberOfLines={4}
              error={formErrors.description}
              required
            />

            {/* Category Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.pickerButtonText}>{CATEGORY_LABELS[formData.category]}</Text>
                <ChevronDown size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.pickerOptions}>
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.pickerOption,
                        formData.category === category && styles.pickerOptionSelected
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, category }));
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.category === category && styles.pickerOptionTextSelected
                      ]}>
                        {CATEGORY_LABELS[category]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <FormInput
              label="Activity Date"
              value={formData.activity_date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, activity_date: text }))}
              placeholder="YYYY-MM-DD"
              error={formErrors.activity_date}
              required
            />

            <FormInput
              label="Location"
              value={formData.location || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="e.g., Computer Lab, Online"
            />

            <FormInput
              label="Proof URL"
              value={formData.proof_url || ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, proof_url: text }))}
              placeholder="Link to certificate or proof"
              keyboardType="default"
              autoCapitalize="none"
              error={formErrors.proof_url}
              required
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitActivity}
              disabled={submitting}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.submitButtonGradient}>
                {submitting ? (
                  <LoadingSpinner />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Activity</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteActivity}
        onCancel={() => { setShowDeleteDialog(false); setSelectedActivityId(null); }}
        loading={deleting}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: 12,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: COLORS.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  activityDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pointsBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  rejectionContainer: {
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#991B1B',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deleteText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
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
  modalContent: {
    flex: 1,
    padding: 24,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pickerOptions: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  pickerOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pickerOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
