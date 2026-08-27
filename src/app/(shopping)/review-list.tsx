import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useListStore, useOptimizationStore } from '../../stores/AppStore';
import { ShoppingItem, ItemPriority, MatchLevel } from '../../domain/entities/ShoppingItem';

export default function ReviewListScreen() {
  const { items, updateItem, removeItem } = useListStore();
  const { generatePlans, isOptimizing } = useOptimizationStore();

  const handleOptimize = async () => {
    const listId = useListStore.getState().currentList?.id ?? '';
    if (listId) {
      await generatePlans(listId);
      router.push('/(shopping)/plan-results');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revisar productos</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.countBar}>
        <Text style={styles.countText}>{items.length} productos encontrados</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item: ShoppingItem) => (
          <ItemCard
            key={item.id}
            item={item}
            onUpdate={(updates) => updateItem(item.id, updates)}
            onRemove={() => removeItem(item.id)}
          />
        ))}

        {/* Add manual item */}
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Agregar producto manualmente</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.optimizeButton}
          onPress={handleOptimize}
          disabled={isOptimizing || items.length === 0}
          activeOpacity={0.8}
        >
          {isOptimizing ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.optimizeButtonText}>Optimizando...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="flash" size={20} color={colors.white} />
              <Text style={styles.optimizeButtonText}>
                Optimizar compra ({items.length} productos)
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ItemCard({
  item,
  onUpdate,
  onRemove,
}: {
  item: ShoppingItem;
  onUpdate: (updates: Partial<ShoppingItem>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    [ItemPriority.REQUIRED]: colors.error,
    [ItemPriority.PREFERRED]: colors.warning,
    [ItemPriority.OPTIONAL]: colors.textTertiary,
  };

  const matchColors = {
    [MatchLevel.EXACT_MATCH]: colors.confirmed,
    [MatchLevel.PRODUCT_VARIANT_MATCH]: colors.recent,
    [MatchLevel.ACCEPTABLE_SUBSTITUTE]: colors.warning,
    [MatchLevel.POSSIBLE_SUBSTITUTE]: colors.estimated,
    [MatchLevel.INCOMPATIBLE]: colors.unknown,
  };

  return (
    <View style={styles.itemCard}>
      <TouchableOpacity style={styles.itemHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.itemInfo}>
          <View style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.normalizedName ?? item.rawInput}
            </Text>
            {item.brand && (
              <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{item.brand}</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemMeta}>
            {item.quantity} {item.unit}
            {item.size ? ` · ${item.size}` : ''}
          </Text>
        </View>

        <View style={styles.itemActions}>
          <View
            style={[styles.matchBadge, { backgroundColor: matchColors[item.matchLevel] + '20' }]}
          >
            <Text style={[styles.matchText, { color: matchColors[item.matchLevel] }]}>
              {item.matchLevel === MatchLevel.EXACT_MATCH
                ? 'Exacto'
                : item.matchLevel === MatchLevel.PRODUCT_VARIANT_MATCH
                  ? 'Variante'
                  : item.matchLevel === MatchLevel.ACCEPTABLE_SUBSTITUTE
                    ? 'Sustituto'
                    : 'No encontrado'}
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.itemExpanded}>
          <View style={styles.itemDetails}>
            <DetailRow label="Prioridad" value={item.priority} />
            <DetailRow label="Categoría" value={item.category ?? 'No detectada'} />
            <DetailRow
              label="Sustituciones"
              value={item.allowsSubstitution ? 'Permitidas' : 'No permitidas'}
            />
          </View>

          <View style={styles.itemActionsExpanded}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onUpdate({ priority: ItemPriority.REQUIRED })}
            >
              <Ionicons name="flag" size={16} color={colors.error} />
              <Text style={styles.actionText}>Obligatorio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onUpdate({ allowsSubstitution: !item.allowsSubstitution })}
            >
              <Ionicons
                name={item.allowsSubstitution ? 'swap-horizontal' : 'close-circle'}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.actionText}>
                {item.allowsSubstitution ? 'Permitir sustitutos' : 'Sin sustitutos'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteAction]}
              onPress={() => {
                Alert.alert('Eliminar', '¿Eliminar este producto?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: onRemove },
                ]);
              }}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  countBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  countText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  itemInfo: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  itemMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  matchBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  matchText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  itemExpanded: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  itemDetails: {
    paddingTop: spacing.md,
  },
  itemActionsExpanded: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteAction: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
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
  optimizeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  optimizeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  loadingContainer: {
    alignItems: 'center',
  },
});
