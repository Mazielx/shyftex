import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, shadows, typography, formatCurrency } from '../../config/theme';
import { Store, StoreService } from '../../domain/entities/Store';
import { Product } from '../../domain/entities/Product';
import { Promotion, PromotionType } from '../../domain/entities/Promotion';
import { Price } from '../../domain/entities/Price';
import { Money } from '../../domain/valueObjects/Money';
import { LocalizedText as Text } from '../../components/LocalizedText';
import { useLanguage } from '../../i18n/LanguageContext';

const SERVICE_CONFIG: Record<
  StoreService,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  [StoreService.PHARMACY]: { icon: 'medkit', label: 'Farmacia' },
  [StoreService.BAKERY]: { icon: 'cafe', label: 'Panadería' },
  [StoreService.DELI]: { icon: 'restaurant', label: 'Deli' },
  [StoreService.BUTCHER]: { icon: 'nutrition', label: 'Carnicería' },
  [StoreService.ATM]: { icon: 'card', label: 'Cajero' },
  [StoreService.PARKING]: { icon: 'car', label: 'Estacionamiento' },
  [StoreService.DRIVE_THROUGH]: { icon: 'speedometer', label: 'Drive-thru' },
  [StoreService.FUEL_STATION]: { icon: 'water', label: 'Gasolinera' },
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const PROMO_TYPE_LABELS: Record<PromotionType, string> = {
  [PromotionType.PERCENTAGE_DISCOUNT]: 'Descuento %',
  [PromotionType.FIXED_DISCOUNT]: 'Descuento fijo',
  [PromotionType.TWO_X_ONE]: '2x1',
  [PromotionType.THREE_X_TWO]: '3x2',
  [PromotionType.SECOND_UNIT_DISCOUNT]: '2da unit descuento',
  [PromotionType.BUY_X_GET_Y]: 'Lleva X paga Y',
  [PromotionType.BUNDLE]: 'Paquete',
  [PromotionType.VOLUME_DISCOUNT]: 'Descuento por volumen',
  [PromotionType.LOYALTY_PRICING]: 'Precio de lealtad',
  [PromotionType.COUPON]: 'Cupón',
  [PromotionType.CARD_PROMOTION]: 'Promoción con tarjeta',
  [PromotionType.MEMBERSHIP_PRICE]: 'Precio de membresía',
};

interface StoreDetailScreenProps {
  store?: Store;
  products?: Array<{ product: Product; price: Price }>;
  promotions?: Promotion[];
  onAddToRoute?: (storeId: string) => void;
}

