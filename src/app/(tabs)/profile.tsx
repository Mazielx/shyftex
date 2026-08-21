import React from 'react';
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
import { useAuthStore, useSettingsStore } from '../../stores/AppStore';
import { useLocation } from '../../hooks/useLocation';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const settings = useSettingsStore();
  const { location, hasPermission, refreshLocation } = useLocation();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transporte</Text>
          <SettingsItem
            icon="car"
            label="Mi vehículo"
            value={
              settings.vehicle
                ? `${settings.vehicle.make} ${settings.vehicle.model}`
                : 'No configurado'
            }
            onPress={() => router.push('/(settings)/vehicle')}
          />
          <SettingsItem
            icon="time"
            label="Valor del tiempo"
            value={
              settings.valueOfTimePerHour
                ? `$${settings.valueOfTimePerHour}/hora`
                : 'No configurado'
            }
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          <SettingsItem
            icon="card"
            label="Membresías"
            value={settings.hasMembership ? 'Activada' : 'No activada'}
            onPress={() => settings.setHasMembership(!settings.hasMembership)}
          />
          <SettingsItem
            icon="keypad"
            label="Tarjetas aceptadas"
            value={
              settings.acceptedCardBrands.length > 0
                ? settings.acceptedCardBrands.join(', ')
                : 'Ninguna'
            }
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <SettingsItem
            icon="time"
            label="Historial"
            value="Listas y planes anteriores"
            onPress={() => router.push('/(tabs)/history')}
          />
          <SettingsItem
            icon="location"
            label="Ubicación"
            value={
              location
                ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : hasPermission
                  ? 'Obteniendo...'
                  : 'Sin permiso'
            }
            onPress={() => {
              refreshLocation();
              Alert.alert('Ubicación', 'Actualizando ubicación...');
            }}
          />
          <SettingsItem
            icon="notifications"
            label="Notificaciones"
            value="Configurar"
            onPress={() => {}}
          />
          <SettingsItem icon="lock-closed" label="Privacidad" value="" onPress={() => {}} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemLabel}>{label}</Text>
        {value ? <Text style={styles.settingsItemValue}>{value}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: '700',
    color: colors.white,
  },
  userName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingsItemValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.error,
  },
});
