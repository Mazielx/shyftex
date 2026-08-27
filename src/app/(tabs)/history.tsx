import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
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
import { useListStore, useOptimizationStore } from '../../stores/AppStore';
import { ShoppingListStatus } from '../../domain/entities/ShoppingList';

interface HistoryStats {
  totalLists: number;
  totalPlans: number;
  totalSaved: number;
  averageSavings: number;
}

const STATUS_CONFIG: Record<ShoppingListStatus, { label: string; color: string; bg: string }> = {
  [ShoppingListStatus.DRAFT]: {
    label: 'Borrador',
    color: colors.textTertiary,
    bg: colors.surfaceVariant,
  },
  [ShoppingListStatus.PARSED]: {
    label: 'Analizada',
    color: colors.info,
    bg: colors.infoLight,
  },
  [ShoppingListStatus.REVIEWED]: {
    label: 'Revisada',
    color: colors.primary,
    bg: colors.primaryLight,
  },
  [ShoppingListStatus.OPTIMIZED]: {
    label: 'Optimizada',
    color: colors.success,
    bg: colors.successLight,
  },
  [ShoppingListStatus.IN_PROGRESS]: {
    label: 'En progreso',
    color: colors.warning,
    bg: colors.warningLight,
  },
  [ShoppingListStatus.COMPLETED]: {
    label: 'Completada',
    color: colors.success,
    bg: colors.successLight,
  },
};

const PLAN_MODE_LABELS: Record<string, { label: string; icon: string }> = {
  MAXIMUM_SAVINGS: { label: 'Máximo ahorro', icon: 'trending-down' },
  BALANCED: { label: 'Equilibrado', icon: 'scale' },
  MAXIMUM_CONVENIENCE: { label: 'Máxima comodidad', icon: 'speedometer' },
};

export default function HistoryScreen() {
  const { lists } = useListStore();
  const { plans } = useOptimizationStore();

  const stats: HistoryStats = {
    totalLists: lists.length,
    totalPlans: plans.length,
    totalSaved: plans.reduce(
      (sum, plan) => sum + (plan.estimatedSavings?.toDecimal() ?? 0),
      0,
    ),
    averageSavings:
      plans.length > 0
        ? plans.reduce(
            (sum, plan) => sum + (plan.estimatedSavings?.toDecimal() ?? 0),
            0,
          ) / plans.length
        : 0,
  };

  const hasHistory = lists.length > 0 || plans.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasHistory ? (
          /* ─── Empty State ─── */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconRing}>
              <Ionicons
                name="time-outline"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>Sin historial aún</Text>
            <Text style={styles.emptyDescription}>
              Aquí aparecerán tus listas anteriores y los planes de optimización generados.
            </Text>
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.7}
              onPress={() => router.push('/(shopping)/create-list')}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.textInverse} />
              <Text style={styles.emptyCTAText}>Crear primera lista</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ─── Stats Summary ─── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resumen</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  icon="list-outline"
                  value={stats.totalLists}
                  label="Listas"
                  color={colors.primary}
                />
                <StatCard
                  icon="map-outline"
                  value={stats.totalPlans}
                  label="Planes"
                  color={colors.secondary}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  icon="wallet-outline"
                  value={formatCurrency(stats.totalSaved)}
                  label="Total ahorrado"
                  color={colors.savings}
                />
                <StatCard
                  icon="trending-down-outline"
                  value={formatCurrency(stats.averageSavings)}
                  label="Ahorro promedio"
                  color={colors.warning}
                />
              </View>
            </View>

            {/* ─── Lists Section ─── */}
            {lists.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Listas</Text>
                  <Text style={styles.sectionCount}>{lists.length}</Text>
                </View>
                {lists.map((list) => {
                  const statusInfo = STATUS_CONFIG[list.status];
                  return (
                    <TouchableOpacity
                      key={list.id}
                      style={styles.card}
                      activeOpacity={0.6}
                      onPress={() =>
                        router.push({
                          pathname: '/(shopping)/list-detail',
                          params: { id: list.id },
                        })
                      }
                    >
                      <View style={styles.cardIcon}>
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {list.title}
                        </Text>
                        <Text style={styles.cardMeta}>
                          {list.itemCount} producto
                          {list.itemCount !== 1 ? 's' : ''}{' '}
                          <Text style={styles.metaDot}>·</Text>{' '}
                          <Text style={{ color: statusInfo.color }}>
                            {statusInfo.label}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.cardRight}>
                        <Text style={styles.cardDate}>
                          {list.createdAt.toLocaleDateString('es-MX', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textTertiary}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* ─── Plans Section ─── */}
            {plans.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Planes</Text>
                  <Text style={styles.sectionCount}>{plans.length}</Text>
                </View>
                {plans.map((plan) => {
                  const modeInfo =
                    PLAN_MODE_LABELS[plan.mode] ?? PLAN_MODE_LABELS.BALANCED;
                  const hasSavings =
                    plan.estimatedSavings &&
                    plan.estimatedSavings.toDecimal() > 0;

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={styles.card}
                      activeOpacity={0.6}
                      onPress={() =>
                        router.push({
                          pathname: '/(shopping)/plan-results',
                          params: { id: plan.id },
                        })
                      }
                    >
                      <View style={styles.cardIcon}>
                        <Ionicons
                          name={modeInfo.icon as keyof typeof Ionicons.glyphMap}
                          size={20}
                          color={colors.secondary}
                        />
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {modeInfo.label}
                        </Text>
                        <Text style={styles.cardMeta}>
                          {formatCurrency(plan.effectiveTotalCost.toDecimal())}{' '}
                          <Text style={styles.metaDot}>·</Text>{' '}
                          {plan.numberOfStores} tienda
                          {plan.numberOfStores > 1 ? 's' : ''}{' '}
                          <Text style={styles.metaDot}>·</Text>{' '}
                          {plan.totalTimeMinutes} min
                        </Text>
                      </View>
                      <View style={styles.cardRight}>
                        {hasSavings && (
                          <View style={styles.savingsBadge}>
                            <Ionicons
                              name="arrow-down"
                              size={12}
                              color={colors.savings}
                            />
                            <Text style={styles.savingsBadgeText}>
                              {formatCurrency(
                                plan.estimatedSavings!.toDecimal(),
                              )}
                            </Text>
                          </View>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textTertiary}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Card ───

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '14' }]}>
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={color}
        />
      </View>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
  },

  // Scroll
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },

  // Stats Grid
  statsGrid: {
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.xs,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // History Cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.xs,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaDot: {
    color: colors.textTertiary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  cardDate: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textTertiary,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.savingsLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  savingsBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.savings,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxxxl + spacing.xxxl,
    paddingHorizontal: spacing.xxl,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    marginTop: spacing.xxl,
    gap: spacing.sm,
    ...shadows.sm,
  },
  emptyCTAText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textInverse,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: spacing.xxl,
  },
});
