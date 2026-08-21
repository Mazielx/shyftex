import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../config/theme';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    label: string;
    onPress: () => void;
  };
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({
  title,
  subtitle,
  leftAction,
  rightAction,
  showBack = false,
  onBack,
}: HeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {/* Left side */}
        <View style={styles.side}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
          )}
          {leftAction && (
            <TouchableOpacity onPress={leftAction.onPress}>
              <Text style={styles.actionText}>{leftAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Center */}
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right side */}
        <View style={styles.side}>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress}>
              <Text style={styles.actionText}>{rightAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  side: {
    width: 80,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '300',
  },
  actionText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: '500',
  },
});
