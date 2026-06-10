import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, Award, Calendar, MapPin, User, FileText, CheckCircle, XCircle } from 'lucide-react-native';
import { Activity, CATEGORY_LABELS } from '@/types';
import { COLORS, getCategoryColor } from '@/constants/colors';
import StatusBadge from './StatusBadge';

interface ApprovalModalProps {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
  onApprove: (activityId: string, points: number) => Promise<{ success: boolean; error?: string }>;
  onReject: (activityId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ApprovalModal({
  visible,
  activity,
  onClose,
  onApprove,
  onReject,
}: ApprovalModalProps) {
  const [points, setPoints] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'approve' | 'reject'>('approve');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    if (!activity) return;
    
    const pointsNum = parseInt(points, 10);
    if (isNaN(pointsNum) || pointsNum < 1 || pointsNum > 100) {
      setError('Please enter points between 1 and 100');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await onApprove(activity.id, pointsNum);
    
    if (result.success) {
      resetAndClose();
    } else {
      setError(result.error || 'Failed to approve activity');
    }
    
    setLoading(false);
  };

  const handleReject = async () => {
    if (!activity) return;
    
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const result = await onReject(activity.id, rejectionReason.trim());
    
    if (result.success) {
      resetAndClose();
    } else {
      setError(result.error || 'Failed to reject activity');
    }
    
    setLoading(false);
  };

  const resetAndClose = () => {
    setPoints('');
    setRejectionReason('');
    setActiveTab('approve');
    setError('');
    onClose();
  };

  if (!activity) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review Activity</Text>
          <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
            <X size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Activity Details */}
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(activity.category) + '20' }]}>
                <Text style={[styles.categoryText, { color: getCategoryColor(activity.category) }]}>
                  {CATEGORY_LABELS[activity.category]}
                </Text>
              </View>
              <StatusBadge status={activity.status} />
            </View>
            
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityDescription}>{activity.description}</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <User size={16} color={COLORS.textMuted} />
                <Text style={styles.detailText}>{activity.student_name || 'Student'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Calendar size={16} color={COLORS.textMuted} />
                <Text style={styles.detailText}>{activity.activity_date}</Text>
              </View>
              {activity.location && (
                <View style={styles.detailItem}>
                  <MapPin size={16} color={COLORS.textMuted} />
                  <Text style={styles.detailText}>{activity.location}</Text>
                </View>
              )}
              {activity.proof_url && (
                <View style={styles.detailItem}>
                  <FileText size={16} color={COLORS.textMuted} />
                  <Text style={[styles.detailText, styles.link]}>View Proof</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'approve' && styles.tabActive]}
              onPress={() => { setActiveTab('approve'); setError(''); }}
            >
              <CheckCircle size={20} color={activeTab === 'approve' ? COLORS.success : COLORS.textMuted} />
              <Text style={[styles.tabText, activeTab === 'approve' && styles.tabTextActive]}>
                Approve
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'reject' && styles.tabActive]}
              onPress={() => { setActiveTab('reject'); setError(''); }}
            >
              <XCircle size={20} color={activeTab === 'reject' ? COLORS.error : COLORS.textMuted} />
              <Text style={[styles.tabText, activeTab === 'reject' && styles.tabTextActive]}>
                Reject
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Form */}
          <View style={styles.actionForm}>
            {activeTab === 'approve' ? (
              <>
                <Text style={styles.inputLabel}>Award Points (1-100) *</Text>
                <View style={styles.pointsInputContainer}>
                  <Award size={20} color={COLORS.warning} />
                  <TextInput
                    style={styles.pointsInput}
                    value={points}
                    onChangeText={setPoints}
                    placeholder="Enter points"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
                <Text style={styles.helperText}>
                  Points will be added to the student's total score
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Rejection Reason *</Text>
                <TextInput
                  style={styles.reasonInput}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="Provide a reason for rejection..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.helperText}>
                  This reason will be visible to the student
                </Text>
              </>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: activeTab === 'approve' ? COLORS.success : COLORS.error }
            ]}
            onPress={activeTab === 'approve' ? handleApprove : handleReject}
            disabled={loading}
          >
            {activeTab === 'approve' ? (
              <CheckCircle size={20} color={COLORS.white} />
            ) : (
              <XCircle size={20} color={COLORS.white} />
            )}
            <Text style={styles.actionButtonText}>
              {loading ? 'Processing...' : activeTab === 'approve' ? 'Approve Activity' : 'Reject Activity'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  activityCard: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.borderLight,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  actionForm: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  pointsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  pointsInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingVertical: 14,
  },
  reasonInput: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 120,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: COLORS.errorLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
