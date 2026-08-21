import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useOptimizationStore } from '../../stores/AppStore';
import { ShoppingPlan } from '../../domain/entities/ShoppingPlan';

export default function PlansScreen() {
  const { plans } = useOptimizationStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No hay planes</Text>
            <Text style={styles.emptyText}>
              Crea una lista y optimiza tu compra para ver los planes aquí.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(shopping)/create-list')}
            >
              <Text style={styles.emptyButtonText}>Crear lista</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Tus planes</Text>
            {plans.map((plan: ShoppingPlan) => (
              <TouchableOpacity
                key={plan.id}
                style={styles.planCard}
                onPress={() => router.push('/(shopping)/plan-results')}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planMode}>
                    <Ionicons
                      name={
                        plan.mode === 'MAXIMUM_SAVINGS'
                          ? 'trending-down'
                          : plan.mode === 'BALANCED'
                            ? 'scale'
                            : 'speedometer'
                      }
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.planModeText}>
                      {plan.mode === 'MAXIMUM_SAVINGS'
                        ? 'Máximo ahorro'
                        : plan.mode === 'BALANCED'
                          ? 'Equilibrado'
                          : 'Máxima comodidad'}
                    </Text>
                  </View>
                  {plan.estimatedSavings && plan.estimatedSavings.toDecimal() > 0 && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsBadgeText}>
                        -${plan.estimatedSavings.toDecimal().toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.planCost}>
                  ${plan.effectiveTotalCost.toDecimal().toFixed(2)} total
                </Text>

                <View style={styles.planMeta}>
                  <Text style={styles.planMetaText}>
                    {plan.numberOfStores} tienda{plan.numberOfStores > 1 ? 's' : ''} ·{' '}
                    {plan.totalTimeMinutes} min · {plan.totalDistanceKm.toFixed(1)} km
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
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
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planModeText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  savingsBadge: {
    backgroundColor: colors.savingsLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingsBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.savings,
  },
  planCost: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  planMeta: {},
  planMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});
