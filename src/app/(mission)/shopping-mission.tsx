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
import { useMissionStore } from '../../stores/AppStore';
import { MissionItemStatus } from '../../domain/entities/ShoppingMission';

export default function ShoppingMissionScreen() {
  const { currentMission, markItem, completeMission, cancelMission } = useMissionStore();
  const [activeTab, setActiveTab] = useState<'checklist' | 'map'>('checklist');

  if (!currentMission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No hay misión activa</Text>
          <Text style={styles.emptyText}>Genera un plan de compra primero.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { progress } = currentMission;
  const pendingItems = currentMission.items.filter(
    (i: import('../../domain/entities/ShoppingMission').MissionItem) =>
      i.status === MissionItemStatus.PENDING,
  );
  const foundItems = currentMission.items.filter(
    (i: import('../../domain/entities/ShoppingMission').MissionItem) =>
      i.status === MissionItemStatus.FOUND,
  );
  const notFoundItems = currentMission.items.filter(
    (i: import('../../domain/entities/ShoppingMission').MissionItem) =>
      i.status === MissionItemStatus.NOT_FOUND,
  );

  const totalExpected = currentMission.items.reduce(
    (sum: number, i: import('../../domain/entities/ShoppingMission').MissionItem) =>
      sum + i.expectedPrice * i.quantity,
    0,
  );
  const totalSpent = currentMission.items
    .filter(
      (i: import('../../domain/entities/ShoppingMission').MissionItem) =>
        i.status === MissionItemStatus.FOUND && i.actualPrice !== null,
    )
    .reduce(
      (sum: number, i: import('../../domain/entities/ShoppingMission').MissionItem) =>
        sum + (i.actualPrice ?? 0) * i.quantity,
      0,
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>En compras</Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            Alert.alert('Cancelar compra', '¿Estás seguro de que quieres cancelar?', [
              { text: 'No', style: 'cancel' },
              {
                text: 'Sí, cancelar',
                style: 'destructive',
                onPress: () => {
                  cancelMission();
                  router.back();
                },
              },
            ]);
          }}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progress.completed}/{progress.total} ({progress.percentage}%)
        </Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'checklist' && styles.tabActive]}
          onPress={() => setActiveTab('checklist')}
        >
          <Ionicons
            name="list"
            size={18}
            color={activeTab === 'checklist' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'checklist' && styles.tabTextActive]}>
            Checklist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && styles.tabActive]}
          onPress={() => setActiveTab('map')}
        >
          <Ionicons
            name="map"
            size={18}
            color={activeTab === 'map' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>Resumen</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'checklist' ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por comprar ({pendingItems.length})</Text>
              {pendingItems.map((item) => (
                <MissionItemCard
                  key={item.id}
                  item={item}
                  onFound={() => {
                    Alert.prompt('Precio real', `¿Cuánto costó ${item.productName}?`, (price) => {
                      const parsed = parseFloat(price ?? '0');
                      if (parsed > 0) {
                        markItem(item.id, MissionItemStatus.FOUND, parsed);
                      }
                    });
                  }}
                  onNotFound={() => {
                    Alert.alert('Producto no encontrado', `¿Qué hacer con "${item.productName}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Marcar como no encontrado',
                        onPress: () => markItem(item.id, MissionItemStatus.NOT_FOUND),
                      },
                    ]);
                  }}
                />
              ))}
            </View>
          )}

          {/* Found Items */}
          {foundItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Encontrados ({foundItems.length})</Text>
              {foundItems.map((item) => (
                <View key={item.id} style={styles.itemCardFound}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemPrice}>
                      ${item.actualPrice?.toFixed(2) ?? '?'} x{item.quantity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Not Found Items */}
          {notFoundItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>No encontrados ({notFoundItems.length})</Text>
              {notFoundItems.map((item) => (
                <View key={item.id} style={styles.itemCardNotFound}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemNotFound}>No disponible en esta tienda</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Esperado</Text>
              <Text style={styles.summaryValue}>${totalExpected.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gastado</Text>
              <Text style={[styles.summaryValue, styles.summarySpent]}>
                ${totalSpent.toFixed(2)}
              </Text>
            </View>
            {totalSpent > 0 && totalSpent < totalExpected && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Ahorro</Text>
                <Text style={[styles.summaryValue, styles.summarySaved]}>
                  -${(totalExpected - totalSpent).toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Not found items - suggestions */}
          {notFoundItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Productos no encontrados</Text>
              <View style={styles.suggestionCard}>
                <Ionicons name="bulb" size={20} color={colors.warning} />
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionText}>
                    Puedes buscar estos productos en otra tienda o pedir un sustituto.
                  </Text>
                  <TouchableOpacity style={styles.suggestionButton}>
                    <Text style={styles.suggestionButtonText}>Buscar alternativas</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom CTA */}
      {pendingItems.length === 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              completeMission();
              Alert.alert('¡Compra completada!', `Total gastado: $${totalSpent.toFixed(2)}`, [
                {
                  text: 'Ver resumen',
                  onPress: () => router.replace('/(tabs)'),
                },
              ]);
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={styles.completeButtonText}>Finalizar compra</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function MissionItemCard({
  item,
  onFound,
  onNotFound,
}: {
  item: import('../../domain/entities/ShoppingMission').MissionItem;
  onFound: () => void;
  onNotFound: () => void;
}) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemPrice}>
          Esperado: ${item.expectedPrice.toFixed(2)} x{item.quantity}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.foundButton} onPress={onFound}>
          <Ionicons name="checkmark" size={18} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.notFoundButton} onPress={onNotFound}>
          <Ionicons name="close" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
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
  cancelButton: {
    padding: spacing.xs,
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  itemPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  foundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCardFound: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  itemCardNotFound: {
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  itemNotFound: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
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
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summarySpent: {
    color: colors.primary,
  },
  summarySaved: {
    color: colors.savings,
  },
  suggestionCard: {
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  suggestionButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    fontWeight: '600',
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
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
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
});
