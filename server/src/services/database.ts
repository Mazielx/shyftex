/**
 * Database service layer — wraps Prisma operations.
 * Replaces the old in-memory Map-based store.
 */
import { prisma } from '../lib/prisma.js';

// ─── JSON field helpers ───

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T[];
  } catch {
    return fallback;
  }
}

function serializeJsonArray<T>(value: T[] | undefined): string {
  if (!value || value.length === 0) return '[]';
  return JSON.stringify(value);
}

// ─── User ───

export const db = {
  users: {
    async findByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
    },
    async findById(id: string) {
      return prisma.user.findUnique({ where: { id } });
    },
    async create(data: { id: string; email: string; passwordHash: string; name: string }) {
      return prisma.user.create({ data });
    },
  },

  // ─── Shopping Lists ───

  lists: {
    async findByUser(userId: string) {
      return prisma.shoppingList.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    },
    async findById(id: string) {
      return prisma.shoppingList.findUnique({ where: { id } });
    },
    async create(data: {
      id: string;
      userId: string;
      title: string;
      rawInput: string;
      status?: string;
      itemCount?: number;
      parsedItemCount?: number;
      isRecurring?: boolean;
      recurringInterval?: string | null;
    }) {
      return prisma.shoppingList.create({ data });
    },
    async update(id: string, data: {
      title?: string;
      status?: string;
      itemCount?: number;
      parsedItemCount?: number;
      lastOptimizedAt?: Date | null;
      isRecurring?: boolean;
      recurringInterval?: string | null;
    }) {
      return prisma.shoppingList.update({ where: { id }, data });
    },
    async delete(id: string) {
      return prisma.shoppingList.delete({ where: { id } });
    },
  },

  // ─── Shopping Items ───

  items: {
    async findByList(listId: string) {
      const rows = await prisma.shoppingItem.findMany({ where: { listId } });
      return rows.map(deserializeItem);
    },
    async findById(id: string) {
      const row = await prisma.shoppingItem.findUnique({ where: { id } });
      return row ? deserializeItem(row) : null;
    },
    async create(data: {
      id: string;
      listId: string;
      rawInput: string;
      normalizedName?: string | null;
      category?: string | null;
      brand?: string | null;
      presentation?: string | null;
      quantity?: number;
      unit?: string;
      size?: string | null;
      barcode?: string | null;
      exactProductId?: string | null;
      allowsSubstitution?: boolean;
      brandRestrictions?: string[];
      substituteProductIds?: string[];
      priority?: string;
      isRequired?: boolean;
      notes?: string;
      matchedProductId?: string | null;
      matchLevel?: string;
    }) {
      return prisma.shoppingItem.create({
        data: {
          ...data,
          brandRestrictions: serializeJsonArray(data.brandRestrictions),
          substituteProductIds: serializeJsonArray(data.substituteProductIds),
        },
      });
    },
    async deleteByList(listId: string) {
      return prisma.shoppingItem.deleteMany({ where: { listId } });
    },
    async delete(id: string) {
      return prisma.shoppingItem.delete({ where: { id } });
    },
  },

  // ─── Stores ───

  stores: {
    async findById(id: string) {
      const row = await prisma.store.findUnique({ where: { id } });
      return row ? deserializeStore(row) : null;
    },
    async createMany(stores: Array<{
      id: string;
      retailerId: string;
      retailerName: string;
      name: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      latitude: number;
      longitude: number;
      phone?: string | null;
      hours?: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>;
      services?: string[];
      isMock?: boolean;
      source: string;
    }>) {
      for (const store of stores) {
        await prisma.store.create({
          data: {
            ...store,
            hours: serializeJsonArray(store.hours),
            services: serializeJsonArray(store.services),
            phone: store.phone ?? null,
          },
        });
      }
    },
    async findNearby(lat: number, lng: number, radiusKm: number) {
      // SQLite doesn't support geospatial queries — load all, filter in JS
      const allStores = await prisma.store.findMany();
      const deserialized = allStores.map(deserializeStore);
      const withDistance = deserialized.map((s) => ({
        ...s,
        _distance: haversineDistance(lat, lng, s.latitude, s.longitude),
      }));
      return withDistance
        .filter((s) => s._distance <= radiusKm)
        .sort((a, b) => a._distance - b._distance);
    },
    async count() {
      return prisma.store.count();
    },
  },

  // ─── Missions ───

  missions: {
    async findByUser(userId: string) {
      return prisma.mission.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    },
    async findById(id: string) {
      return prisma.mission.findUnique({ where: { id } });
    },
    async create(data: {
      id: string;
      userId: string;
      planId: string;
      listId: string;
      status?: string;
      totalExpectedCostCents: number;
      storeCount: number;
    }) {
      return prisma.mission.create({ data });
    },
    async update(id: string, data: {
      status?: string;
      totalActualCostCents?: number | null;
      storesVisited?: number;
      completedAt?: Date | null;
    }) {
      return prisma.mission.update({ where: { id }, data });
    },
  },

  // ─── Mission Items ───

  missionItems: {
    async findByMission(missionId: string) {
      return prisma.missionItem.findMany({ where: { missionId } });
    },
    async findById(id: string) {
      return prisma.missionItem.findUnique({ where: { id } });
    },
    async createMany(items: Array<{
      id: string;
      missionId: string;
      storeId: string;
      shoppingItemId: string;
      productName: string;
      quantity: number;
      unit: string;
      expectedPriceCents: number;
      status?: string;
    }>) {
      return prisma.missionItem.createMany({ data: items });
    },
    async update(id: string, data: {
      status?: string;
      actualPriceCents?: number | null;
      substitutionProductId?: string | null;
      notes?: string;
    }) {
      return prisma.missionItem.update({ where: { id }, data });
    },
  },

  // ─── Purchases ───

  purchases: {
    async findByUser(userId: string) {
      return prisma.purchase.findMany({
        where: { userId },
        orderBy: { purchasedAt: 'desc' },
      });
    },
    async createMany(purchases: Array<{
      id: string;
      userId: string;
      missionId: string;
      storeId: string;
      productId?: string | null;
      productName: string;
      quantity: number;
      unit: string;
      priceCents: number;
      currency?: string;
    }>) {
      return prisma.purchase.createMany({ data: purchases });
    },
  },

  // ─── Savings ───

  savings: {
    async findByUser(userId: string) {
      return prisma.savings.findMany({
        where: { userId },
        orderBy: { savedAt: 'desc' },
      });
    },
    async create(data: {
      id: string;
      userId: string;
      planId: string;
      missionId?: string | null;
      baselineCostCents: number;
      optimizedCostCents: number;
      transportCostCents?: number;
      netSavingsCents: number;
    }) {
      return prisma.savings.create({ data });
    },
  },

  // ─── Vehicles ───

  vehicles: {
    async findByUser(userId: string) {
      return prisma.vehicle.findMany({ where: { userId } });
    },
    async findById(id: string) {
      return prisma.vehicle.findUnique({ where: { id } });
    },
    async create(data: {
      id: string;
      userId: string;
      name: string;
      make?: string | null;
      model?: string | null;
      year?: number | null;
      fuelType: string;
      customEfficiencyKmPerLiter?: number | null;
      isDefault: boolean;
    }) {
      return prisma.vehicle.create({ data });
    },
    async update(id: string, data: {
      name?: string;
      make?: string | null;
      model?: string | null;
      year?: number | null;
      fuelType?: string;
      customEfficiencyKmPerLiter?: number | null;
      isDefault?: boolean;
    }) {
      return prisma.vehicle.update({ where: { id }, data });
    },
    async delete(id: string) {
      return prisma.vehicle.delete({ where: { id } });
    },
    async unsetDefaults(userId: string) {
      return prisma.vehicle.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    },
  },

  // ─── Preferences ───

  preferences: {
    async findByUser(userId: string) {
      const row = await prisma.userPreferences.findUnique({ where: { userId } });
      return row ? deserializePreferences(row) : null;
    },
    async upsert(userId: string, data: {
      defaultOptimizationMode?: string;
      maxBudgetCents?: number | null;
      maxTravelDistanceKm?: number | null;
      maxTravelTimeMinutes?: number | null;
      preferredStoreIds?: string[];
      excludedStoreIds?: string[];
      preferredBrands?: string[];
      dietaryRestrictions?: string[];
      currency?: string;
      language?: string;
    }) {
      const serialized = {
        ...(data.preferredStoreIds !== undefined && { preferredStoreIds: serializeJsonArray(data.preferredStoreIds) }),
        ...(data.excludedStoreIds !== undefined && { excludedStoreIds: serializeJsonArray(data.excludedStoreIds) }),
        ...(data.preferredBrands !== undefined && { preferredBrands: serializeJsonArray(data.preferredBrands) }),
        ...(data.dietaryRestrictions !== undefined && { dietaryRestrictions: serializeJsonArray(data.dietaryRestrictions) }),
      };

      const cleaned: Record<string, unknown> = { userId, ...serialized };
      for (const [key, value] of Object.entries(data)) {
        if (key !== 'preferredStoreIds' && key !== 'excludedStoreIds' && key !== 'preferredBrands' && key !== 'dietaryRestrictions') {
          cleaned[key] = value;
        }
      }

      return prisma.userPreferences.upsert({
        where: { userId },
        create: cleaned as never,
        update: cleaned as never,
      });
    },
  },

  // ─── Subscriptions ───

  subscriptions: {
    async findByUser(userId: string) {
      return prisma.subscription.findUnique({ where: { userId } });
    },
    async upsert(userId: string, data: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      plan?: string;
      status?: string;
      optimizationsUsed?: number;
      optimizationsLimit?: number;
      currentPeriodStart?: Date | null;
      currentPeriodEnd?: Date | null;
    }) {
      return prisma.subscription.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
    },
    async incrementOptimizations(userId: string) {
      return prisma.subscription.update({
        where: { userId },
        data: { optimizationsUsed: { increment: 1 } },
      });
    },
  },
};

