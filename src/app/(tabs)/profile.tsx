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
import { colors, spacing, borderRadius, shadows, typography, commonStyles } from '../../config/theme';
import { useAuthStore, useSettingsStore } from '../../stores/AppStore';
import { useLocation } from '../../hooks/useLocation';

const ICON_BG_SIZE = 34;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  icon: IoniconsName;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress: () => void;
  showChevron?: boolean;
  last?: boolean;
}

function SettingsItem({
  icon,
  iconColor = colors.primary,
  iconBg = colors.primaryLight,
  label,
  value,
  onPress,
  showChevron = true,
  last = false,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      style={[styles.item, !last && styles.itemBorder]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        {value ? <Text style={styles.itemValue}>{value}</Text> : null}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

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

  const vehicleText = settings.vehicle
    ? `${settings.vehicle.make} ${settings.vehicle.model}`
    : 'No configurado';

  const timeValueText = settings.valueOfTimePerHour
    ? `$${settings.valueOfTimePerHour}/hora`
    : 'No configurado';

  const membershipText = settings.hasMembership ? 'Activada' : 'No activada';

  const cardsText =
    settings.acceptedCardBrands.length > 0
      ? settings.acceptedCardBrands.join(', ')
      : 'Ninguna';

  const locationText = location
    ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    : hasPermission
      ? 'Obteniendo...'
      : 'Sin permiso';

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>

        {/* Transporte */}
        <Text style={styles.sectionTitle}>Transporte</Text>
        <SettingsGroup>
          <SettingsItem
            icon="car"
            label="Mi vehículo"
            value={vehicleText}
            onPress={() => router.push('/(settings)/vehicle')}
          />
          <SettingsItem
            icon="time-outline"
            label="Valor del tiempo"
            value={timeValueText}
            onPress={() => {}}
            last
          />
        </SettingsGroup>

        {/* Preferencias */}
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <SettingsGroup>
          <SettingsItem
            icon="card"
            label="Membresías"
            value={membershipText}
            onPress={() => settings.setHasMembership(!settings.hasMembership)}
          />
          <SettingsItem
            icon="wallet"
            label="Tarjetas aceptadas"
            value={cardsText}
            onPress={() => {}}
            last
          />
        </SettingsGroup>

        {/* Cuenta */}
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <SettingsGroup>
          <SettingsItem
            icon="list"
            label="Historial"
            value="Listas y planes"
            onPress={() => router.push('/(tabs)/history')}
          />
          <SettingsItem
            icon="location"
            label="Ubicación"
            value={locationText}
            iconColor={colors.info}
            iconBg={colors.infoLight}
            onPress={() => {
              refreshLocation();
            }}
            showChevron={false}
          />
          <SettingsItem
            icon="notifications-outline"
            label="Notificaciones"
            value="Configurar"
            onPress={() => {}}
          />
          <SettingsItem
            icon="lock-closed"
            label="Privacidad"
            onPress={() => {}}
            last
          />
        </SettingsGroup>

        {/* Logout */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxxl,
  },

  /* Header */
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.textInverse,
  },
  userName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },

  /* Sections */
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
  },

  /* Items */
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: ICON_BG_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  itemValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Logout */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxxl,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
  },

  bottomSpacer: {
    height: spacing.xxxl,
  },
});
