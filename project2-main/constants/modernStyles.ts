import { COLORS } from '@/constants/colors';
import { ViewStyle, TextStyle } from 'react-native';

export const MODERN_STYLES = {
  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  } as ViewStyle,

  cardLarge: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  } as ViewStyle,

  // Button styles
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,

  secondaryButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 24,
  } as ViewStyle,

  // Badge/Stat box styles
  statBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  } as ViewStyle,

  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  } as ViewStyle,

  section: {
    marginVertical: 20,
    paddingHorizontal: 16,
  } as ViewStyle,

  // Text styles
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
  } as TextStyle,

  subheading: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 12,
  } as TextStyle,

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: 'Inter-Bold',
  } as TextStyle,

  body: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  } as TextStyle,

  small: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Medium',
  } as TextStyle,
};

export const getStatBoxStyle = (color: string) => ({
  ...MODERN_STYLES.statBox,
  borderLeftColor: color,
  backgroundColor: color + '08',
});

export const getBackgroundColor = (color: string, opacity: number = 0.1) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
