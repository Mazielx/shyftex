import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useListStore, useOptimizationStore } from '../../stores/AppStore';
import { ShoppingItem, ItemPriority, MatchLevel } from '../../domain/entities/ShoppingItem';
import { ShoppingListStatus } from '../../domain/entities/ShoppingList';

const STATUS_CONFIG: Record<ShoppingListStatus, { label: string; color: string; bgColor: string }> =
  {
    [ShoppingListStatus.DRAFT]: {
      label: 'Borrador',
      color: colors.textTertiary,
      bgColor: colors.background,
    },
    [ShoppingListStatus.PARSED]: {
      label: 'Analizada',
      color: colors.info,
      bgColor: colors.infoLight,
    },
    [ShoppingListStatus.REVIEWED]: {
      label: 'Revisada',
      color: colors.primary,
      bgColor: colors.primaryLight,
    },
    [ShoppingListStatus.OPTIMIZED]: {
      label: 'Optimizada',
      color: colors.savings,
      bgColor: colors.savingsLight,
    },
    [ShoppingListStatus.IN_PROGRESS]: {
      label: 'En progreso',
      color: colors.warning,
      bgColor: colors.warningLight,
    },
    [ShoppingListStatus.COMPLETED]: {
      label: 'Completada',
      color: colors.success,
      bgColor: colors.successLight,
    },
  };

const MATCH_LABELS: Record<MatchLevel, string> = {
  [MatchLevel.EXACT_MATCH]: 'Exacto',
  [MatchLevel.PRODUCT_VARIANT_MATCH]: 'Variante',
  [MatchLevel.ACCEPTABLE_SUBSTITUTE]: 'Sustituto',
  [MatchLevel.POSSIBLE_SUBSTITUTE]: 'Posible',
  [MatchLevel.INCOMPATIBLE]: 'Sin match',
};

const MATCH_COLORS: Record<MatchLevel, string> = {
  [MatchLevel.EXACT_MATCH]: colors.confirmed,
  [MatchLevel.PRODUCT_VARIANT_MATCH]: colors.recent,
  [MatchLevel.ACCEPTABLE_SUBSTITUTE]: colors.warning,
  [MatchLevel.POSSIBLE_SUBSTITUTE]: colors.estimated,
  [MatchLevel.INCOMPATIBLE]: colors.unknown,
};

