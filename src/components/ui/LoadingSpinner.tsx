import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../config/theme';

type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  message?: string;
  size?: SpinnerSize;
}

const SPINNER_SIZE_MAP: Record<SpinnerSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
};

export function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={SPINNER_SIZE_MAP[size]} color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
