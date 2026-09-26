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
  formatCurrency,
} from '../../config/theme';
import { useListStore, useOptimizationStore, useAuthStore } from '../../stores/AppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import { LocalizedText as Text } from '../../components/LocalizedText';

export default function HomeScreen() {
  const { language, t } = useLanguage();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Buenos dias');
    if (hour < 18) return t('Buenas tardes');
    return t('Buenas noches');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name ?? t('Usuario')}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
          </TouchableOpacity>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => router.push('/(shopping)/create-list')}
          activeOpacity={0.85}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{t('Nueva compra')}</Text>
            <Text style={styles.heroSubtitle}>
              {t('Escribe tu lista y encontramos los mejores precios')}
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        {(totalSavings > 0 || lists.length > 0) && (
          <View style={styles.statsRow}>
            <StatCard
              icon="wallet"
              value={formatCurrency(totalSavings)}
              label={t('Ahorrado')}
              color={colors.success}
            />
            <StatCard
              icon="list"
              value={`${lists.length}`}
              label={t('Listas')}
              color={colors.secondary}
            />
            <StatCard icon="map" value={`${plans.length}`} label={t('Planes')} color={colors.warning} />
          </View>
        )}

        {/* Recent List */}
        {recentList && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Tu ultima lista')}</Text>
            <TouchableOpacity
              style={styles.recentCard}
              onPress={() => router.push('/(shopping)/list-detail')}
              activeOpacity={0.7}
            >
              <View style={styles.recentDot} />
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {recentList.title}
                </Text>
                <Text style={styles.recentMeta}>
                  {language === 'en'
                    ? `${recentList.itemCount} products`
                    : `${recentList.itemCount} productos`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Como funciona')}</Text>
          <View style={styles.stepsContainer}>
            <StepItem
              number="1"
              icon="document-text"
              title={t('Sube tu lista')}
              description={t('Escribe, pega o dicta tu lista de compras')}
            />
            <View style={styles.stepConnector} />
            <StepItem
              number="2"
              icon="search"
              title={t('Comparamos precios')}
              description={t('Revisamos tiendas, promociones y disponibilidad')}
            />
            <View style={styles.stepConnector} />
            <StepItem
              number="3"
              icon="map"
              title={t('Optimizamos la ruta')}
              description={t('La mejor estrategia para ahorrar tiempo y dinero')}
            />
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={18} color={colors.warning} />
          </View>
          <Text style={styles.tipText}>
            {t('Tip: Se concreta con las marcas para mejores resultados. "2L leche Lala" funciona mejor que solo "leche".')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '12' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StepItem({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{description}</Text>
      </View>
      <Ionicons name={icon as any} size={20} color={colors.textTertiary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  // Hero CTA
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xs,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.xs,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Sections
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  // Recent
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.xs,
  },
  recentDot: {
    width: 10,
    height: 10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  recentMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Steps
  stepsContainer: {
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.xs,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  stepDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stepConnector: {
    width: 2,
    height: spacing.md,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 13,
    marginVertical: spacing.xs,
  },
  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