export default function ListDetailScreen() {
  const { currentList, items, updateItem, removeItem } = useListStore();
  const { generatePlans, isOptimizing } = useOptimizationStore();
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editNotes, setEditNotes] = useState('');

  if (!currentList) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de lista</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No hay lista seleccionada</Text>
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

  const statusConfig = STATUS_CONFIG[currentList.status];

  const handleOptimize = async () => {
    await generatePlans(currentList.id);
    router.push('/(shopping)/plan-results');
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditQuantity(String(item.quantity));
    setEditBrand(item.brand ?? '');
    setEditNotes(item.notes);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const qty = parseFloat(editQuantity);
    if (!isNaN(qty) && qty > 0) {
      updateItem(editingItem.id, {
        quantity: qty,
        brand: editBrand || null,
        notes: editNotes,
      });
    }
    setEditingItem(null);
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Eliminar producto', '¿Eliminar este producto de la lista?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(itemId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentList.title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Status and meta bar */}
      <View style={styles.metaBar}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
        <Text style={styles.metaText}>
          {currentList.itemCount} producto{currentList.itemCount !== 1 ? 's' : ''}
          {currentList.parsedItemCount > 0 && ` · ${currentList.parsedItemCount} detectados`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <Ionicons name="cart-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyItemsTitle}>Sin productos</Text>
            <Text style={styles.emptyItemsText}>Esta lista no tiene productos todavía.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Productos</Text>
            {items.map((item: ShoppingItem) => (
              <ItemDetailCard
                key={item.id}
                item={item}
                onEdit={() => handleEditItem(item)}
                onRemove={() => handleRemoveItem(item.id)}
                onToggleSubstitution={() =>
                  updateItem(item.id, { allowsSubstitution: !item.allowsSubstitution })
                }
                onSetPriority={(priority: ItemPriority) => updateItem(item.id, { priority })}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.optimizeButton}
            onPress={handleOptimize}
            disabled={isOptimizing}
            activeOpacity={0.8}
          >
            {isOptimizing ? (
              <Text style={styles.optimizeButtonText}>Optimizando...</Text>
            ) : (
              <>
                <Ionicons name="flash" size={20} color={colors.white} />
                <Text style={styles.optimizeButtonText}>Optimizar compra</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Modal */}
      <Modal visible={editingItem !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar producto</Text>
              <TouchableOpacity onPress={() => setEditingItem(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Producto</Text>
            <Text style={styles.modalProductName}>
              {editingItem?.normalizedName ?? editingItem?.rawInput}
            </Text>

            <Text style={styles.modalInputLabel}>Cantidad</Text>
            <TextInput
              style={styles.modalInput}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
              placeholder="1"
            />

            <Text style={styles.modalInputLabel}>Marca (opcional)</Text>
            <TextInput
              style={styles.modalInput}
              value={editBrand}
              onChangeText={setEditBrand}
              placeholder="Ej: Lala"
            />

            <Text style={styles.modalInputLabel}>Notas</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              placeholder="Ej: sin azúcar"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditingItem(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveEdit}>
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Item Card Component ───

function ItemDetailCard({
  item,
  onEdit,
  onRemove,
  onToggleSubstitution,
  onSetPriority,
}: {
  item: ShoppingItem;
  onEdit: () => void;
  onRemove: () => void;
  onToggleSubstitution: () => void;
  onSetPriority: (priority: ItemPriority) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.itemCard}>
      <TouchableOpacity style={styles.itemHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.itemInfo}>
          <View style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.normalizedName ?? item.rawInput}
            </Text>
            {item.brand && (
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>{item.brand}</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemMeta}>
            {item.quantity} {item.unit}
            {item.size ? ` · ${item.size}` : ''}
            {item.category ? ` · ${item.category}` : ''}
          </Text>
        </View>

        <View style={styles.itemRight}>
          <View
            style={[styles.matchBadge, { backgroundColor: MATCH_COLORS[item.matchLevel] + '20' }]}
          >
            <Text style={[styles.matchText, { color: MATCH_COLORS[item.matchLevel] }]}>
              {MATCH_LABELS[item.matchLevel]}
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
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Prioridad</Text>
              <Text style={styles.detailValue}>{item.priority}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Categoría</Text>
              <Text style={styles.detailValue}>{item.category ?? 'No detectada'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Presentación</Text>
              <Text style={styles.detailValue}>{item.presentation ?? 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Sustituciones</Text>
              <Text style={styles.detailValue}>
                {item.allowsSubstitution ? 'Permitidas' : 'No permitidas'}
              </Text>
            </View>
          </View>

          {item.notes.length > 0 && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notas:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}

          <View style={styles.itemActionsExpanded}>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onToggleSubstitution}>
              <Ionicons
                name={item.allowsSubstitution ? 'swap-horizontal' : 'close-circle'}
                size={16}
                color={colors.primary}
              />
              <Text style={styles.actionText}>
                {item.allowsSubstitution ? 'Sin sustitutos' : 'Permitir sustitutos'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.deleteAction]} onPress={onRemove}>
              <Ionicons name="trash" size={16} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.priorityActions}>
            <Text style={styles.priorityLabel}>Cambiar prioridad:</Text>
            <View style={styles.priorityRow}>
              {(Object.values(ItemPriority) as ItemPriority[]).map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityChip,
                    item.priority === priority && styles.priorityChipActive,
                  ]}
                  onPress={() => onSetPriority(priority)}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      item.priority === priority && styles.priorityChipTextActive,
                    ]}
                  >
                    {priority === ItemPriority.REQUIRED
                      ? 'Obligatorio'
                      : priority === ItemPriority.PREFERRED
                        ? 'Preferido'
                        : 'Opcional'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { width: 32 },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
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
  emptyItems: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyItemsTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyItemsText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  // Item card styles
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
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  brandBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  brandBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  itemMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  itemRight: {
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
    fontWeight: '600',
  },
  itemExpanded: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500',
    marginTop: 2,
  },
  notesContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  notesLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  notesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  itemActionsExpanded: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  priorityActions: {
    marginTop: spacing.md,
  },
  priorityLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  priorityChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priorityChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Bottom bar
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
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalProductName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  modalInputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: '600',
  },
});
