import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useListStore, useOptimizationStore } from '../../stores/AppStore';
import { ShoppingListStatus } from '../../domain/entities/ShoppingList';

interface HistoryStats {
  totalLists: number;
  totalPlans: number;
  totalSaved: number;
  averageSavings: number;
}

const STATUS_CONFIG: Record<ShoppingListStatus, { label: string; color: string }> = {
  [ShoppingListStatus.DRAFT]: { label: 'Borrador', color: colors.textTertiary },
  [ShoppingListStatus.PARSED]: { label: 'Analizada', color: colors.info },
  [ShoppingListStatus.REVIEWED]: { label: 'Revisada', color: colors.primary },
  [ShoppingListStatus.OPTIMIZED]: { label: 'Optimizada', color: colors.savings },
  [ShoppingListStatus.IN_PROGRESS]: { label: 'En progreso', color: colors.warning },
  [ShoppingListStatus.COMPLETED]: { label: 'Completada', color: colors.success },
};

export default function HistoryScreen() {
  const { lists } = useListStore();
  const { plans } = useOptimizationStore();

  const stats: HistoryStats = {
    totalLists: lists.length,
    totalPlans: plans.length,
    totalSaved: plans.reduce((sum, plan) => sum + (plan.estimatedSavings?.toDecimal() ?? 0), 0),
    averageSavings:
      plans.length > 0
        ? plans.reduce((sum, plan) => sum + (plan.estimatedSavings?.toDecimal() ?? 0), 0) /
          plans.length
        : 0,
  };

  const hasHistory = lists.length > 0 || plans.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!hasHistory ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Sin historial</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán tus listas anteriores y los planes generados.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(shopping)/create-list')}
            >
              <Text style={styles.emptyButtonText}>Crear primera lista</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Statistics */}
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="list"
                value={stats.totalLists}
                label="Listas"
                color={colors.primary}
              />
              <StatCard
                icon="map"
                value={stats.totalPlans}
                label="Planes"
                color={colors.secondary}
              />
              <StatCard
                icon="wallet"
                value={`$${stats.totalSaved.toFixed(0)}`}
                label="Ahorrado"
                color={colors.savings}
              />
              <StatCard
                icon="trending-down"
                value={`$${stats.averageSavings.toFixed(0)}`}
                label="Promedio"
                color={colors.warning}
              />
            </View>

            {/* Past Lists */}
            {lists.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Listas anteriores</Text>
                {lists.map((list) => {
                  const statusInfo = STATUS_CONFIG[list.status];
                  return (
                    <TouchableOpacity
                      key={list.id}
                      style={styles.historyCard}
                      onPress={() => {
                        router.push('/(shopping)/list-detail');
                      }}
                    >
                      <View style={styles.historyCardHeader}>
                        <View style={styles.historyCardIcon}>
                          <Ionicons name="list" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.historyCardInfo}>
                          <Text style={styles.historyCardTitle} numberOfLines={1}>
                            {list.title}
                          </Text>
                          <Text style={styles.historyCardMeta}>
                            {list.itemCount} producto{list.itemCount !== 1 ? 's' : ''} ·{' '}
                            <Text style={{ color: statusInfo.color }}>{statusInfo.label}</Text>
                          </Text>
                        </View>
                        <Text style={styles.historyCardDate}>
                          {list.createdAt.toLocaleDateString('es-MX', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {/* Past Plans */}
            {plans.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Planes anteriores</Text>
                {plans.map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.historyCard}
                    onPress={() => router.push('/(shopping)/plan-results')}
                  >
                    <View style={styles.historyCardHeader}>
                      <View style={styles.historyCardIcon}>
                        <Ionicons
                          name={
                            plan.mode === 'MAXIMUM_SAVINGS'
                              ? 'trending-down'
                              : plan.mode === 'BALANCED'
                                ? 'scale'
                                : 'speedometer'
                          }
                          size={18}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.historyCardInfo}>
                        <Text style={styles.historyCardTitle} numberOfLines={1}>
                          {plan.mode === 'MAXIMUM_SAVINGS'
                            ? 'Máximo ahorro'
                            : plan.mode === 'BALANCED'
                              ? 'Equilibrado'
                              : 'Máxima comodidad'}
                        </Text>
                        <Text style={styles.historyCardMeta}>
                          ${plan.effectiveTotalCost.toDecimal().toFixed(2)} · {plan.numberOfStores}{' '}
                          tienda{plan.numberOfStores > 1 ? 's' : ''} · {plan.totalTimeMinutes} min
                        </Text>
                      </View>
                      {plan.estimatedSavings && plan.estimatedSavings.toDecimal() > 0 && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>
                            -${plan.estimatedSavings.toDecimal().toFixed(0)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stat Card Component ───

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
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: spacing.xs },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: { width: 32 },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  emptyButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // History cards
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCardInfo: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyCardMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyCardDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  savingsBadge: {
    backgroundColor: colors.savingsLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  savingsBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.savings,
  },
});
