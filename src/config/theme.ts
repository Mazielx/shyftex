/**
 * Theme configuration.
 * Design system for the Shopping Optimizer app.
 */

export const colors = {
  // Primary
  primary: '#1B7A3D', // Green (savings, success)
  primaryLight: '#E8F5E9',
  primaryDark: '#0D5225',

  // Secondary
  secondary: '#1565C0', // Blue (info, links)
  secondaryLight: '#E3F2FD',

  // Neutrals
  white: '#FFFFFF',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceVariant: '#FAFAFA',
  border: '#E0E0E0',
  borderLight: '#F0F0F0',

  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',
  textLink: '#1565C0',

  // Semantic
  success: '#1B7A3D',
  successLight: '#E8F5E9',
  warning: '#F57C00',
  warningLight: '#FFF3E0',
  error: '#D32F2F',
  errorLight: '#FFEBEE',
  info: '#1565C0',
  infoLight: '#E3F2FD',

  // Savings
  savings: '#1B7A3D',
  savingsLight: '#E8F5E9',
  savingsText: '#2E7D32',

  // Status
  inStock: '#1B7A3D',
  lowStock: '#F57C00',
  outOfStock: '#D32F2F',
  unknown: '#9E9E9E',

  // Confidence
  confirmed: '#1B7A3D',
  recent: '#1565C0',
  estimated: '#F57C00',
  stale: '#D32F2F',
  unverified: '#9E9E9E',
};

export const typography = {
  fontFamily: {
    regular: 'Inter',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

// Common style presets
export const commonStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
};
