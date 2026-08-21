/**
 * App Store - Global state management with Zustand.
 */

import { create } from 'zustand';
import {
  ShoppingItem,
  ShoppingItemProps,
  ItemPriority,
  MatchLevel,
} from '../domain/entities/ShoppingItem';
import { ShoppingList, ShoppingListStatus } from '../domain/entities/ShoppingList';
import { ShoppingPlan, OptimizationMode, PlanConfidence } from '../domain/entities/ShoppingPlan';
import {
  ShoppingMission,
  MissionStatus,
  MissionItemStatus,
} from '../domain/entities/ShoppingMission';
import { Store } from '../domain/entities/Store';
import { Price } from '../domain/entities/Price';
import { Promotion } from '../domain/entities/Promotion';
import { Inventory } from '../domain/entities/Inventory';
import { Money } from '../domain/valueObjects/Money';
import { Product } from '../domain/entities/Product';
import { OptimizationEngine, OptimizationInput } from '../optimization/OptimizationEngine';
import { MockRetailDataProvider } from '../infrastructure/providers/MockRetailDataProvider';
import { v4 as uuidv4 } from 'uuid';

// ─── Singleton Providers ───

const retailDataProvider = new MockRetailDataProvider();
const optimizationEngine = new OptimizationEngine();

// ─── Auth State ───

export interface User {
  id: string;
  email: string;
  name: string;
  location: { latitude: number; longitude: number } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setLocation: (location: { latitude: number; longitude: number }) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Mock authentication
      const user: User = {
        id: 'user_1',
        email,
        name: email.split('@')[0],
        location: { latitude: 19.4326, longitude: -99.1332 }, // CDMX default
      };
      set({ user, token: 'mock_token', isAuthenticated: true, isLoading: false });
    } catch (_error) {
      set({ error: 'Login failed', isLoading: false });
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const user: User = {
        id: uuidv4(),
        email,
        name,
        location: { latitude: 19.4326, longitude: -99.1332 },
      };
      set({ user, token: 'mock_token', isAuthenticated: true, isLoading: false });
    } catch (_error) {
      set({ error: 'Registration failed', isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User) => set({ user }),

  setLocation: (location: { latitude: number; longitude: number }) => {
    const user = get().user;
    if (user) {
      set({ user: { ...user, location } });
    }
  },
}));

// ─── Shopping List State ───

interface ListState {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  items: ShoppingItem[];
  isProcessing: boolean;
  rawInput: string;

  setRawInput: (input: string) => void;
  parseList: (rawInput: string) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: Partial<ShoppingItem>) => void;
  setCurrentList: (list: ShoppingList | null) => void;
  clearList: () => void;
}

