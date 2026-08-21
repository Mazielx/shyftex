import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useListStore } from '../../stores/AppStore';

export default function CreateListScreen() {
  const [inputText, setInputText] = useState('');
  const { parseList, isProcessing } = useListStore();

  const handleParse = async () => {
    if (!inputText.trim()) return;
    await parseList(inputText);
    router.push('/(shopping)/review-list');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva lista</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Escribe los productos que necesitas. Sé lo más específico posible.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Ej: 2 litros de leche Lala, huevos, arroz, cereal Zucaritas, pechuga de pollo, Ariel y papel Regio"
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            autoFocus
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <Text style={styles.charCount}>{inputText.length} caracteres</Text>
            {inputText.length > 0 && (
              <TouchableOpacity onPress={() => setInputText('')}>
                <Text style={styles.clearText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>Consejos para mejores resultados:</Text>
          <TipItem text="Incluye cantidades: '2 litros de leche'" />
          <TipItem text="Especifica marcas cuando las tengas claras" />
          <TipItem text="Usa comas para separar productos" />
          <TipItem text="Puedes incluir tamaños: '375g de cereal'" />
        </View>

        {/* Example */}
        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>Ejemplo:</Text>
          <Text style={styles.exampleText}>
            Necesito 2 litros de leche Lala, 18 huevos Kuik, arroz Montalvo 1kg, cereal Zucaritas
            375g, pechuga de pollo 1kg, detergente Ariel 1L y papel Regio 12 rollos.
          </Text>
          <TouchableOpacity
            style={styles.useExampleButton}
            onPress={() =>
              setInputText(
                '2 litros de leche Lala, 18 huevos Kuik, arroz Montalvo 1kg, cereal Zucaritas 375g, pechuga de pollo 1kg, detergente Ariel 1L y papel Regio 12 rollos',
              )
            }
          >
            <Text style={styles.useExampleText}>Usar este ejemplo</Text>
          </TouchableOpacity>
        </View>

        {/* Action methods */}
        <View style={styles.methodsSection}>
          <Text style={styles.methodsTitle}>Otras formas de crear tu lista:</Text>
          <View style={styles.methodsRow}>
            <MethodButton icon="camera" label="Foto" onPress={() => {}} disabled />
            <MethodButton icon="mic" label="Voz" onPress={() => {}} disabled />
            <MethodButton icon="barcode" label="Código" onPress={() => {}} disabled />
            <MethodButton icon="document" label="Archivo" onPress={() => {}} disabled />
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.parseButton,
            (!inputText.trim() || isProcessing) && styles.parseButtonDisabled,
          ]}
          onPress={handleParse}
          disabled={!inputText.trim() || isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={colors.white} />
              <Text style={styles.parseButtonText}>Analizar mi lista</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <View style={styles.tipItem}>
      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function MethodButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.methodButton, disabled && styles.methodButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={disabled ? colors.textTertiary : colors.primary}
      />
      <Text style={[styles.methodLabel, disabled && styles.methodLabelDisabled]}>{label}</Text>
    </TouchableOpacity>
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
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerRight: {
    width: 32,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  textInput: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    minHeight: 150,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  },
  clearText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  tips: {
    marginBottom: spacing.xl,
  },
  tipsTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  exampleCard: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  exampleTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.info,
    marginBottom: spacing.sm,
  },
  exampleText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  useExampleButton: {
    alignSelf: 'flex-start',
  },
  useExampleText: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    fontWeight: '600',
  },
  methodsSection: {
    marginBottom: spacing.xl,
  },
  methodsTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodButtonDisabled: {
    opacity: 0.5,
  },
  methodLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  methodLabelDisabled: {
    color: colors.textTertiary,
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
  parseButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  parseButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  parseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
});