export default function StoreDetailScreen({
  store,
  products = [],
  promotions = [],
  onAddToRoute,
}: StoreDetailScreenProps): React.JSX.Element {
  const { t } = useLanguage();
  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de tienda</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Tienda no encontrada</Text>
          <Text style={styles.emptyDescription}>
            No se pudo cargar la información de esta tienda.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOpen = store.isOpen();
  const todayHours = store.hours.find((h) => h.dayOfWeek === new Date().getDay());

  const handleAddToRoute = () => {
    onAddToRoute?.(store.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {store.name}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Store Info */}
        <View style={styles.section}>
          <View style={styles.storeHeader}>
            <View style={styles.storeNameRow}>
              <Text style={styles.storeName}>{store.name}</Text>
              <View
                style={[
                  styles.inlineBadge,
                  { backgroundColor: (isOpen ? colors.success : colors.error) + '20' },
                ]}
              >
                <Text
                  style={[styles.inlineBadgeText, { color: isOpen ? colors.success : colors.error }]}
                >
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </Text>
              </View>
            </View>
            <Text style={styles.retailerName}>{store.retailerName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>{store.getFullAddress()}</Text>
          </View>

          {store.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>{store.phone}</Text>
            </View>
          )}
        </View>

        {/* Map Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicación</Text>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map" size={48} color={colors.textTertiary} />
            <Text style={styles.mapAddress}>{store.getFullAddress()}</Text>
            <Text style={styles.mapCoords}>
              {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Opening Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horario</Text>
          <View style={styles.hoursCard}>
            {store.hours.map((hours) => (
              <View
                key={hours.dayOfWeek}
                style={[
                  styles.hoursRow,
                  hours.dayOfWeek === new Date().getDay() && styles.hoursRowToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    hours.dayOfWeek === new Date().getDay() && styles.dayTextToday,
                  ]}
                >
                  {DAY_NAMES[hours.dayOfWeek]}
                </Text>
                <Text
                  style={[
                    styles.hoursText,
                    hours.dayOfWeek === new Date().getDay() && styles.hoursTextToday,
                  ]}
                >
                  {hours.isClosed ? 'Cerrado' : `${hours.openTime} - ${hours.closeTime}`}
                </Text>
              </View>
            ))}
          </View>
          {todayHours && !todayHours.isClosed && (
            <Text style={styles.todayNote}>{t('Hoy cierra a las {closeTime}', { closeTime: todayHours.closeTime })}</Text>
          )}
        </View>

        {/* Services */}
        {store.services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Servicios</Text>
            <View style={styles.servicesGrid}>
              {store.services.map((service) => {
                const config = SERVICE_CONFIG[service];
                return (
                  <View key={service} style={styles.serviceItem}>
                    <View style={styles.serviceIcon}>
                      <Ionicons name={config.icon} size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.serviceLabel}>{config.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos disponibles</Text>
          {products.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Ionicons name="cart-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyProductsText}>
                No hay información de precios disponible.
              </Text>
            </View>
          ) : (
            <View style={styles.productsList}>
              {products.map(({ product, price }) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.productBrand}>
                      {product.brand} · {product.defaultUnit}
                    </Text>
                  </View>
                  <View style={styles.priceTag}>
                    {price.salePrice ? (
                      <>
                        <Text style={styles.priceSale}>
                          {formatCurrency(price.salePrice.toDecimal())}
                        </Text>
                        <Text style={styles.priceRegular}>
                          {formatCurrency(price.regularPrice.toDecimal())}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.priceSingle}>
                        {formatCurrency(price.regularPrice.toDecimal())}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Promotions */}
        {promotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Promociones activas</Text>
            {promotions.map((promo) => (
              <View key={promo.id} style={styles.promoCard}>
                <View style={styles.promoHeader}>
                  <Ionicons name="pricetag" size={18} color={colors.savings} />
                  <Text style={styles.promoName}>{promo.name}</Text>
                </View>
                <Text style={styles.promoDescription}>{promo.description}</Text>
                <View style={styles.promoMeta}>
                  <View style={[styles.inlineBadge, { backgroundColor: colors.savings + '20' }]}>
                    <Text style={[styles.inlineBadgeText, { color: colors.savings }]}>
                      {PROMO_TYPE_LABELS[promo.type]}
                    </Text>
                  </View>
                  {promo.cardRequired && (
                    <View style={[styles.inlineBadge, { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.inlineBadgeText, { color: colors.warning }]}>
                        Requiere {promo.cardBrand ?? 'tarjeta'}
                      </Text>
                    </View>
                  )}
                  {promo.membershipRequired && (
                    <View style={[styles.inlineBadge, { backgroundColor: colors.secondary + '20' }]}>
                      <Text style={[styles.inlineBadgeText, { color: colors.secondary }]}>
                        Membresía
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.routeButton} onPress={handleAddToRoute} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={20} color={colors.white} />
          <Text style={styles.routeButtonText}>Agregar a mi ruta</Text>
        </TouchableOpacity>
      </View>
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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { width: 32 },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  // Store Info
  storeHeader: {
    marginBottom: spacing.md,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  storeName: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  retailerName: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  // Map
  mapPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  mapAddress: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  mapCoords: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  // Hours
  hoursCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  hoursRowToday: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  dayText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  hoursText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  hoursTextToday: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  todayNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  // Services
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  serviceIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  // Products
  emptyProducts: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyProductsText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  productsList: {
    gap: spacing.sm,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  productInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  productName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  productBrand: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Promotions
  promoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  promoName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  promoDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  promoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Bottom Bar
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
  routeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  routeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  // Inline components (replacing dead Badge/EmptyState/PriceTag)
  inlineBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  inlineBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyDescription: {
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
    fontWeight: typography.fontWeight.semibold,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceSale: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.savings,
  },
  priceRegular: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceSingle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});