export const useListStore = create<ListState>()((set, get) => ({
  lists: [],
  currentList: null,
  items: [],
  isProcessing: false,
  rawInput: '',

  setRawInput: (input: string) => set({ rawInput: input }),

  parseList: async (rawInput: string) => {
    set({ isProcessing: true });
    try {
      // Simple parser (will be enhanced with AI)
      const parsedItems = parseShoppingText(rawInput);
      const listId = uuidv4();

      // Match each item against the product catalog
      const catalog = retailDataProvider.getAllProducts();
      const matchedItems: ShoppingItem[] = [];

      for (const item of parsedItems) {
        const match = matchItemToProduct(item, catalog);
        if (match) {
          matchedItems.push(
            new ShoppingItem({
              ...item.toJSON(),
              matchedProductId: match.product.id,
              matchLevel: match.level,
              updatedAt: new Date(),
            }),
          );
        } else {
          matchedItems.push(item);
        }
      }

      const list: ShoppingList = new ShoppingList({
        id: listId,
        userId: 'user_1',
        title: rawInput.substring(0, 50) + (rawInput.length > 50 ? '...' : ''),
        rawInput,
        status: ShoppingListStatus.PARSED,
        itemCount: matchedItems.length,
        parsedItemCount: matchedItems.length,
        lastOptimizedAt: null,
        isRecurring: false,
        recurringInterval: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      set({
        currentList: list,
        items: matchedItems,
        isProcessing: false,
        lists: [...get().lists, list],
      });
    } catch (_error) {
      set({ isProcessing: false });
    }
  },

  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => {
    set({
      items: get().items.map((item) => {
        if (item.id === itemId) {
          const newProps = { ...item.toJSON(), ...updates } as ShoppingItemProps;
          return new ShoppingItem(newProps);
        }
        return item;
      }),
    });
  },

  removeItem: (itemId: string) => {
    set({ items: get().items.filter((item) => item.id !== itemId) });
  },

  addItem: (itemData: Partial<ShoppingItem>) => {
    const newItem = new ShoppingItem({
      id: uuidv4(),
      listId: get().currentList?.id ?? '',
      rawInput: '',
      normalizedName: null,
      category: null,
      brand: null,
      presentation: null,
      quantity: 1,
      unit: 'pieza',
      size: null,
      barcode: null,
      exactProductId: null,
      allowsSubstitution: true,
      brandRestrictions: [],
      substituteProductIds: [],
      priority: ItemPriority.PREFERRED,
      isRequired: false,
      notes: '',
      matchedProductId: null,
      matchLevel: MatchLevel.INCOMPATIBLE,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...itemData,
    } as ShoppingItemProps);
    set({ items: [...get().items, newItem] });
  },

  setCurrentList: (list: ShoppingList | null) => set({ currentList: list }),

  clearList: () => set({ items: [], currentList: null, rawInput: '' }),
}));

// ─── Optimization State ───

interface OptimizationState {
  plans: ShoppingPlan[];
  selectedPlan: ShoppingPlan | null;
  nearbyStores: Store[];
  storePrices: Map<string, Price[]>;
  storePromotions: Map<string, Promotion[]>;
  storeInventory: Map<string, Inventory>;
  isOptimizing: boolean;
  optimizationMode: OptimizationMode;
  maxStores: number;
  maxBudget: number | null;

  setOptimizationMode: (mode: OptimizationMode) => void;
  setMaxStores: (count: number) => void;
  setMaxBudget: (budget: number | null) => void;
  generatePlans: (listId: string) => Promise<void>;
  selectPlan: (plan: ShoppingPlan) => void;
  setNearbyStores: (stores: Store[]) => void;
}

export const useOptimizationStore = create<OptimizationState>()((set, get) => ({
  plans: [],
  selectedPlan: null,
  nearbyStores: [],
  storePrices: new Map(),
  storePromotions: new Map(),
  storeInventory: new Map(),
  isOptimizing: false,
  optimizationMode: OptimizationMode.BALANCED,
  maxStores: 3,
  maxBudget: null,

  setOptimizationMode: (mode: OptimizationMode) => set({ optimizationMode: mode }),
  setMaxStores: (count: number) => set({ maxStores: count }),
  setMaxBudget: (budget: number | null) => set({ maxBudget: budget }),

  generatePlans: async (listId: string) => {
    set({ isOptimizing: true });
    try {
      const state = get();
      const items = useListStore.getState().items;
      const userLocation = useAuthStore.getState().user?.location;

      if (items.length === 0 || !userLocation) {
        set({ isOptimizing: false });
        return;
      }

      // 1. Get nearby stores
      const stores = await retailDataProvider.getStoresNearby(
        userLocation.latitude,
        userLocation.longitude,
        50, // 50km radius
      );

      if (stores.length === 0) {
        set({ isOptimizing: false });
        return;
      }

      set({ nearbyStores: stores });

      // 2. Collect matched product IDs
      const matchedProductIds = items
        .filter((item) => item.matchedProductId !== null)
        .map((item) => item.matchedProductId as string);

      if (matchedProductIds.length === 0) {
        set({ isOptimizing: false });
        return;
      }

      // 3. Get prices for all matched products at each store
      const pricesMap = new Map<string, import('../domain/entities/Price').Price[]>();
      const promotionsMap = new Map<string, import('../domain/entities/Promotion').Promotion[]>();
      const inventoryMap = new Map<string, import('../domain/entities/Inventory').Inventory>();

      for (const store of stores) {
        // Get prices
        const storePrices = await retailDataProvider.getPrices(store.id, matchedProductIds);
        for (const price of storePrices) {
          const key = `${store.id}:${price.storeProductId.split(':')[1] ?? ''}`;
          const existing = pricesMap.get(key) ?? [];
          existing.push(price);
          pricesMap.set(key, existing);
        }

        // Get promotions
        const storePromotions = await retailDataProvider.getPromotions(store.id);
        promotionsMap.set(store.id, storePromotions);

        // Get inventory for each product
        for (const productId of matchedProductIds) {
          const storeProductKey = `${store.id}:${productId}`;
          const inventory = await retailDataProvider.getInventory(storeProductKey);
          if (inventory) {
            inventoryMap.set(storeProductKey, inventory);
          }
        }
      }

      // 4. Build optimization input
      const vehicle = useSettingsStore.getState().vehicle;
      const input: OptimizationInput = {
        listId,
        userId: 'user_1',
        items,
        stores,
        prices: pricesMap,
        promotions: promotionsMap,
        inventory: inventoryMap,
        userLocation,
        userPreferences: {
          maxWalkingDistanceKm: 1,
          preferredRetailerIds: [],
          avoidedRetailerIds: [],
          acceptedSubstitutionBrands: [],
          hasMembership: useSettingsStore.getState().hasMembership,
          hasCoupons: false,
          acceptedCardBrands: useSettingsStore.getState().acceptedCardBrands,
          vehicleFuelEfficiency: vehicle?.customEfficiency ?? null,
          valueOfTimePerHour: useSettingsStore.getState().valueOfTimePerHour,
        },
        constraints: {
          maxBudget: state.maxBudget ? Money.fromDecimal(state.maxBudget) : null,
          maxTimeMinutes: null,
          maxDistanceKm: null,
          maxStores: state.maxStores,
          maxDeviationKm: null,
          allowedStoreIds: [],
          excludedStoreIds: [],
          requiredProductIds: [],
        },
        mode: state.optimizationMode,
      };

      // 5. Run the optimization engine
      const result = optimizationEngine.optimize(input);

      // 6. Store results
      set({
        plans: result.plans,
        selectedPlan: result.plans.length > 0 ? result.plans[0] : null,
        isOptimizing: false,
      });
    } catch (_error) {
      set({ isOptimizing: false });
    }
  },

  selectPlan: (plan: ShoppingPlan) => set({ selectedPlan: plan }),
  setNearbyStores: (stores: Store[]) => set({ nearbyStores: stores }),
}));

// ─── Mission State ───

interface MissionState {
  currentMission: ShoppingMission | null;
  isStarted: boolean;

  startMission: (plan: ShoppingPlan) => void;
  markItem: (itemId: string, status: MissionItemStatus, price?: number) => void;
  completeMission: () => void;
  cancelMission: () => void;
}

export const useMissionStore = create<MissionState>()((set, get) => ({
  currentMission: null,
  isStarted: false,

  startMission: (plan: ShoppingPlan) => {
    const items = plan.storeStops.flatMap((stop) =>
      stop.items.map((item) => ({
        id: uuidv4(),
        missionId: 'mission_' + Date.now(),
        storeId: stop.storeId,
        productId: item.productId,
        productName: item.productName,
        expectedPrice: item.effectivePrice.toDecimal(),
        actualPrice: null,
        quantity: item.quantity,
        status: MissionItemStatus.PENDING,
        substitutionProductId: null,
        notes: '',
        foundAt: null,
      })),
    );

    const mission = new ShoppingMission({
      id: 'mission_' + Date.now(),
      planId: plan.id,
      userId: 'user_1',
      status: MissionStatus.NOT_STARTED,
      currentStopIndex: 0,
      startedAt: null,
      completedAt: null,
      items,
      totalSpent: null,
      totalSaved: null,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    set({ currentMission: mission, isStarted: false });
  },

  markItem: (itemId: string, status: MissionItemStatus, price?: number) => {
    const mission = get().currentMission;
    if (!mission) return;

    const updatedItems = mission.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            status,
            actualPrice: price ?? null,
            foundAt: status !== MissionItemStatus.PENDING ? new Date() : null,
          }
        : item,
    );

    set({
      currentMission: new ShoppingMission({
        ...mission.toJSON(),
        items: updatedItems,
        updatedAt: new Date(),
      }),
    });
  },

  completeMission: () => {
    const mission = get().currentMission;
    if (!mission) return;
    mission.complete();
    set({ currentMission: mission });
  },

  cancelMission: () => {
    const mission = get().currentMission;
    if (!mission) return;
    set({
      currentMission: new ShoppingMission({
        ...mission.toJSON(),
        status: MissionStatus.CANCELLED,
        updatedAt: new Date(),
      }),
    });
  },
}));

// ─── Settings State ───

interface SettingsState {
  vehicle: {
    make: string;
    model: string;
    year: number;
    fuelType: string;
    customEfficiency: number | null;
  } | null;
  valueOfTimePerHour: number | null;
  hasMembership: boolean;
  acceptedCardBrands: string[];

  setVehicle: (vehicle: SettingsState['vehicle']) => void;
  setValueOfTimePerHour: (value: number | null) => void;
  setHasMembership: (value: boolean) => void;
  setAcceptedCardBrands: (brands: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  vehicle: null,
  valueOfTimePerHour: null,
  hasMembership: false,
  acceptedCardBrands: [],

  setVehicle: (vehicle) => set({ vehicle }),
  setValueOfTimePerHour: (value) => set({ valueOfTimePerHour: value }),
  setHasMembership: (value) => set({ hasMembership: value }),
  setAcceptedCardBrands: (brands) => set({ acceptedCardBrands: brands }),
}));

// ─── Navigation State ───

interface NavigationState {
  currentScreen: string;
  screenHistory: string[];
  setScreen: (screen: string) => void;
  goBack: () => void;
}

export const useNavigationStore = create<NavigationState>()((set, get) => ({
  currentScreen: 'home',
  screenHistory: [],

  setScreen: (screen: string) => {
    set({
      currentScreen: screen,
      screenHistory: [...get().screenHistory, get().currentScreen],
    });
  },

  goBack: () => {
    const history = get().screenHistory;
    if (history.length > 0) {
      const previous = history[history.length - 1];
      set({
        currentScreen: previous,
        screenHistory: history.slice(0, -1),
      });
    }
  },
}));

// ─── Helper: Match Item to Catalog Product ───

function matchItemToProduct(
  item: ShoppingItem,
  catalog: Product[],
): { product: Product; level: MatchLevel } | null {
  const itemName = (item.normalizedName ?? item.rawInput).toLowerCase();
  const itemBrand = item.brand?.toLowerCase() ?? null;
  const itemCategory = item.category?.toLowerCase() ?? null;

  let bestMatch: { product: Product; score: number; level: MatchLevel } | null = null;

  for (const product of catalog) {
    let score = 0;
    const productName = product.canonicalName.toLowerCase();
    const productBrand = product.brand.toLowerCase();
    const productCategory = product.category.toLowerCase();

    // Exact canonical name match: highest score
    if (productName === itemName) {
      score += 100;
    } else if (productName.includes(itemName) || itemName.includes(productName)) {
      score += 60;
    } else if (itemName.split(' ').some((w) => w.length > 3 && productName.includes(w))) {
      score += 30;
    }

    // Brand match
    if (itemBrand && productBrand.toLowerCase() === itemBrand) {
      score += 30;
    } else if (itemBrand && productBrand.toLowerCase().includes(itemBrand)) {
      score += 15;
    }

    // Category match
    if (itemCategory && productCategory === itemCategory) {
      score += 10;
    }

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      let level: MatchLevel;
      if (score >= 100) {
        level = MatchLevel.EXACT_MATCH;
      } else if (score >= 80) {
        level = MatchLevel.PRODUCT_VARIANT_MATCH;
      } else if (score >= 50) {
        level = MatchLevel.ACCEPTABLE_SUBSTITUTE;
      } else if (score >= 25) {
        level = MatchLevel.POSSIBLE_SUBSTITUTE;
      } else {
        level = MatchLevel.INCOMPATIBLE;
      }
      bestMatch = { product, score, level };
    }
  }

  if (!bestMatch || bestMatch.level === MatchLevel.INCOMPATIBLE) {
    return null;
  }

  return { product: bestMatch.product, level: bestMatch.level };
}

