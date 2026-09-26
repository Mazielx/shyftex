import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography, formatCurrency } from '../../config/theme';
import { useOptimizationStore, useMissionStore } from '../../stores/AppStore';
import { ShoppingPlan, PlanConfidence } from '../../domain/entities/ShoppingPlan';
import { LocalizedText as Text } from '../../components/LocalizedText';

export default function PlanResultsScreen() {
  const { plans, selectedPlan, selectPlan } = useOptimizationStore();
  const { startMission } = useMissionStore();

  const handleStartMission = () => {
    if (selectedPlan) {
      startMission(selectedPlan);
      router.push('/(mission)/shopping-mission');
    }
  };

  if (!selectedPlan && plans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Planes de compra</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No hay planes disponibles</Text>
          <Text style={styles.emptyText}>
            Crea una lista primero para generar planes optimizados.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(shopping)/create-list')}
          >
            <Text style={styles.emptyButtonText}>Crear lista</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const plan = selectedPlan ?? plans[0];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tu plan optimizado</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Savings Header */}
        {plan.estimatedSavings && plan.estimatedSavings.toDecimal() > 0 && (
          <View style={styles.savingsHeader}>
            <Ionicons name="trending-down" size={24} color={colors.white} />
            <View>
              <Text style={styles.savingsLabel}>Ahorro estimado</Text>
              <Text style={styles.savingsAmount}>
                {formatCurrency(plan.estimatedSavings.toDecimal())}
              </Text>
            </View>
          </View>
        )}

        {/* Cost Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Productos</Text>
            <Text style={styles.summaryValue}>{formatCurrency(plan.totalProductCost.toDecimal())}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transporte</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(plan.totalTransportCost.toDecimal())}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalValue}>{formatCurrency(plan.effectiveTotalCost.toDecimal())}</Text>
          </View>
        </View>

        {/* Confidence */}
        <View style={styles.confidenceBar}>
          <ConfidenceIndicator confidence={plan.confidence} />
        </View>

        {/* Route Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ruta</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeMetrics}>
              <RouteMetric icon="time" value={`${plan.totalTimeMinutes} min`} label="Tiempo" />
              <RouteMetric
                icon="navigate"
                value={`${plan.totalDistanceKm.toFixed(1)} km`}
                label="Distancia"
              />
              <RouteMetric icon="storefront" value={`${plan.numberOfStores}`} label="Tiendas" />
            </View>
          </View>
        </View>

        {/* Store Stops */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paradas</Text>
          {plan.storeStops.map(
            (stop: import('../../domain/entities/ShoppingPlan').PlanStoreStop, index: number) => (
              <TouchableOpacity key={stop.storeId} style={styles.stopCard}>
                <View style={styles.stopHeader}>
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopStoreName}>{stop.storeName}</Text>
                    <Text style={styles.stopAddress} numberOfLines={1}>
                      {stop.retailerName} · {stop.address}
                    </Text>
                  </View>
                  <Text style={styles.stopCost}>{formatCurrency(stop.productCost.toDecimal())}</Text>
                </View>

                <View style={styles.stopItems}>
                  {stop.items.map((item: import('../../domain/entities/ShoppingPlan').PlanItem) => (
                    <View key={item.shoppingItemId} style={styles.stopItem}>
                      <Ionicons
                        name={item.isSubstitution ? 'swap-horizontal' : 'checkmark-circle'}
                        size={14}
                        color={item.isSubstitution ? colors.warning : colors.primary}
                      />
                      <Text style={styles.stopItemName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.stopItemQty}>x{item.quantity}</Text>
                      <Text style={styles.stopItemPrice}>
                        {formatCurrency(item.effectivePrice.toDecimal())}
                      </Text>
                    </View>
                  ))}
                </View>

                {stop.promotions.length > 0 && (
                  <View style={styles.promosRow}>
                    {stop.promotions.map(
                      (
                        promo: import('../../domain/entities/ShoppingPlan').PlanPromotionApplied,
                      ) => (
                        <View key={promo.promotionId} style={styles.promoBadge}>
                          <Ionicons name="pricetag" size={12} color={colors.savings} />
                          <Text style={styles.promoText}>{promo.name}</Text>
                        </View>
                      ),
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Explanations */}
        {plan.explanations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>¿Por qué este plan?</Text>
            {plan.explanations.map(
              (
                exp: import('../../domain/entities/ShoppingPlan').PlanExplanation,
                index: number,
              ) => (
                <View key={index} style={styles.explanationCard}>
                  <Ionicons
                    name={
                      exp.category === 'SAVINGS'
                        ? 'trending-down'
                        : exp.category === 'CHOICE'
                          ? 'checkmark-circle'
                          : exp.category === 'WARNING'
                            ? 'warning'
                            : 'information-circle'
                    }
                    size={18}
                    color={
                      exp.category === 'SAVINGS'
                        ? colors.savings
                        : exp.category === 'CHOICE'
                          ? colors.primary
                          : exp.category === 'WARNING'
                            ? colors.warning
                            : colors.info
                    }
                  />
                  <Text style={styles.explanationText}>{exp.text}</Text>
                </View>
              ),
            )}
          </View>
        )}

        {/* Warnings */}
        {plan.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Advertencias</Text>
            {plan.warnings.map((warning: string, index: number) => (
              <View key={index} style={styles.warningCard}>
                <Ionicons name="alert-circle" size={18} color={colors.warning} />
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Assumptions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          {plan.assumptions.map((assumption: string, index: number) => (
            <View key={index} style={styles.assumptionItem}>
              <Text style={styles.assumptionDot}>•</Text>
              <Text style={styles.assumptionText}>{assumption}</Text>
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        {plans.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Otros planes</Text>
            {plans
              .filter(
                (p: import('../../domain/entities/ShoppingPlan').ShoppingPlan) => p.id !== plan.id,
              )
              .map((otherPlan: import('../../domain/entities/ShoppingPlan').ShoppingPlan) => (
                <TouchableOpacity
                  key={otherPlan.id}
                  style={styles.otherPlanCard}
                  onPress={() => selectPlan(otherPlan)}
                >
                  <View style={styles.otherPlanInfo}>
                    <Text style={styles.otherPlanMode}>{otherPlan.mode.replace('_', ' ')}</Text>
                    <Text style={styles.otherPlanCost}>
                      {formatCurrency(otherPlan.effectiveTotalCost.toDecimal())} total
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartMission}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={20} color={colors.white} />
          <Text style={styles.startButtonText}>Iniciar compra</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: PlanConfidence }) {
  const config = {
    [PlanConfidence.HIGH]: {
      color: colors.confirmed,
      label: 'Alta confianza',
      icon: 'shield-checkmark' as const,
    },
    [PlanConfidence.MEDIUM]: {
      color: colors.recent,
      label: 'Confianza media',
      icon: 'shield-half' as const,
    },
    [PlanConfidence.LOW]: {
      color: colors.estimated,
      label: 'Baja confianza',
      icon: 'shield-outline' as const,
    },
  };

  const { color, label, icon } = config[confidence];

  return (
    <View style={[styles.confidenceContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.confidenceText, { color }]}>{label}</Text>
    </View>
  );
}

function RouteMetric({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.metricItem}>
      <Ionicons name={icon as any} size={18} color={colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerRight: { width: 32 },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
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
    fontWeight: typography.fontWeight.semibold,
  },
  savingsHeader: {
    backgroundColor: colors.savings,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  savingsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  savingsAmount: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  confidenceBar: {
    marginBottom: spacing.lg,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  routeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  stopCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  stopInfo: {
    flex: 1,
  },
  stopStoreName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  stopAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  stopCost: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  stopItems: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stopItemName: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  stopItemQty: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  stopItemPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  promosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.savingsLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  promoText: {
    fontSize: typography.fontSize.xs,
    color: colors.savings,
    fontWeight: typography.fontWeight.medium,
  },
  explanationCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  explanationText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  warningCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  assumptionItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  assumptionDot: {
    color: colors.textTertiary,
  },
  assumptionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  otherPlanCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  otherPlanInfo: {
    flex: 1,
  },
  otherPlanMode: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  otherPlanCost: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  startButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
