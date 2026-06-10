import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, CheckCircle } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

interface VerificationBadgeProps {
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function VerificationBadge({
  isVerified,
  verifiedBy,
  verifiedAt,
  size = 'medium',
  showLabel = true,
}: VerificationBadgeProps) {
  const sizeConfig = {
    small: { iconSize: 12, fontSize: 10, padding: 4 },
    medium: { iconSize: 16, fontSize: 12, padding: 6 },
    large: { iconSize: 20, fontSize: 14, padding: 8 },
  };

  const config = sizeConfig[size];

  if (!isVerified) {
    return null;
  }

  return (
    <View style={[styles.container, { padding: config.padding }]}>
      <View style={styles.badge}>
        <CheckCircle size={config.iconSize} color={COLORS.success} />
        {showLabel && (
          <Text style={[styles.label, { fontSize: config.fontSize }]}>Verified</Text>
        )}
      </View>
      {(verifiedBy || verifiedAt) && size !== 'small' && (
        <View style={styles.details}>
          {verifiedBy && (
            <Text style={styles.verifiedBy}>by {verifiedBy}</Text>
          )}
          {verifiedAt && (
            <Text style={styles.verifiedAt}>
              {new Date(verifiedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// Inline badge for use within text/cards
export function VerifiedBadgeInline({ size = 14 }: { size?: number }) {
  return (
    <View style={styles.inlineBadge}>
      <CheckCircle size={size} color={COLORS.success} />
    </View>
  );
}

// Full verification stamp for portfolio
export function VerificationStamp({ 
  institutionName, 
  verificationDate,
  verificationId,
}: { 
  institutionName: string;
  verificationDate: string;
  verificationId: string;
}) {
  return (
    <View style={styles.stamp}>
      <View style={styles.stampHeader}>
        <Shield size={24} color={COLORS.success} />
        <Text style={styles.stampTitle}>Verified Portfolio</Text>
      </View>
      <View style={styles.stampContent}>
        <View style={styles.stampRow}>
          <Text style={styles.stampLabel}>Institution</Text>
          <Text style={styles.stampValue}>{institutionName}</Text>
        </View>
        <View style={styles.stampRow}>
          <Text style={styles.stampLabel}>Verified On</Text>
          <Text style={styles.stampValue}>
            {new Date(verificationDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.stampRow}>
          <Text style={styles.stampLabel}>Verification ID</Text>
          <Text style={[styles.stampValue, styles.stampId]}>{verificationId}</Text>
        </View>
      </View>
      <View style={styles.stampFooter}>
        <CheckCircle size={14} color={COLORS.success} />
        <Text style={styles.stampFooterText}>
          All activities in this portfolio have been verified by the institution
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.successLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: COLORS.success,
    fontWeight: '600',
  },
  details: {
    marginTop: 4,
  },
  verifiedBy: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  verifiedAt: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  inlineBadge: {
    marginLeft: 4,
  },
  // Stamp styles
  stamp: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.success,
    borderStyle: 'dashed',
    padding: 16,
  },
  stampHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stampTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  stampContent: {
    gap: 8,
  },
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stampLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  stampValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stampId: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  stampFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  stampFooterText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
