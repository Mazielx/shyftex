import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const VARIANT_CONFIG: Record<
  ButtonVariant,
  { bg: string; text: string; border?: string; disabledBg: string }
> = {
  primary: {
    bg: colors.primary,
    text: colors.textInverse,
    disabledBg: colors.primary + '60',
  },
  secondary: {
    bg: colors.surface,
    text: colors.primary,
    border: colors.border,
    disabledBg: colors.surfaceVariant,
  },
  danger: {
    bg: colors.error,
    text: colors.textInverse,
    disabledBg: colors.error + '60',
  },
  ghost: {
    bg: 'transparent',
    text: colors.primary,
    disabledBg: 'transparent',
  },
};

const SIZE_CONFIG: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number }> = {
  sm: { paddingV: spacing.sm, paddingH: spacing.md, fontSize: typography.fontSize.sm },
  md: { paddingV: spacing.md, paddingH: spacing.xl, fontSize: typography.fontSize.md },
  lg: { paddingV: spacing.lg, paddingH: spacing.xxl, fontSize: typography.fontSize.lg },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
  testID,
}: ButtonProps): React.JSX.Element {
  const variantConfig = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: isDisabled ? variantConfig.disabledBg : variantConfig.bg,
          borderWidth: variantConfig.border ? 1 : 0,
          borderColor: variantConfig.border,
          paddingVertical: sizeConfig.paddingV,
          paddingHorizontal: sizeConfig.paddingH,
          opacity: isDisabled ? 0.7 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantConfig.text} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              {
                fontSize: sizeConfig.fontSize,
                color: variantConfig.text,
                marginLeft: icon ? spacing.sm : 0,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: '600',
  },
});
