import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography } from '../../config/theme';
import { useSettingsStore } from '../../stores/AppStore';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { useLanguage } from '../../i18n/LanguageContext';

const FUEL_TYPES = ['Magna', 'Premium', 'Diesel', 'Diesel Premium'];

export default function VehicleScreen() {
  const { t } = useLanguage();
  const { vehicle, syncVehicle } = useSettingsStore();
  const [make, setMake] = useState(vehicle?.make ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(vehicle?.year?.toString() ?? '');
  const [fuelType, setFuelType] = useState(vehicle?.fuelType ?? 'Magna');
  const [efficiency, setEfficiency] = useState(vehicle?.customEfficiency?.toString() ?? '');

  const handleSave = () => {
    if (!make.trim() || !model.trim()) {
      Alert.alert(t('Error'), t('Por favor ingresa marca y modelo'));
      return;
    }

    syncVehicle({
      name: `${make.trim()} ${model.trim()}`,
      make: make.trim(),
      model: model.trim(),
      year: parseInt(year) || new Date().getFullYear(),
      fuelType,
      customEfficiency: efficiency ? parseFloat(efficiency) : null,
    });

    Alert.alert(t('Guardado'), t('Información del vehículo actualizada'), [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi vehículo</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Registra tu vehículo para calcular costos de transporte más precisos.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Marca *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Ej: Nissan, Toyota, Chevrolet')}
            placeholderTextColor={colors.textTertiary}
            value={make}
            onChangeText={setMake}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Modelo *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Ej: Versa, Corolla, Aveo')}
            placeholderTextColor={colors.textTertiary}
            value={model}
            onChangeText={setModel}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Año</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Ej: 2023')}
            placeholderTextColor={colors.textTertiary}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de combustible</Text>
          <View style={styles.fuelTypeRow}>
            {FUEL_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.fuelTypeButton, fuelType === type && styles.fuelTypeButtonActive]}
                onPress={() => setFuelType(type)}
              >
                <Text style={[styles.fuelTypeText, fuelType === type && styles.fuelTypeTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Consumo personalizado (km/L)</Text>
          <TextInput
            style={styles.input}
            placeholder={t('Ej: 13')}
            placeholderTextColor={colors.textTertiary}
            value={efficiency}
            onChangeText={setEfficiency}
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Si lo conoces, este valor tiene prioridad sobre el consumo oficial.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  fuelTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fuelTypeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fuelTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fuelTypeText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  fuelTypeTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
    ...shadows.md,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
