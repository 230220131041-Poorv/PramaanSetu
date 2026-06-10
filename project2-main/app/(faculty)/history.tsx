import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Calendar, CheckCircle, XCircle, Star, User } from 'lucide-react-native';
import { COLORS, getCategoryColor, STATUS_COLORS } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { Activity, ActivityStatus } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';

const STATUS_FILTERS: Array<{ value: ActivityStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ApprovalHistory() {
  const { facultyHistory, historyLoading, fetchFacultyHistory } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | 'all'>('all');

  useEffect(() => {
    fetchFacultyHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFacultyHistory();
    setRefreshing(false);
  };

  const filteredHistory = facultyHistory.filter((activity: any) => {
    const studentName = activity.profiles?.full_name || activity.student?.full_name || '';
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review History</Text>
        <Text style={styles.headerSubtitle}>{facultyHistory.length} total reviews</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by activity or student..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              selectedStatus === filter.value && styles.filterChipActive,
              selectedStatus === filter.value && filter.value === 'approved' && styles.filterChipApproved,
              selectedStatus === filter.value && filter.value === 'rejected' && styles.filterChipRejected,
            ]}
            onPress={() => setSelectedStatus(filter.value)}
          >
            {filter.value === 'approved' && <CheckCircle size={14} color={selectedStatus === filter.value ? COLORS.white : COLORS.success} />}
            {filter.value === 'rejected' && <XCircle size={14} color={selectedStatus === filter.value ? COLORS.white : COLORS.error} />}
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {historyLoading ? (
          <LoadingSpinner />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            title="No history found"
            message="Your reviewed activities will appear here"
            icon="inbox"
          />
        ) : (
          filteredHistory.map((activity: any) => (
            <View key={activity.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
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

              <View style={styles.studentInfo}>
                <User size={14} color={COLORS.textMuted} />
                <Text style={styles.studentName}>{activity.profiles?.full_name || activity.student?.full_name || 'Student'}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{new Date(activity.activity_date || activity.approved_at).toLocaleDateString()}</Text>
                </View>
                {activity.status === 'approved' && activity.points > 0 && (
                  <View style={styles.pointsBadge}>
                    <Star size={14} color={COLORS.warning} />
                    <Text style={styles.pointsText}>{activity.points} pts</Text>
                  </View>
                )}
                {activity.status === 'rejected' && activity.rejection_reason && (
                  <Text style={styles.rejectionText} numberOfLines={1}>
                    Reason: {activity.rejection_reason}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipApproved: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  filterChipRejected: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
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
  historyCard: {
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
  cardHeader: {
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  studentName: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.warning,
  },
  rejectionText: {
    fontSize: 12,
    color: COLORS.error,
    flex: 1,
    textAlign: 'right',
  },
  bottomPadding: {
    height: 40,
  },
});