// ─── Deserializers ───

interface ShoppingItemRow {
  id: string;
  listId: string;
  rawInput: string;
  normalizedName: string | null;
  category: string | null;
  brand: string | null;
  presentation: string | null;
  quantity: number;
  unit: string;
  size: string | null;
  barcode: string | null;
  exactProductId: string | null;
  allowsSubstitution: boolean;
  brandRestrictions: string;
  substituteProductIds: string;
  priority: string;
  isRequired: boolean;
  notes: string;
  matchedProductId: string | null;
  matchLevel: string;
  createdAt: Date;
  updatedAt: Date;
}

function deserializeItem(row: ShoppingItemRow) {
  return {
    ...row,
    brandRestrictions: parseJsonArray<string>(row.brandRestrictions),
    substituteProductIds: parseJsonArray<string>(row.substituteProductIds),
  };
}

interface StoreRow {
  id: string;
  retailerId: string;
  retailerName: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  hours: string;
  services: string;
  isMock: boolean;
  source: string;
}

function deserializeStore(row: StoreRow) {
  return {
    ...row,
    hours: parseJsonArray(row.hours),
    services: parseJsonArray<string>(row.services),
  };
}

interface PreferencesRow {
  id: string;
  userId: string;
  defaultOptimizationMode: string;
  maxBudgetCents: number | null;
  maxTravelDistanceKm: number | null;
  maxTravelTimeMinutes: number | null;
  preferredStoreIds: string;
  excludedStoreIds: string;
  preferredBrands: string;
  dietaryRestrictions: string;
  currency: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

function deserializePreferences(row: PreferencesRow) {
  return {
    ...row,
    preferredStoreIds: parseJsonArray<string>(row.preferredStoreIds),
    excludedStoreIds: parseJsonArray<string>(row.excludedStoreIds),
    preferredBrands: parseJsonArray<string>(row.preferredBrands),
    dietaryRestrictions: parseJsonArray<string>(row.dietaryRestrictions),
  };
}

// ─── Geo helper ───

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
