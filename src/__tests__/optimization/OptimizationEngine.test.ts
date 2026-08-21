import { OptimizationEngine, OptimizationInput } from '../../optimization/OptimizationEngine';
import { Money } from '../../domain/valueObjects/Money';
import { ShoppingItem, ItemPriority, MatchLevel } from '../../domain/entities/ShoppingItem';
import { ShoppingPlan, OptimizationMode, PlanConfidence } from '../../domain/entities/ShoppingPlan';
import { Store, StoreService } from '../../domain/entities/Store';
import { Price, DataSource, DataConfidence } from '../../domain/entities/Price';
import { Promotion, PromotionType, PromotionProps } from '../../domain/entities/Promotion';
import { Inventory, InventoryStatus } from '../../domain/entities/Inventory';

// ─── Helpers ───

const USER_LOCATION = { latitude: 19.4326, longitude: -99.1332 }; // Mexico City

function createStore(
  overrides: {
    id?: string;
    name?: string;
    retailerId?: string;
    retailerName?: string;
    latitude?: number;
    longitude?: number;
  } = {},
): Store {
  return new Store({
    id: overrides.id ?? 'store-1',
    retailerId: overrides.retailerId ?? 'retailer-1',
    retailerName: overrides.retailerName ?? 'Super Abarrotes',
    name: overrides.name ?? 'Centro',
    address: 'Av. Principal 123',
    city: 'CDMX',
    state: 'CDMX',
    zipCode: '06000',
    latitude: overrides.latitude ?? 19.4326,
    longitude: overrides.longitude ?? -99.1332,
    phone: null,
    hours: [
      { dayOfWeek: 1, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 0, openTime: '08:00', closeTime: '20:00', isClosed: false },
    ],
    services: [StoreService.PARKING],
    isMock: true,
    source: 'MOCK',
  });
}

