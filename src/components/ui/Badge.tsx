import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'filled' | 'outlined';

export interface BadgeProps {
  label: string;
  color?: string;
  size?: BadgeSize;
  variant?: BadgeVariant;
}

const SIZE_CONFIG: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: { paddingH: spacing.sm, paddingV: 2, fontSize: typography.fontSize.xs },
  md: { paddingH: spacing.md, paddingV: spacing.xs, fontSize: typography.fontSize.sm },
  lg: { paddingH: spacing.lg, paddingV: spacing.sm, fontSize: typography.fontSize.md },
};

export function Badge({
  label,
  color = colors.primary,
  size = 'md',
  variant = 'filled',
}: BadgeProps): React.JSX.Element {
  const sizeConfig = SIZE_CONFIG[size];
  const isFilled = variant === 'filled';

  return (
    <View
      style={[
        styles.base,
        {
          paddingHorizontal: sizeConfig.paddingH,
          paddingVertical: sizeConfig.paddingV,
          backgroundColor: isFilled ? color + '20' : 'transparent',
          borderWidth: isFilled ? 0 : 1,
          borderColor: color,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            fontSize: sizeConfig.fontSize,
            color,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
  },
  label: {
    fontWeight: '600',
  },
});