// ─── Helper: Parse Shopping Text ───

function parseShoppingText(rawText: string): ShoppingItem[] {
  const lines = rawText
    .split(/[,;\n]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const parsed = parseSingleItem(line);
    return new ShoppingItem({
      id: uuidv4(),
      listId: '',
      rawInput: line,
      normalizedName: parsed.name,
      category: parsed.category,
      brand: parsed.brand,
      presentation: parsed.presentation,
      quantity: parsed.quantity,
      unit: parsed.unit,
      size: parsed.size,
      barcode: null,
      exactProductId: null,
      allowsSubstitution: true,
      brandRestrictions: parsed.brand ? [parsed.brand] : [],
      substituteProductIds: [],
      priority: ItemPriority.PREFERRED,
      isRequired: true,
      notes: '',
      matchedProductId: null,
      matchLevel: MatchLevel.INCOMPATIBLE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
}

function parseSingleItem(text: string): {
  name: string;
  quantity: number;
  unit: string;
  brand: string | null;
  presentation: string | null;
  size: string | null;
  category: string | null;
} {
  let quantity = 1;
  let unit = 'pieza';
  let brand: string | null = null;
  let size: string | null = null;

  // Common brands in Mexico
  const knownBrands = [
    'Lala',
    'Bimbo',
    'Coca-Cola',
    'Ariel',
    'Sabritas',
    "Kellogg's",
    'Pantene',
    'Regio',
    'Fabuloso',
    'Montalvo',
    'Bachoco',
    'Kuik',
    'Ciel',
    'Pepsi',
    'Herdez',
    'Nestlé',
    'La Costeña',
    'Valentina',
    'Bonafina',
    'Santa Clara',
    'Alpura',
  ];

  // Extract quantity patterns
  const quantityPatterns = [
    /(\d+(?:\.\d+)?)\s*(litros?|lt|l|ml|kilos?|kg|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?)/i,
    /^(\d+)\s+(.+)$/,
  ];

  for (const pattern of quantityPatterns) {
    const match = text.match(pattern);
    if (match) {
      quantity = parseFloat(match[1]);
      const unitStr = match[2].toLowerCase();

      // Normalize unit
      if (unitStr.startsWith('lit') || unitStr === 'lt' || unitStr === 'l') {
        unit = 'litro';
      } else if (unitStr.startsWith('ml')) {
        unit = 'mililitro';
      } else if (unitStr.startsWith('kilo') || unitStr === 'kg') {
        unit = 'kilogramo';
      } else if (unitStr.startsWith('gram') || unitStr === 'g') {
        unit = 'gramo';
      } else if (unitStr.startsWith('pieza') || unitStr === 'pzs' || unitStr === 'pzas') {
        unit = 'pieza';
      } else if (unitStr.startsWith('rollo')) {
        unit = 'rollo';
        size = `${quantity} rollos`;
      } else if (unitStr.startsWith('paquete') || unitStr.startsWith('pck')) {
        unit = 'paquete';
      } else if (unitStr.startsWith('lata')) {
        unit = 'lata';
      } else {
        unit = unitStr;
      }
      break;
    }
  }

  // Extract brand
  for (const b of knownBrands) {
    if (text.toLowerCase().includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }

  // Clean name
  const name = text
    .replace(
      /\d+(?:\.\d+)?\s*(litros?|lt|l|ml|kilos?|kg|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?)/gi,
      '',
    )
    .replace(/^de\s+/i, '')
    .trim();

  // Detect category
  let category: string | null = null;
  const categoryKeywords: Record<string, string[]> = {
    Dairy: ['leche', 'yogurt', 'queso', 'crema', 'huevos', 'mantequilla'],
    Meat: ['pollo', 'carne', 'res', 'cerdo', 'pechuga', 'costilla'],
    Grains: ['arroz', 'pasta', 'frijol', 'avena', 'trigo'],
    Bakery: ['pan', 'tortilla', 'bolillo'],
    Beverages: ['agua', 'jugo', 'refresco', 'cerveza', 'café', 'té'],
    Cleaning: ['detergente', 'jabón', 'fabuloso', 'cloro', 'papel', 'servilleta'],
    PersonalCare: ['shampoo', 'jabón', 'crema', 'pasta', 'cepillo'],
    Snacks: ['papas', 'galletas', 'chocolate', 'candy'],
    Fruits: ['manzana', 'plátano', 'naranja', 'limón', 'jitomate', 'cebolla'],
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => text.toLowerCase().includes(kw))) {
      category = cat;
      break;
    }
  }

  return {
    name: name || text,
    quantity,
    unit,
    brand,
    presentation: size,
    size,
    category,
  };
}

// ─── Helper: Create Mock Plan ───

function createMockPlan(
  items: ShoppingItem[],
  stores: Store[],
  mode: OptimizationMode,
): ShoppingPlan {
  const store = stores[0];
  const totalProductCost = Money.fromDecimal(items.length * 45); // $45 average per item
  const transportCost = Money.fromDecimal(15);
  const effectiveCost = totalProductCost.add(transportCost);
  const baselineCost = Money.fromDecimal(items.length * 55);

  return new ShoppingPlan({
    id: 'plan_' + Date.now(),
    userId: 'user_1',
    listId: '',
    mode,
    totalProductCost,
    totalTransportCost: transportCost,
    totalTimeMinutes: 25,
    totalDistanceKm: 5.2,
    effectiveTotalCost: effectiveCost,
    estimatedSavings: baselineCost.difference(effectiveCost),
    baselineCost,
    baselineDescription: 'Estimated cost at most expensive store without promotions',
    confidence: PlanConfidence.MEDIUM,
    storeStops: [
      {
        storeId: store.id,
        storeName: store.name,
        retailerName: store.retailerName,
        address: store.getFullAddress(),
        latitude: store.latitude,
        longitude: store.longitude,
        productCost: totalProductCost,
        transportCost,
        items: items.map((item) => ({
          shoppingItemId: item.id,
          productId: 'prod_' + Date.now(),
          productName: item.normalizedName ?? item.rawInput,
          brand: item.brand ?? '',
          quantity: item.quantity,
          unit: item.unit,
          originalPrice: Money.fromDecimal(50),
          effectivePrice: Money.fromDecimal(45),
          savings: Money.fromDecimal(5),
          matchLevel: item.matchLevel,
          isSubstitution: false,
          substituteForProductId: null,
        })),
        promotions: [],
      },
    ],
    route: [
      {
        order: 0,
        type: 'HOME',
        storeId: null,
        storeName: null,
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Home',
        estimatedArrivalMinutes: 0,
        distanceFromPreviousKm: 0,
      },
      {
        order: 1,
        type: 'STORE',
        storeId: store.id,
        storeName: store.name,
        latitude: store.latitude,
        longitude: store.longitude,
        address: store.getFullAddress(),
        estimatedArrivalMinutes: 15,
        distanceFromPreviousKm: 2.6,
      },
    ],
    assumptions: ['Prices are as observed and may vary.', 'Travel times are estimates.'],
    warnings: items.some((i) => !i.hasMatch())
      ? ['Some items could not be matched to our catalog.']
      : [],
    explanations: [
      {
        category: 'CHOICE',
        text: `We recommend ${store.retailerName} because all your items are available there.`,
        details: null,
      },
    ],
    isMock: true,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
}