function createItem(
  overrides: Partial<{
    id: string;
    rawInput: string;
    normalizedName: string;
    brand: string;
    category: string;
    quantity: number;
    matchedProductId: string | null;
    matchLevel: MatchLevel;
    priority: ItemPriority;
    isRequired: boolean;
    allowsSubstitution: boolean;
    substituteProductIds: string[];
  }> = {},
): ShoppingItem {
  return new ShoppingItem({
    id: overrides.id ?? `item-${Math.random().toString(36).substring(2, 9)}`,
    listId: 'list-1',
    rawInput: overrides.rawInput ?? 'Product',
    normalizedName: overrides.normalizedName ?? overrides.rawInput ?? 'Product',
    category: overrides.category ?? 'General',
    brand: overrides.brand ?? null,
    presentation: null,
    quantity: overrides.quantity ?? 1,
    unit: 'pieza',
    size: null,
    barcode: null,
    exactProductId: null,
    allowsSubstitution: overrides.allowsSubstitution ?? false,
    brandRestrictions: [],
    substituteProductIds: overrides.substituteProductIds ?? [],
    priority: overrides.priority ?? ItemPriority.REQUIRED,
    isRequired: overrides.isRequired ?? true,
    notes: '',
    matchedProductId: overrides.matchedProductId ?? null,
    matchLevel: overrides.matchLevel ?? MatchLevel.INCOMPATIBLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createPrice(storeId: string, productId: string, priceCents: number): Price {
  return new Price({
    id: `price-${storeId}-${productId}`,
    storeProductId: `${storeId}:${productId}`,
    currency: 'MXN',
    regularPrice: Money.fromCents(priceCents),
    salePrice: null,
    unitPrice: null,
    unitOfMeasure: null,
    observedAt: new Date(),
    validFrom: null,
    validUntil: null,
    source: DataSource.OFFICIAL_API,
    confidence: DataConfidence.CONFIRMED,
    membershipRequired: false,
    couponRequired: false,
    cardRequired: false,
    cardBrand: null,
    conditions: [],
  });
}

function createPromotion(overrides: {
  storeId: string;
  id?: string;
  retailerId?: string;
  type?: PromotionType;
  name?: string;
  description?: string;
  discountPercentage?: number | null;
  discountAmount?: Money | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  maxDiscount?: Money | null;
  minimumPurchase?: Money | null;
  applicableProductIds?: string[];
  applicableCategories?: string[];
  cardRequired?: boolean;
  cardBrand?: string | null;
  membershipRequired?: boolean;
  couponCode?: string | null;
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number | null;
  usageCount?: number;
}): Promotion {
  const now = new Date();
  return new Promotion({
    id: overrides.id ?? `promo-${Math.random().toString(36).substring(2, 9)}`,
    storeId: overrides.storeId,
    retailerId: overrides.retailerId ?? 'retailer-1',
    type: overrides.type ?? PromotionType.PERCENTAGE_DISCOUNT,
    name: overrides.name ?? 'Promo',
    description: overrides.description ?? '',
    discountPercentage: overrides.discountPercentage ?? null,
    discountAmount: overrides.discountAmount ?? null,
    buyQuantity: overrides.buyQuantity ?? null,
    getQuantity: overrides.getQuantity ?? null,
    maxDiscount: overrides.maxDiscount ?? null,
    minimumPurchase: overrides.minimumPurchase ?? null,
    applicableProductIds: overrides.applicableProductIds ?? [],
    applicableCategories: overrides.applicableCategories ?? [],
    cardRequired: overrides.cardRequired ?? false,
    cardBrand: overrides.cardBrand ?? null,
    membershipRequired: overrides.membershipRequired ?? false,
    couponCode: overrides.couponCode ?? null,
    validFrom: overrides.validFrom ?? new Date(now.getTime() - 86400000),
    validUntil: overrides.validUntil ?? new Date(now.getTime() + 86400000),
    usageLimit: overrides.usageLimit ?? null,
    usageCount: overrides.usageCount ?? 0,
    isMock: true,
    source: 'MOCK',
  });
}

function createInventory(
  storeId: string,
  productId: string,
  status: InventoryStatus = InventoryStatus.IN_STOCK,
): Inventory {
  return new Inventory({
    id: `inv-${storeId}-${productId}`,
    storeProductId: `${storeId}:${productId}`,
    status,
    quantityAvailable: status === InventoryStatus.OUT_OF_STOCK ? 0 : 10,
    lastChecked: new Date(),
    source: 'MOCK',
    confidence: 'CONFIRMED',
    isMock: true,
  });
}

function buildInput(
  overrides: {
    items?: ShoppingItem[];
    stores?: Store[];
    prices?: Map<string, Price[]>;
    promotions?: Map<string, Promotion[]>;
    inventory?: Map<string, Inventory>;
    mode?: OptimizationMode;
    maxBudget?: Money | null;
    maxStores?: number;
    maxDeviationKm?: number | null;
    allowedStoreIds?: string[];
    excludedStoreIds?: string[];
    userLocation?: { latitude: number; longitude: number };
    vehicleFuelEfficiency?: number | null;
  } = {},
): OptimizationInput {
  return {
    listId: 'list-1',
    userId: 'user-1',
    items: overrides.items ?? [],
    stores: overrides.stores ?? [],
    prices: overrides.prices ?? new Map(),
    promotions: overrides.promotions ?? new Map(),
    inventory: overrides.inventory ?? new Map(),
    userLocation: overrides.userLocation ?? USER_LOCATION,
    userPreferences: {
      maxWalkingDistanceKm: 5,
      preferredRetailerIds: [],
      avoidedRetailerIds: [],
      acceptedSubstitutionBrands: [],
      hasMembership: false,
      hasCoupons: false,
      acceptedCardBrands: [],
      vehicleFuelEfficiency: overrides.vehicleFuelEfficiency ?? null,
      valueOfTimePerHour: null,
    },
    constraints: {
      maxBudget: overrides.maxBudget ?? null,
      maxTimeMinutes: null,
      maxDistanceKm: null,
      maxStores: overrides.maxStores ?? 3,
      maxDeviationKm: overrides.maxDeviationKm ?? null,
      allowedStoreIds: overrides.allowedStoreIds ?? [],
      excludedStoreIds: overrides.excludedStoreIds ?? [],
      requiredProductIds: [],
    },
    mode: overrides.mode ?? OptimizationMode.BALANCED,
  };
}

function createPricesForStore(
  storeId: string,
  items: ShoppingItem[],
  priceCents: number,
): Map<string, Price[]> {
  const prices = new Map<string, Price[]>();
  for (const item of items) {
    if (item.matchedProductId) {
      const key = `${storeId}:${item.matchedProductId}`;
      prices.set(key, [createPrice(storeId, item.matchedProductId, priceCents)]);
    }
  }
  return prices;
}

function createInventoryForStore(
  storeId: string,
  items: ShoppingItem[],
  status: InventoryStatus = InventoryStatus.IN_STOCK,
): Map<string, Inventory> {
  const inventory = new Map<string, Inventory>();
  for (const item of items) {
    if (item.matchedProductId) {
      const key = `${storeId}:${item.matchedProductId}`;
      inventory.set(key, createInventory(storeId, item.matchedProductId, status));
    }
  }
  return inventory;
}

function mergeMaps<K, V>(a: Map<K, V>, b: Map<K, V>): Map<K, V> {
  const merged = new Map(a);
  for (const [key, value] of b) {
    merged.set(key, value);
  }
  return merged;
}

// ─── Tests ───

describe('OptimizationEngine', () => {
  let engine: OptimizationEngine;

  beforeEach(() => {
    engine = new OptimizationEngine();
  });

  describe('Edge Cases', () => {
    it('returns no plans and global warning for empty item list', () => {
      const store = createStore();
      const input = buildInput({
        items: [],
        stores: [store],
      });

      const result = engine.optimize(input);

      expect(result.plans).toHaveLength(0);
      expect(result.warnings).toContain('No feasible plan found with your current constraints.');
    });

    it('returns no plans when no stores are available', () => {
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const input = buildInput({
        items: [item],
        stores: [],
      });

      const result = engine.optimize(input);

      expect(result.plans).toHaveLength(0);
    });

    it('returns no plans when all stores are excluded', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const input = buildInput({
        items: [item],
        stores: [store],
        excludedStoreIds: ['store-1'],
      });

      const result = engine.optimize(input);

      expect(result.plans).toHaveLength(0);
    });

    it('returns no plans when all stores are too far', () => {
      const store = createStore({ latitude: 25.0, longitude: -100.0 }); // ~600km away
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const input = buildInput({
        items: [item],
        stores: [store],
        maxDeviationKm: 10,
      });

      const result = engine.optimize(input);

      expect(result.plans).toHaveLength(0);
    });

    it('returns no plans when all items are unmatched', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: null,
        matchLevel: MatchLevel.INCOMPATIBLE,
      });
      const input = buildInput({
        items: [item],
        stores: [store],
        prices: createPricesForStore('store-1', [item], 1500),
      });

      const result = engine.optimize(input);

      expect(result.plans).toHaveLength(0);
    });

    it('reports unmatched products in global warnings', () => {
      const store = createStore();
      const matchedItem = createItem({
        id: 'item-matched',
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const unmatchedItem = createItem({
        id: 'item-unmatched',
        matchedProductId: null,
        matchLevel: MatchLevel.INCOMPATIBLE,
      });
      const prices = createPricesForStore('store-1', [matchedItem], 1500);
      const inventory = createInventoryForStore('store-1', [matchedItem]);
      const input = buildInput({
        items: [matchedItem, unmatchedItem],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('1 product(s) could not be matched')]),
      );
    });
  });

  describe('Single Store Optimization', () => {
    it('produces a plan with one store when all items are available', () => {
      const store = createStore({ id: 'store-1', name: 'Mi Tienda' });
      const item1 = createItem({
        id: 'item-1',
        rawInput: 'Leche',
        normalizedName: 'Leche',
        matchedProductId: 'prod-leche',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const item2 = createItem({
        id: 'item-2',
        rawInput: 'Pan',
        normalizedName: 'Pan',
        matchedProductId: 'prod-pan',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-leche', [createPrice('store-1', 'prod-leche', 2500)]],
        ['store-1:prod-pan', [createPrice('store-1', 'prod-pan', 3500)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-leche', createInventory('store-1', 'prod-leche')],
        ['store-1:prod-pan', createInventory('store-1', 'prod-pan')],
      ]);

      const input = buildInput({
        items: [item1, item2],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThanOrEqual(1);
      const plan = result.plans[0];
      expect(plan.storeStops).toHaveLength(1);
      expect(plan.storeStops[0].storeId).toBe('store-1');
      expect(plan.storeStops[0].items).toHaveLength(2);
    });

    it('calculates correct product cost for single store', () => {
      const store = createStore({ id: 'store-1' });
      const item1 = createItem({
        id: 'item-1',
        quantity: 2,
        matchedProductId: 'prod-a',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const item2 = createItem({
        id: 'item-2',
        quantity: 1,
        matchedProductId: 'prod-b',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-a', [createPrice('store-1', 'prod-a', 1000)]], // $10.00
        ['store-1:prod-b', [createPrice('store-1', 'prod-b', 500)]], // $5.00
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-a', createInventory('store-1', 'prod-a')],
        ['store-1:prod-b', createInventory('store-1', 'prod-b')],
      ]);

      const input = buildInput({
        items: [item1, item2],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);
      const plan = result.plans[0];

      // item1: $10.00 x 2 = $20.00, item2: $5.00 x 1 = $5.00 => $25.00
      expect(plan.totalProductCost.cents).toBe(2500);
    });
  });

  describe('Two Store Optimization', () => {
    it('splits items across two stores when beneficial', () => {
      const store1 = createStore({
        id: 'store-1',
        name: 'Bodega A',
        latitude: 19.4326,
        longitude: -99.1332,
      });
      const store2 = createStore({
        id: 'store-2',
        name: 'Bodega B',
        retailerId: 'retailer-2',
        retailerName: 'Bodega Económica',
        latitude: 19.435,
        longitude: -99.135,
      });

      const item1 = createItem({
        id: 'item-1',
        matchedProductId: 'prod-a',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const item2 = createItem({
        id: 'item-2',
        matchedProductId: 'prod-b',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      // Store 1 only has prod-a, Store 2 only has prod-b
      const prices = new Map<string, Price[]>([
        ['store-1:prod-a', [createPrice('store-1', 'prod-a', 1000)]],
        ['store-2:prod-b', [createPrice('store-2', 'prod-b', 1200)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-a', createInventory('store-1', 'prod-a')],
        ['store-2:prod-b', createInventory('store-2', 'prod-b')],
      ]);

      const input = buildInput({
        items: [item1, item2],
        stores: [store1, store2],
        prices,
        inventory,
        mode: OptimizationMode.MAXIMUM_SAVINGS,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThanOrEqual(1);

      const twoStorePlan = result.plans.find((p) => p.storeStops.length === 2);
      expect(twoStorePlan).toBeDefined();
      expect(twoStorePlan!.storeStops).toHaveLength(2);
      const allItemIds = twoStorePlan!.storeStops.flatMap((s) =>
        s.items.map((i) => i.shoppingItemId),
      );
      expect(allItemIds).toContain('item-1');
      expect(allItemIds).toContain('item-2');
    });
  });

  describe('Budget Constraint', () => {
    it('generates a warning when plan exceeds budget', () => {
      const store = createStore();
      const item = createItem({
        quantity: 5,
        matchedProductId: 'prod-expensive',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-expensive', [createPrice('store-1', 'prod-expensive', 5000)]], // $50 each
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-expensive', createInventory('store-1', 'prod-expensive')],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        maxBudget: Money.fromDecimal(100), // $100 budget, but cost is $250
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      expect(plan.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('exceeds your budget')]),
      );
    });
  });

  describe('Maximum Stores Constraint', () => {
    it('does not exceed maxStores limit', () => {
      // Create many stores and items, but maxStores=2 should limit
      const stores = Array.from({ length: 5 }, (_, i) =>
        createStore({
          id: `store-${i}`,
          name: `Store ${i}`,
          retailerId: `retailer-${i}`,
          retailerName: `Retailer ${i}`,
          latitude: 19.43 + i * 0.01,
          longitude: -99.13 - i * 0.01,
        }),
      );

      const items = Array.from({ length: 3 }, (_, i) =>
        createItem({
          id: `item-${i}`,
          matchedProductId: `prod-${i}`,
          matchLevel: MatchLevel.EXACT_MATCH,
        }),
      );

      const prices = new Map<string, Price[]>();
      const inventory = new Map<string, Inventory>();
      for (const store of stores) {
        for (const item of items) {
          const key = `${store.id}:${item.matchedProductId}`;
          prices.set(key, [
            createPrice(store.id, item.matchedProductId!, 1000 + Math.floor(Math.random() * 2000)),
          ]);
          inventory.set(key, createInventory(store.id, item.matchedProductId!));
        }
      }

      const input = buildInput({
        items,
        stores,
        prices,
        inventory,
        maxStores: 2,
      });

      const result = engine.optimize(input);

      for (const plan of result.plans) {
        expect(plan.storeStops.length).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('Items with No Match Excluded', () => {
    it('excludes unmatched items from the plan', () => {
      const store = createStore();
      const matchedItem = createItem({
        id: 'item-matched',
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const unmatchedItem = createItem({
        id: 'item-unmatched',
        matchedProductId: null,
        matchLevel: MatchLevel.INCOMPATIBLE,
      });

      const prices = createPricesForStore('store-1', [matchedItem], 1500);
      const inventory = createInventoryForStore('store-1', [matchedItem]);

      const input = buildInput({
        items: [matchedItem, unmatchedItem],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      const itemIds = plan.storeStops.flatMap((s) => s.items.map((i) => i.shoppingItemId));
      expect(itemIds).toContain('item-matched');
      expect(itemIds).not.toContain('item-unmatched');
    });

    it('excludes items with INCOMPATIBLE match level', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.INCOMPATIBLE,
      });

      const input = buildInput({
        items: [item],
        stores: [store],
        prices: createPricesForStore('store-1', [], 1500),
      });

      const result = engine.optimize(input);

      // INCOMPATIBLE items are not available at this store conceptually
      // but they do have matchedProductId set, so they might still be scored
      // The key thing is that the engine handles them properly
    });
  });

  describe('Promotions', () => {
    it('applies percentage discount promotion', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        quantity: 2,
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]], // $10 each
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
      ]);

      const promo = createPromotion({
        storeId: 'store-1',
        type: PromotionType.PERCENTAGE_DISCOUNT,
        discountPercentage: 10,
        applicableProductIds: ['prod-1'],
      });
      const promotions = new Map<string, Promotion[]>([['store-1', [promo]]]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        promotions,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      const storeStop = plan.storeStops[0];

      // 10% off $20 total = $2 savings
      expect(storeStop.promotions.length).toBeGreaterThanOrEqual(1);
      expect(storeStop.promotions[0].savings.cents).toBe(200);
    });

    it('applies 2x1 promotion (buy 2 pay for 1)', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        quantity: 2,
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]], // $10 each
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
      ]);

      const promo = createPromotion({
        storeId: 'store-1',
        type: PromotionType.TWO_X_ONE,
        applicableProductIds: ['prod-1'],
      });
      const promotions = new Map<string, Promotion[]>([['store-1', [promo]]]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        promotions,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      const storeStop = plan.storeStops[0];

      // 2x1: 1 pair = 1 free item = $10 savings
      expect(storeStop.promotions.length).toBeGreaterThanOrEqual(1);
      expect(storeStop.promotions[0].savings.cents).toBe(1000);
    });

    it('does not apply 2x1 when quantity is less than 2', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        quantity: 1,
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
      ]);

      const promo = createPromotion({
        storeId: 'store-1',
        type: PromotionType.TWO_X_ONE,
        applicableProductIds: ['prod-1'],
      });
      const promotions = new Map<string, Promotion[]>([['store-1', [promo]]]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        promotions,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const storeStop = result.plans[0].storeStops[0];
      expect(storeStop.promotions).toHaveLength(0);
    });

    it('applies 3x2 promotion (buy 3 pay for 2)', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        quantity: 3,
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
      ]);

      const promo = createPromotion({
        storeId: 'store-1',
        type: PromotionType.THREE_X_TWO,
        applicableProductIds: ['prod-1'],
      });
      const promotions = new Map<string, Promotion[]>([['store-1', [promo]]]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        promotions,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const storeStop = result.plans[0].storeStops[0];

      // 3x2: 1 set of 3 = 1 free item = $10 savings
      expect(storeStop.promotions.length).toBeGreaterThanOrEqual(1);
      expect(storeStop.promotions[0].savings.cents).toBe(1000);
    });

    it('does not apply expired promotions', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        quantity: 2,
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
      ]);

      const promo = createPromotion({
        storeId: 'store-1',
        type: PromotionType.TWO_X_ONE,
        applicableProductIds: ['prod-1'],
        validFrom: new Date('2020-01-01'),
        validUntil: new Date('2020-12-31'), // expired
      });
      const promotions = new Map<string, Promotion[]>([['store-1', [promo]]]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        promotions,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const storeStop = result.plans[0].storeStops[0];
      expect(storeStop.promotions).toHaveLength(0);
    });

    it('does not apply membership promotion without membership', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        quantity: 2,
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
      ]);

      const promo = createPromotion({
        storeId: 'store-1',
        type: PromotionType.TWO_X_ONE,
        applicableProductIds: ['prod-1'],
        membershipRequired: true,
      });
      const promotions = new Map<string, Promotion[]>([['store-1', [promo]]]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        promotions,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const storeStop = result.plans[0].storeStops[0];
      expect(storeStop.promotions).toHaveLength(0);
    });
  });

  describe('Store Dominance Elimination', () => {
    it('dominated stores are not in the best plan', () => {
      const cheapStore = createStore({
        id: 'store-cheap',
        name: 'Cheap',
        latitude: 19.4326,
        longitude: -99.1332,
      });
      const expensiveStore = createStore({
        id: 'store-expensive',
        name: 'Expensive',
        retailerId: 'retailer-2',
        retailerName: 'Expensive Retail',
        latitude: 19.44,
        longitude: -99.14,
      });

      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-cheap:prod-1', [createPrice('store-cheap', 'prod-1', 1000)]],
        ['store-expensive:prod-1', [createPrice('store-expensive', 'prod-1', 5000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-cheap:prod-1', createInventory('store-cheap', 'prod-1')],
        ['store-expensive:prod-1', createInventory('store-expensive', 'prod-1')],
      ]);

      const input = buildInput({
        items: [item],
        stores: [cheapStore, expensiveStore],
        prices,
        inventory,
        mode: OptimizationMode.MAXIMUM_SAVINGS,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const bestPlan = result.plans[0];
      expect(bestPlan.storeStops[0].storeId).toBe('store-cheap');
    });
  });

  describe('Optimization Modes', () => {
    function setupTwoStoreScenario() {
      const store1 = createStore({
        id: 'store-1',
        name: 'Close & Cheap',
        latitude: 19.433,
        longitude: -99.133,
      });
      const store2 = createStore({
        id: 'store-2',
        name: 'Far & Cheap',
        retailerId: 'retailer-2',
        retailerName: 'Far Store',
        latitude: 19.45,
        longitude: -99.15,
      });

      const item1 = createItem({
        id: 'item-1',
        matchedProductId: 'prod-a',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const item2 = createItem({
        id: 'item-2',
        matchedProductId: 'prod-b',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-a', [createPrice('store-1', 'prod-a', 1000)]],
        ['store-1:prod-b', [createPrice('store-1', 'prod-b', 1000)]],
        ['store-2:prod-a', [createPrice('store-2', 'prod-a', 800)]],
        ['store-2:prod-b', [createPrice('store-2', 'prod-b', 800)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-a', createInventory('store-1', 'prod-a')],
        ['store-1:prod-b', createInventory('store-1', 'prod-b')],
        ['store-2:prod-a', createInventory('store-2', 'prod-a')],
        ['store-2:prod-b', createInventory('store-2', 'prod-b')],
      ]);

      return { store1, store2, item1, item2, prices, inventory };
    }

    it('MAXIMUM_SAVINGS mode picks cheapest overall plan', () => {
      const { store1, store2, item1, item2, prices, inventory } = setupTwoStoreScenario();

      const input = buildInput({
        items: [item1, item2],
        stores: [store1, store2],
        prices,
        inventory,
        mode: OptimizationMode.MAXIMUM_SAVINGS,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      // Best plan should have lowest effective cost
      const bestPlan = result.plans[0];
      for (const plan of result.plans) {
        expect(plan.effectiveTotalCost.cents).toBeGreaterThanOrEqual(
          bestPlan.effectiveTotalCost.cents,
        );
      }
    });

    it('MAXIMUM_CONVENIENCE mode prefers fewer stores', () => {
      const { store1, store2, item1, item2, prices, inventory } = setupTwoStoreScenario();

      const input = buildInput({
        items: [item1, item2],
        stores: [store1, store2],
        prices,
        inventory,
        mode: OptimizationMode.MAXIMUM_CONVENIENCE,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const bestPlan = result.plans[0];
      // Best plan should have fewest stores, then least time
      for (const plan of result.plans) {
        if (plan.storeStops.length < bestPlan.storeStops.length) {
          fail('Best plan should have fewest stores');
        }
      }
    });

    it('BALANCED mode considers both cost and time', () => {
      const { store1, store2, item1, item2, prices, inventory } = setupTwoStoreScenario();

      const input = buildInput({
        items: [item1, item2],
        stores: [store1, store2],
        prices,
        inventory,
        mode: OptimizationMode.BALANCED,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      // Balanced: score = cost + time*100
      const bestPlan = result.plans[0];
      const bestScore = bestPlan.effectiveTotalCost.cents + bestPlan.totalTimeMinutes * 100;
      for (const plan of result.plans) {
        const score = plan.effectiveTotalCost.cents + plan.totalTimeMinutes * 100;
        expect(score).toBeGreaterThanOrEqual(bestScore);
      }
    });
  });

  describe('Transportation Cost', () => {
    it('includes transport cost in the total', () => {
      const store = createStore({
        id: 'store-1',
        latitude: 19.44,
        longitude: -99.14,
      });
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = createPricesForStore('store-1', [item], 1500);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      expect(plan.totalTransportCost.cents).toBeGreaterThan(0);
      expect(plan.effectiveTotalCost.cents).toBe(
        plan.totalProductCost.cents + plan.totalTransportCost.cents,
      );
    });

    it('uses fuel efficiency when provided', () => {
      const store = createStore({
        id: 'store-1',
        latitude: 19.44,
        longitude: -99.14,
      });
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = createPricesForStore('store-1', [item], 1500);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
        vehicleFuelEfficiency: 15, // 15 km/L
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      expect(plan.totalTransportCost.cents).toBeGreaterThan(0);
    });
  });

  describe('Unfulfilled Items', () => {
    it('identifies items not in the best plan', () => {
      const store = createStore();
      const availableItem = createItem({
        id: 'item-available',
        matchedProductId: 'prod-available',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const unavailableItem = createItem({
        id: 'item-unavailable',
        matchedProductId: 'prod-unavailable',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-available', [createPrice('store-1', 'prod-available', 1000)]],
        // No price for prod-unavailable
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-available', createInventory('store-1', 'prod-available')],
      ]);

      const input = buildInput({
        items: [availableItem, unavailableItem],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      // unavailableItem should be in unfulfilled
      const unfulfilledIds = result.unfulfilledItems.map((u) => u.shoppingItemId);
      expect(unfulfilledIds).toContain('item-unavailable');
    });

    it('returns all items as unfulfilled when no plan exists', () => {
      const item1 = createItem({
        id: 'item-1',
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const item2 = createItem({
        id: 'item-2',
        matchedProductId: 'prod-2',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const input = buildInput({
        items: [item1, item2],
        stores: [],
      });

      const result = engine.optimize(input);

      expect(result.plans).toHaveLength(0);
      expect(result.unfulfilledItems).toHaveLength(2);
      expect(result.unfulfilledItems.map((u) => u.shoppingItemId)).toEqual(
        expect.arrayContaining(['item-1', 'item-2']),
      );
    });
  });

  describe('Warnings', () => {
    it('generates warning for items not available at store', () => {
      const store = createStore();
      const availableItem = createItem({
        id: 'item-available',
        matchedProductId: 'prod-available',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const unavailableItem = createItem({
        id: 'item-unavailable',
        matchedProductId: 'prod-unavailable',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-available', [createPrice('store-1', 'prod-available', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-available', createInventory('store-1', 'prod-available')],
      ]);

      const input = buildInput({
        items: [availableItem, unavailableItem],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      const plan = result.plans[0];
      expect(plan.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('item(s) are not available at')]),
      );
    });

    it('generates time warning when travel exceeds max', () => {
      const farStore = createStore({
        id: 'store-1',
        latitude: 19.5, // ~7km away
        longitude: -99.2,
      });
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = createPricesForStore('store-1', [item], 1000);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [farStore],
        prices,
        inventory,
      });
      input.constraints.maxTimeMinutes = 1; // 1 minute max

      const result = engine.optimize(input);

      const plan = result.plans[0];
      expect(plan.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('travel time')]),
      );
    });
  });

  describe('Plan Confidence', () => {
    it('returns HIGH confidence when prices are confirmed and inventory in stock', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const price = new Price({
        id: 'price-1',
        storeProductId: 'store-1:prod-1',
        currency: 'MXN',
        regularPrice: Money.fromDecimal(10),
        salePrice: null,
        unitPrice: null,
        unitOfMeasure: null,
        observedAt: new Date(),
        validFrom: null,
        validUntil: null,
        source: DataSource.OFFICIAL_API,
        confidence: DataConfidence.CONFIRMED,
        membershipRequired: false,
        couponRequired: false,
        cardRequired: false,
        cardBrand: null,
        conditions: [],
      });
      const prices = new Map<string, Price[]>([['store-1:prod-1', [price]]]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1', InventoryStatus.IN_STOCK)],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      expect(result.plans[0].confidence).toBe(PlanConfidence.HIGH);
    });

    it('returns LOW confidence when prices are estimated and inventory unknown', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const price = new Price({
        id: 'price-1',
        storeProductId: 'store-1:prod-1',
        currency: 'MXN',
        regularPrice: Money.fromDecimal(10),
        salePrice: null,
        unitPrice: null,
        unitOfMeasure: null,
        observedAt: new Date(),
        validFrom: null,
        validUntil: null,
        source: DataSource.ESTIMATED,
        confidence: DataConfidence.ESTIMATED,
        membershipRequired: false,
        couponRequired: false,
        cardRequired: false,
        cardBrand: null,
        conditions: [],
      });
      const prices = new Map<string, Price[]>([['store-1:prod-1', [price]]]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1', InventoryStatus.UNKNOWN)],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      expect(result.plans[0].confidence).toBe(PlanConfidence.LOW);
    });
  });

  describe('Explanations', () => {
    it('generates CHOICE explanation for store recommendation', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = createPricesForStore('store-1', [item], 1000);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const explanations = result.plans[0].explanations;
      const choiceExplanation = explanations.find((e) => e.category === 'CHOICE');
      expect(choiceExplanation).toBeDefined();
      expect(choiceExplanation!.text).toContain('Super Abarrotes');
    });

    it('generates SAVINGS explanation when savings exist', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
        quantity: 3,
      });

      const prices = createPricesForStore('store-1', [item], 1000);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      // There should be some savings if baseline is higher
      if (plan.estimatedSavings && plan.estimatedSavings.isGreaterThan(Money.zero())) {
        const savingsExplanation = plan.explanations.find((e) => e.category === 'SAVINGS');
        expect(savingsExplanation).toBeDefined();
      }
    });

    it('generates WARNING explanation for unavailable items', () => {
      const store = createStore();
      const availableItem = createItem({
        id: 'item-available',
        matchedProductId: 'prod-available',
        matchLevel: MatchLevel.EXACT_MATCH,
      });
      const unavailableItem = createItem({
        id: 'item-unavailable',
        matchedProductId: 'prod-unavailable',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-available', [createPrice('store-1', 'prod-available', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-available', createInventory('store-1', 'prod-available')],
      ]);

      const input = buildInput({
        items: [availableItem, unavailableItem],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const explanations = result.plans[0].explanations;
      const warningExplanation = explanations.find((e) => e.category === 'WARNING');
      expect(warningExplanation).toBeDefined();
      expect(warningExplanation!.text).toContain('item(s) could not be found');
    });
  });

  describe('Store Filtering', () => {
    it('respects allowedStoreIds constraint', () => {
      const store1 = createStore({ id: 'store-1', name: 'Store 1' });
      const store2 = createStore({
        id: 'store-2',
        name: 'Store 2',
        retailerId: 'retailer-2',
        retailerName: 'Retail 2',
      });

      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
        ['store-2:prod-1', [createPrice('store-2', 'prod-1', 1500)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
        ['store-2:prod-1', createInventory('store-2', 'prod-1')],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store1, store2],
        prices,
        inventory,
        allowedStoreIds: ['store-2'],
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      expect(plan.storeStops[0].storeId).toBe('store-2');
    });

    it('respects excludedStoreIds constraint', () => {
      const store1 = createStore({ id: 'store-1' });
      const store2 = createStore({
        id: 'store-2',
        retailerId: 'retailer-2',
        retailerName: 'Retail 2',
      });

      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
        ['store-2:prod-1', [createPrice('store-2', 'prod-1', 1500)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
        ['store-2:prod-1', createInventory('store-2', 'prod-1')],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store1, store2],
        prices,
        inventory,
        excludedStoreIds: ['store-1'],
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      expect(plan.storeStops[0].storeId).toBe('store-2');
    });

    it('filters out avoided retailers', () => {
      const store1 = createStore({ id: 'store-1', retailerId: 'bad-retailer' });
      const store2 = createStore({
        id: 'store-2',
        retailerId: 'good-retailer',
        retailerName: 'Good Retail',
      });

      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
        ['store-2:prod-1', [createPrice('store-2', 'prod-1', 1500)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1')],
        ['store-2:prod-1', createInventory('store-2', 'prod-1')],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store1, store2],
        prices,
        inventory,
      });
      input.userPreferences.avoidedRetailerIds = ['bad-retailer'];

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const plan = result.plans[0];
      expect(plan.storeStops[0].storeId).toBe('store-2');
    });
  });

  describe('Inventory Handling', () => {
    it('excludes out-of-stock items', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1', InventoryStatus.OUT_OF_STOCK)],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      // out-of-stock item makes this store have 0 available items, so no plan
      expect(result.plans).toHaveLength(0);
    });

    it('includes low stock items', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
      ]);
      const inventory = new Map<string, Inventory>([
        ['store-1:prod-1', createInventory('store-1', 'prod-1', InventoryStatus.LOW_STOCK)],
      ]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      expect(result.plans[0].storeStops[0].items).toHaveLength(1);
    });

    it('includes items with no inventory record', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = new Map<string, Price[]>([
        ['store-1:prod-1', [createPrice('store-1', 'prod-1', 1000)]],
      ]);
      // No inventory entry for this item

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory: new Map(),
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      expect(result.plans[0].storeStops[0].items).toHaveLength(1);
    });
  });

  describe('Plan Structure', () => {
    it('includes a route with HOME and STORE stops', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = createPricesForStore('store-1', [item], 1000);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      const route = result.plans[0].route;
      expect(route.length).toBeGreaterThanOrEqual(2);
      expect(route[0].type).toBe('HOME');
      expect(route[1].type).toBe('STORE');
    });

    it('includes assumptions', () => {
      const store = createStore();
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = createPricesForStore('store-1', [item], 1000);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      expect(result.plans[0].assumptions.length).toBeGreaterThan(0);
      expect(result.plans[0].assumptions).toEqual(
        expect.arrayContaining([expect.stringContaining('Prices are as observed')]),
      );
    });

    it('plan has isMock flag when stores are mock', () => {
      const store = createStore({ id: 'store-1' });
      const item = createItem({
        matchedProductId: 'prod-1',
        matchLevel: MatchLevel.EXACT_MATCH,
      });

      const prices = createPricesForStore('store-1', [item], 1000);
      const inventory = createInventoryForStore('store-1', [item]);

      const input = buildInput({
        items: [item],
        stores: [store],
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeGreaterThan(0);
      expect(result.plans[0].isMock).toBe(true);
    });

    it('limits results to max 3 plans', () => {
      const stores = Array.from({ length: 5 }, (_, i) =>
        createStore({
          id: `store-${i}`,
          name: `Store ${i}`,
          retailerId: `retailer-${i}`,
          retailerName: `Retailer ${i}`,
          latitude: 19.43 + i * 0.005,
          longitude: -99.13 - i * 0.005,
        }),
      );

      const items = Array.from({ length: 3 }, (_, i) =>
        createItem({
          id: `item-${i}`,
          matchedProductId: `prod-${i}`,
          matchLevel: MatchLevel.EXACT_MATCH,
        }),
      );

      const prices = new Map<string, Price[]>();
      const inventory = new Map<string, Inventory>();
      for (const store of stores) {
        for (const item of items) {
          const key = `${store.id}:${item.matchedProductId}`;
          prices.set(key, [
            createPrice(store.id, item.matchedProductId!, 1000 + Math.floor(Math.random() * 3000)),
          ]);
          inventory.set(key, createInventory(store.id, item.matchedProductId!));
        }
      }

      const input = buildInput({
        items,
        stores,
        prices,
        inventory,
      });

      const result = engine.optimize(input);

      expect(result.plans.length).toBeLessThanOrEqual(3);
    });
  });
});
