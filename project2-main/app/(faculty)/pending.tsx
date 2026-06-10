import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, User, Calendar, Tag, CheckCircle, XCircle } from 'lucide-react-native';
import { COLORS, getCategoryColor } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { Activity, ActivityCategory } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import ApprovalModal from '@/components/ApprovalModal';

const CATEGORIES: Array<{ value: ActivityCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'competition', label: 'Competition' },
  { value: 'certification', label: 'Certification' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'social_service', label: 'Social Service' },
  { value: 'internship', label: 'Internship' },
  { value: 'other', label: 'Other' },
];

export default function PendingApprovals() {
  const { pendingActivities, activitiesLoading, fetchPendingActivities, approveActivity, rejectActivity } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingActivities();
    setRefreshing(false);
  };

  const handleApprove = async (activityId: string, points: number) => {
    setApproving(true);
    const result = await approveActivity(activityId, points);
    setApproving(false);
    
    if (result.success) {
      setShowApprovalModal(false);
      setSelectedActivity(null);
    }
    
    return result;
  };

  const handleReject = async (activityId: string, reason: string) => {
    setApproving(true);
    const result = await rejectActivity(activityId, reason);
    setApproving(false);
    
    if (result.success) {
      setShowApprovalModal(false);
      setSelectedActivity(null);
    }
    
    return result;
  };

  const filteredActivities = pendingActivities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openApprovalModal = (activity: any) => {
    setSelectedActivity(activity);
    setShowApprovalModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <Text style={styles.headerSubtitle}>{filteredActivities.length} activities to review</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search activities..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.filterChip,
              selectedCategory === category.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === category.value && styles.filterChipTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Activities List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activitiesLoading ? (
          <LoadingSpinner />
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            title="No pending activities"
            message="All activities have been reviewed"
            icon="inbox"
          />
        ) : (
          filteredActivities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => openApprovalModal(activity)}
            >
              <View style={styles.activityHeader}>
                <View style={styles.categoryBadge}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(activity.category) },
                    ]}
                  />
                  <Text style={styles.categoryText}>{activity.category}</Text>
                </View>
                <StatusBadge status={activity.status} />
              </View>

              <Text style={styles.activityTitle}>{activity.title}</Text>
              
              {activity.description && (
                <Text style={styles.activityDescription} numberOfLines={2}>
                  {activity.description}
                </Text>
              )}

              <View style={styles.activityMeta}>
                <View style={styles.metaItem}>
                  <User size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>
                    {(activity as any).student?.full_name || 'Student'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{new Date(activity.activity_date).toLocaleDateString()}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => openApprovalModal(activity)}
                >
                  <CheckCircle size={18} color={COLORS.success} />
                  <Text style={styles.approveBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Approval Modal */}
      <ApprovalModal
        visible={showApprovalModal}
        activity={selectedActivity}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedActivity(null);
        }}
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'capitalize',
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
  activityMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveBtn: {
    backgroundColor: COLORS.successLight,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  bottomPadding: {
    height: 40,
  },
});
