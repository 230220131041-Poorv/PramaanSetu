// Brand Colors
export const COLORS = {
  // Primary
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  
  // Secondary/Accent
  secondary: '#4338CA',
  accent: '#7C3AED',
  
  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // Neutral/Gray Scale
  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Text Colors
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  
  // Specific Use
  cardShadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Category Colors (for charts/badges)
  categoryWorkshop: '#2563EB',
  categoryCompetition: '#059669',
  categoryCertification: '#F59E0B',
  categorySeminar: '#DC2626',
  categorySports: '#7C3AED',
  categoryCultural: '#EC4899',
  categorySocialService: '#14B8A6',
  categoryInternship: '#F97316',
  categoryOther: '#6B7280',
};

// Gradient presets
export const GRADIENTS = {
  primary: ['#2563EB', '#4338CA'] as const,
  secondary: ['#4338CA', '#7C3AED'] as const,
  success: ['#059669', '#10B981'] as const,
  danger: ['#DC2626', '#EF4444'] as const,
  warning: ['#D97706', '#F59E0B'] as const,
  purple: ['#7C3AED', '#8B5CF6'] as const,
};

// Status color mapping
export const STATUS_COLORS = {
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.error,
} as const;

// Get category color
export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    workshop: COLORS.categoryWorkshop,
    competition: COLORS.categoryCompetition,
    certification: COLORS.categoryCertification,
    seminar: COLORS.categorySeminar,
    sports: COLORS.categorySports,
    cultural: COLORS.categoryCultural,
    social_service: COLORS.categorySocialService,
    internship: COLORS.categoryInternship,
    other: COLORS.categoryOther,
  };
  return categoryColors[category] || COLORS.categoryOther;
};
