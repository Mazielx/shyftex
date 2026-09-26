import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  commonStyles,
  formatCurrency,
} from '../../config/theme';
import { useOptimizationStore } from '../../stores/AppStore';
import { ShoppingPlan } from '../../domain/entities/ShoppingPlan';
import { LocalizedText as Text } from '../../components/LocalizedText';

const MODE_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bgColor: string }
> = {
  MAXIMUM_SAVINGS: {
    icon: 'trending-down',
    label: 'Maximo ahorro',
    color: colors.savings,
    bgColor: colors.savingsLight,
  },
  BALANCED: {
    icon: 'scale',
    label: 'Equilibrado',
    color: colors.secondary,
    bgColor: colors.secondaryLight,
  },
  TIME_SAVING: {
    icon: 'speedometer',
    label: 'Maxima comodidad',
    color: colors.warning,
    bgColor: colors.warningLight,
  },
};

function getModeConfig(mode: string) {
  return (
    MODE_CONFIG[mode] ?? {
      icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
      label: mode,
      color: colors.textTertiary,
      bgColor: colors.borderLight,
    }
  );
}

function PlanCard({ plan, onPress }: { plan: ShoppingPlan; onPress: () => void }) {
  const mode = getModeConfig(plan.mode);
  const savings = plan.estimatedSavings?.toDecimal() ?? 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={[styles.modeChip, { backgroundColor: mode.bgColor }]}>
          <Ionicons name={mode.icon} size={16} color={mode.color} />
          <Text style={[styles.modeLabel, { color: mode.color }]}>{mode.label}</Text>
        </View>
        {savings > 0 && (
          <View style={styles.savingsBadge}>
            <Ionicons name="arrow-down" size={12} color={colors.savingsText} />
            <Text style={styles.savingsBadgeText}>{formatCurrency(savings)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cost}>{formatCurrency(plan.effectiveTotalCost.toDecimal())}</Text>

      <View style={styles.metaRow}>
        <MetaItem icon="storefront-outline" value={`${plan.numberOfStores} tienda${plan.numberOfStores > 1 ? 's' : ''}`} />
        <View style={styles.metaDot} />
        <MetaItem icon="time-outline" value={`${plan.totalTimeMinutes} min`} />
        <View style={styles.metaDot} />
        <MetaItem icon="navigate-outline" value={`${plan.totalDistanceKm.toFixed(1)} km`} />
      </View>

      <View style={styles.cardArrow}>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

function MetaItem({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={colors.textTertiary} />
      <Text style={styles.metaText}>{value}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="map-outline" size={48} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No hay planes</Text>
      <Text style={styles.emptyDescription}>
        Crea una lista de compra y optimiza tus rutas para generar planes personalizados.
      </Text>
      <TouchableOpacity
        style={styles.emptyCta}
        activeOpacity={0.8}
        onPress={() => router.push('/(shopping)/create-list')}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
        <Text style={styles.emptyCtaText}>Crear lista</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PlansScreen() {
  const { plans } = useOptimizationStore();

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tus planes</Text>
        {plans.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{plans.length}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {plans.length === 0 ? (
          <EmptyState />
        ) : (
          plans.map((plan: ShoppingPlan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => router.push('/(shopping)/plan-results')}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  countText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  modeLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  savingsBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.savingsText,
  },
  cost: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.textTertiary,
  },
  cardArrow: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxxl + spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    paddingHorizontal: spacing.lg,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.xxl,
    ...shadows.sm,
  },
  emptyCtaText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },
});
