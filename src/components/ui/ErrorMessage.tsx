import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorMessageProps {
  message: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
}

const SEVERITY_CONFIG: Record<
  ErrorSeverity,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }
> = {
  error: { icon: 'alert-circle', color: colors.error, bgColor: colors.errorLight },
  warning: { icon: 'warning', color: colors.warning, bgColor: colors.warningLight },
  info: { icon: 'information-circle', color: colors.info, bgColor: colors.infoLight },
};

export function ErrorMessage({
  message,
  severity = 'error',
  onRetry,
}: ErrorMessageProps): React.JSX.Element {
  const config = SEVERITY_CONFIG[severity];

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Ionicons name={config.icon} size={24} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: config.color }]}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={16} color={config.color} />
          <Text style={[styles.retryText, { color: config.color }]}>Reintentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  message: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
});
