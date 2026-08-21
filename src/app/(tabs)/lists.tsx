import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useListStore } from '../../stores/AppStore';
import { ShoppingList } from '../../domain/entities/ShoppingList';

export default function ListsScreen() {
  const { lists, setCurrentList } = useListStore();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Create new list button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(shopping)/create-list')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={colors.white} />
          <Text style={styles.createButtonText}>Nueva lista de compras</Text>
        </TouchableOpacity>

        {lists.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No tienes listas</Text>
            <Text style={styles.emptyText}>Crea tu primera lista para empezar a ahorrar.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Tus listas</Text>
            {lists.map((list: ShoppingList) => (
              <TouchableOpacity
                key={list.id}
                style={styles.listCard}
                onPress={() => {
                  setCurrentList(list);
                  router.push('/(shopping)/list-detail');
                }}
              >
                <View style={styles.listIcon}>
                  <Ionicons name="list" size={20} color={colors.primary} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {list.title}
                  </Text>
                  <Text style={styles.listMeta}>
                    {list.itemCount} productos · {list.status}
                  </Text>
                  <Text style={styles.listDate}>{list.createdAt.toLocaleDateString('es-MX')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
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
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  createButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
