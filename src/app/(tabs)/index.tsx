import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useListStore, useOptimizationStore, useAuthStore } from '../../stores/AppStore';

export default function HomeScreen() {
  const user = useAuthStore((s: { user: import('../../stores/AppStore').User | null }) => s.user);
  const lists = useListStore(
    (s: { lists: import('../../domain/entities/ShoppingList').ShoppingList[] }) => s.lists,
  );
  const plans = useOptimizationStore(
    (s: { plans: import('../../domain/entities/ShoppingPlan').ShoppingPlan[] }) => s.plans,
  );

  const recentList = lists.length > 0 ? lists[lists.length - 1] : null;
  const totalSavings = plans.reduce((sum, plan) => {
    return sum + (plan.estimatedSavings?.toDecimal() ?? 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hola{user?.name ? `, ${user.name}` : ''}</Text>
          <Text style={styles.greetingSubtext}>¿Qué necesitas comprar hoy?</Text>
        </View>

        {/* Main CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/(shopping)/create-list')}
          activeOpacity={0.8}
        >
          <View style={styles.ctaIcon}>
            <Ionicons name="add-circle" size={32} color={colors.white} />
          </View>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Nueva compra</Text>
            <Text style={styles.ctaSubtitle}>
              Escribe tu lista y encontramos los mejores precios
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>

        {/* Quick Stats */}
        {totalSavings > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Ionicons name="wallet" size={24} color={colors.savings} />
              <View>
                <Text style={styles.statValue}>${totalSavings.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Ahorro total</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="receipt" size={24} color={colors.secondary} />
              <View>
                <Text style={styles.statValue}>{lists.length}</Text>
                <Text style={styles.statLabel}>Listas creadas</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="map" size={24} color={colors.warning} />
              <View>
                <Text style={styles.statValue}>{plans.length}</Text>
                <Text style={styles.statLabel}>Planes generados</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent List */}
        {recentList && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Última lista</Text>
            <TouchableOpacity
              style={styles.recentCard}
              onPress={() => router.push('/(shopping)/list-detail')}
            >
              <View style={styles.recentIcon}>
                <Ionicons name="list" size={20} color={colors.primary} />
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {recentList.title}
                </Text>
                <Text style={styles.recentMeta}>
                  {recentList.itemCount} productos · {recentList.status}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cómo funciona</Text>
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="document-text"
              title="Sube tu lista"
              description="Escribe, pega o usa la voz"
              color={colors.secondary}
            />
            <FeatureCard
              icon="search"
              title="Comparamos"
              description="Precios, promociones y distancias"
              color={colors.primary}
            />
            <FeatureCard
              icon="map"
              title="Optimizamos"
              description="La mejor ruta y estrategia"
              color={colors.warning}
            />
            <FeatureCard
              icon="checkmark-circle"
              title="Compra"
              description="Te guiamos paso a paso"
              color={colors.savings}
            />
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Consejo del día</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={styles.tipText}>
              Sé específico con las marcas cuando las tengas claras. "2 litros de leche Lala"
              produce mejores resultados que solo "leche".
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={[styles.featureIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  greeting: {
    marginBottom: spacing.xl,
  },
  greetingText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  greetingSubtext: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  ctaIcon: {
    marginRight: spacing.md,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  ctaSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  featureDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tipsSection: {
    marginBottom: spacing.xl,
  },
  tipCard: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
