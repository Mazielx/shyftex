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
} from '../../config/theme';
import { useListStore } from '../../stores/AppStore';
import { ShoppingList, ShoppingListStatus } from '../../domain/entities/ShoppingList';
import { LocalizedText as Text } from '../../components/LocalizedText';

const STATUS_CONFIG: Record<ShoppingListStatus, { color: string; label: string }> = {
  [ShoppingListStatus.DRAFT]: { color: colors.textTertiary, label: 'Borrador' },
  [ShoppingListStatus.PARSED]: { color: colors.info, label: 'Procesada' },
  [ShoppingListStatus.REVIEWED]: { color: colors.primary, label: 'Revisada' },
  [ShoppingListStatus.OPTIMIZED]: { color: colors.success, label: 'Optimizada' },
  [ShoppingListStatus.IN_PROGRESS]: { color: colors.warning, label: 'En progreso' },
  [ShoppingListStatus.COMPLETED]: { color: colors.success, label: 'Completada' },
};

function StatusDot({ status }: { status: ShoppingListStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[ShoppingListStatus.DRAFT];
  return <View style={[styles.statusDot, { backgroundColor: config.color }]} />;
}

function StatusBadge({ status }: { status: ShoppingListStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[ShoppingListStatus.DRAFT];
  return (
    <View style={[styles.badge, { backgroundColor: `${config.color}18` }]}>
      <StatusDot status={status} />
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cart-outline" size={48} color={colors.primaryMuted} />
      </View>
      <Text style={styles.emptyTitle}>Sin listas todavía</Text>
      <Text style={styles.emptyDescription}>
        Crea tu primera lista de compras para comenzar a optimizar tus gastos.
      </Text>
      <TouchableOpacity
        style={[commonStyles.primaryButton, styles.emptyCta]}
        onPress={() => router.push('/(shopping)/create-list')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color={colors.textInverse} />
        <Text style={commonStyles.primaryButtonText}>Crear primera lista</Text>
      </TouchableOpacity>
    </View>
  );
}

function ListCard({ list }: { list: ShoppingList }) {
  const statusConfig = STATUS_CONFIG[list.status] ?? STATUS_CONFIG[ShoppingListStatus.DRAFT];

  return (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => {
        useListStore.getState().setCurrentList(list);
        router.push('/(shopping)/list-detail');
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.cardLeftAccent, { backgroundColor: statusConfig.color }]} />

      <View style={styles.listCardContent}>
        <View style={styles.listCardTop}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {list.title}
          </Text>
          <StatusBadge status={list.status} />
        </View>

        <View style={styles.listCardBottom}>
          <View style={styles.listMetaRow}>
            <Ionicons name="bag-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.listMetaText}>
              {list.itemCount} {list.itemCount === 1 ? 'producto' : 'productos'}
            </Text>
          </View>

          <View style={styles.listMetaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
            <Text style={styles.listMetaText}>
              {list.createdAt.toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function ListsScreen() {
  const { lists } = useListStore();

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis listas</Text>
        <Text style={styles.headerSubtitle}>
          {lists.length} {lists.length === 1 ? 'lista' : 'listas'}
        </Text>
      </View>

      {lists.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={commonStyles.sectionTitle}>Todas las listas</Text>
          <View style={styles.listContainer}>
            {lists.map((list: ShoppingList) => (
              <ListCard key={list.id} list={list} />
            ))}
          </View>
        </ScrollView>
      )}

      {lists.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/(shopping)/create-list')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  listContainer: {
    gap: spacing.sm,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardLeftAccent: {
    width: 4,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  listCardContent: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  listCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  listTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  listCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingRight: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
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
    marginBottom: spacing.xxl,
  },
  emptyCta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
