/**
 * App Store - Global state management with Zustand.
 *
 * Connects to the real backend API with offline fallback to local mock data.
 * Auth, lists, missions, vehicles, and preferences are persisted via backend.
 * Optimization can run server-side or fall back to local engine.
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
import { Money } from '../domain/valueObjects/Money';
import { OptimizationEngine, OptimizationInput } from '../optimization/OptimizationEngine';
import { MockRetailDataProvider } from '../infrastructure/providers/MockRetailDataProvider';
import {
  authApi,
  listsApi,
  optimizeApi,
  missionsApi,
  vehiclesApi,
  preferencesApi,
  tokenStore,
  ApiError,
  type BackendParseResult,
  type BackendPlanResult,
  type BackendMission,
  type BackendMissionItem,
  type BackendVehicle,
  type BackendPreferences,
  type StoredUser,
} from '../infrastructure/api/apiClient';
import { v4 as uuidv4 } from 'uuid';

// ─── Singleton Providers ───

const retailDataProvider = new MockRetailDataProvider();
const optimizationEngine = new OptimizationEngine();

// ─── Constants ───

const CDMX_DEFAULT_LOCATION = { latitude: 19.4326, longitude: -99.1332 } as const;

// ─── Helper: Map BackendParseResult items to ShoppingItem entities ───

function mapBackendItemsToList(
  backendItems: BackendParseResult['items'],
  listId: string,
): ShoppingItem[] {
  return backendItems.map(
    (item) =>
      new ShoppingItem({
        id: item.id,
        listId: item.listId,
        rawInput: item.rawInput,
        normalizedName: item.normalizedName,
        category: item.category,
        brand: item.brand,
        presentation: item.presentation,
        quantity: item.quantity,
        unit: item.unit,
        size: item.size,
        barcode: item.barcode,
        exactProductId: item.exactProductId,
        allowsSubstitution: item.allowsSubstitution,
        brandRestrictions: item.brandRestrictions,
        substituteProductIds: item.substituteProductIds,
        priority: (item.priority as ItemPriority) || ItemPriority.PREFERRED,
        isRequired: item.isRequired,
        notes: item.notes,
        matchedProductId: item.matchedProductId,
        matchLevel: (item.matchLevel as MatchLevel) || MatchLevel.INCOMPATIBLE,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }),
  );
}

// ─── Helper: Map BackendPlanResult to ShoppingPlan entity ───

function mapBackendPlanToEntity(result: BackendPlanResult, listId: string): ShoppingPlan {
  return new ShoppingPlan({
    id: result.planId,
    userId: '',
    listId,
    mode: OptimizationMode.BALANCED,
    totalProductCost: Money.fromCents(result.summary.totalProductCostCents),
    totalTransportCost: Money.fromCents(result.summary.totalTransportCostCents),
    totalTimeMinutes: result.summary.estimatedTimeMinutes,
    totalDistanceKm: result.summary.totalDistanceKm,
    effectiveTotalCost: Money.fromCents(result.summary.effectiveCostCents),
    estimatedSavings:
      result.summary.savingsCents > 0 ? Money.fromCents(result.summary.savingsCents) : null,
    baselineCost:
      result.summary.baselineCents > 0 ? Money.fromCents(result.summary.baselineCents) : null,
    baselineDescription: null,
    confidence: (result.summary.confidence as PlanConfidence) || PlanConfidence.MEDIUM,
    storeStops: result.stores.map((store) => ({
      storeId: store.storeId,
      storeName: store.storeName,
      retailerName: store.retailerName,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      productCost: Money.fromCents(store.productCostCents),
      transportCost: Money.fromCents(store.transportCostCents),
      items: store.items.map((item) => ({
        shoppingItemId: item.itemId,
        productId: item.itemId,
        productName: item.name,
        brand: '',
        quantity: item.quantity,
        unit: item.unit,
        originalPrice: Money.fromCents(item.unitPriceCents),
        effectivePrice: Money.fromCents(item.lineTotalCents),
        savings: Money.zero(),
        matchLevel: MatchLevel.EXACT_MATCH,
        isSubstitution: false,
        substituteForProductId: null,
      })),
      promotions: store.promos.map((promo) => ({
        promotionId: promo,
        name: promo,
        type: 'DISCOUNT',
        savings: Money.zero(),
        requiredMembership: false,
        requiredCard: false,
      })),
    })),
    route: [
      {
        order: 0,
        type: 'HOME' as const,
        storeId: null,
        storeName: null,
        latitude: CDMX_DEFAULT_LOCATION.latitude,
        longitude: CDMX_DEFAULT_LOCATION.longitude,
        address: 'Home',
        estimatedArrivalMinutes: 0,
        distanceFromPreviousKm: 0,
      },
      ...result.stores.map((store, i) => ({
        order: i + 1,
        type: 'STORE' as const,
        storeId: store.storeId,
        storeName: store.storeName,
        latitude: store.latitude,
        longitude: store.longitude,
        address: store.address,
        estimatedArrivalMinutes: Math.round(store.distanceKm * 3),
        distanceFromPreviousKm: store.distanceKm,
      })),
    ],
    assumptions: ['Prices from backend. May vary.'],
    warnings: result.warnings,
    explanations: [
      {
        category: 'CHOICE' as const,
        text: `Optimized across ${result.summary.storesCount} store(s).`,
        details: null,
      },
    ],
    isMock: result.isMock,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
}

// ─── Helper: Map BackendMission to ShoppingMission entity ───

function mapBackendMissionToEntity(m: BackendMission): ShoppingMission {
  return new ShoppingMission({
    id: m.id,
    planId: m.planId,
    userId: m.userId,
    status: (m.status as MissionStatus) || MissionStatus.NOT_STARTED,
    currentStopIndex: m.currentStopIndex,
    startedAt: m.startedAt ? new Date(m.startedAt) : null,
    completedAt: m.completedAt ? new Date(m.completedAt) : null,
    items: m.items.map(
      (item: BackendMissionItem) =>
        ({
          id: item.id,
          missionId: item.missionId,
          storeId: item.storeId,
          productId: item.productId ?? '',
          productName: item.productName,
          expectedPrice: item.expectedPriceCents,
          actualPrice: item.actualPriceCents,
          quantity: item.quantity,
          status: (item.status as MissionItemStatus) || MissionItemStatus.PENDING,
          substitutionProductId: item.substitutionProductId,
          notes: item.notes,
          foundAt: item.foundAt ? new Date(item.foundAt) : null,
        }) as any, // MissionItem interface needs Date types but backend sends strings
    ),
    totalSpent: m.totalSpentCents,
    totalSaved: m.totalSavedCents,
    notes: m.notes,
    createdAt: new Date(m.createdAt),
    updatedAt: new Date(m.updatedAt),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH STORE
// ═══════════════════════════════════════════════════════════════════════

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
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setLocation: (location: { latitude: number; longitude: number }) => void;
  restoreSession: () => Promise<void>;
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
      const response = await authApi.login(email, password);

      // Persist tokens
      await tokenStore.setToken(response.token);
      await tokenStore.setRefreshToken(response.refreshToken);
      await tokenStore.setUser(response.user);

      set({
        user: {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          location: CDMX_DEFAULT_LOCATION,
        },
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Load preferences after login
      useSettingsStore.getState().loadFromBackend();
    } catch (err) {
      if (err instanceof ApiError) {
        // Offline fallback: create local user
        const localUser: User = {
          id: 'local_' + Date.now(),
          email,
          name: email.split('@')[0],
          location: CDMX_DEFAULT_LOCATION,
        };
        await tokenStore.setUser({ id: localUser.id, email, name: localUser.name });
        set({
          user: localUser,
          token: 'local_offline_token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({ error: 'Error de conexion', isLoading: false });
      }
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(email, password, name);

      await tokenStore.setToken(response.token);
      await tokenStore.setRefreshToken(response.refreshToken);
      await tokenStore.setUser(response.user);

      set({
        user: {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          location: CDMX_DEFAULT_LOCATION,
        },
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      useSettingsStore.getState().loadFromBackend();
    } catch (err) {
      if (err instanceof ApiError) {
        // Offline fallback
        const localUser: User = {
          id: 'local_' + Date.now(),
          email,
          name,
          location: CDMX_DEFAULT_LOCATION,
        };
        await tokenStore.setUser({ id: localUser.id, email, name });
        set({
          user: localUser,
          token: 'local_offline_token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({ error: 'Error de conexion', isLoading: false });
      }
    }
  },

  logout: async () => {
    await tokenStore.clearAll();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
    // Reset other stores
    useListStore.getState().clearList();
    useMissionStore.setState({ currentMission: null, isStarted: false });
    useSettingsStore.setState({
      vehicle: null,
      vehicles: [],
      valueOfTimePerHour: null,
      hasMembership: false,
      acceptedCardBrands: [],
    });
  },

  setUser: (user: User) => set({ user }),

  setLocation: (location: { latitude: number; longitude: number }) => {
    const user = get().user;
    if (user) {
      set({ user: { ...user, location } });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const storedUser = await tokenStore.getUser();
      const token = await tokenStore.getToken();

      if (storedUser && token) {
        // Try to refresh token with backend
        try {
          const freshUser = await authApi.me();
          set({
            user: {
              id: freshUser.id,
              email: freshUser.email,
              name: freshUser.name,
              location: CDMX_DEFAULT_LOCATION,
            },
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Load preferences
          useSettingsStore.getState().loadFromBackend();
        } catch {
          // Backend unreachable, use stored credentials
          set({
            user: {
              id: storedUser.id,
              email: storedUser.email,
              name: storedUser.name,
              location: CDMX_DEFAULT_LOCATION,
            },
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

// ═══════════════════════════════════════════════════════════════════════
// SHOPPING LIST STORE
// ═══════════════════════════════════════════════════════════════════════

interface ListState {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  items: ShoppingItem[];
  isProcessing: boolean;
  rawInput: string;

  setRawInput: (input: string) => void;
  parseList: (rawInput: string) => Promise<void>;
  loadLists: () => Promise<void>;
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
      // Try backend first
      try {
        const title =
          rawInput.substring(0, 50) + (rawInput.length > 50 ? '...' : '');
        const list = await listsApi.create(title, rawInput);
        const result = await listsApi.parse(list.id);

        const items = mapBackendItemsToList(result.items, list.id);
        const shoppingList = new ShoppingList({
          id: result.list.id,
          userId: result.list.userId,
          title: result.list.title,
          rawInput: result.list.rawInput,
          status: result.list.status as ShoppingListStatus,
          itemCount: result.list.itemCount,
          parsedItemCount: result.list.parsedItemCount,
          lastOptimizedAt: null,
          isRecurring: result.list.isRecurring,
          recurringInterval: result.list.recurringInterval,
          createdAt: new Date(result.list.createdAt),
          updatedAt: new Date(result.list.updatedAt),
        });

        set({
          currentList: shoppingList,
          items,
          isProcessing: false,
          lists: [...get().lists, shoppingList],
        });
        return;
      } catch (_backendErr) {
        // Fall through to local parsing
      }

      // Offline fallback: local parser
      const parsedItems = parseShoppingText(rawInput);
      const listId = uuidv4();
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
        userId: get()?.toString() ?? 'local',
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

  loadLists: async () => {
    try {
      const backendLists = await listsApi.getAll();
      const mapped = backendLists.map(
        (l) =>
          new ShoppingList({
            id: l.id,
            userId: l.userId,
            title: l.title,
            rawInput: l.rawInput,
            status: l.status as ShoppingListStatus,
            itemCount: l.itemCount,
            parsedItemCount: l.parsedItemCount,
            lastOptimizedAt: null,
            isRecurring: l.isRecurring,
            recurringInterval: l.recurringInterval,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          }),
      );
      set({ lists: mapped });
    } catch {
      // Backend unreachable — keep local lists
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

// ═══════════════════════════════════════════════════════════════════════
// OPTIMIZATION STORE
// ═══════════════════════════════════════════════════════════════════════

interface OptimizationState {
  plans: ShoppingPlan[];
  selectedPlan: ShoppingPlan | null;
  nearbyStores: Store[];
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

      // Try backend optimization first
      try {
        const result = await optimizeApi.run(listId, state.optimizationMode, userLocation);
        const plan = mapBackendPlanToEntity(result, listId);
        set({
          plans: [plan],
          selectedPlan: plan,
          isOptimizing: false,
        });
        return;
      } catch (_backendErr) {
        // Fall through to local optimization
      }

      // Offline fallback: local optimization engine
      const stores = await retailDataProvider.getStoresNearby(
        userLocation.latitude,
        userLocation.longitude,
        50,
      );

      if (stores.length === 0) {
        set({ isOptimizing: false });
        return;
      }

      set({ nearbyStores: stores });

      const matchedProductIds = items
        .filter((item) => item.matchedProductId !== null)
        .map((item) => item.matchedProductId as string);

      if (matchedProductIds.length === 0) {
        set({ isOptimizing: false });
        return;
      }

      const pricesMap = new Map<string, import('../domain/entities/Price').Price[]>();
      const promotionsMap = new Map<string, import('../domain/entities/Promotion').Promotion[]>();
      const inventoryMap = new Map<string, import('../domain/entities/Inventory').Inventory>();

      for (const store of stores) {
        const storePrices = await retailDataProvider.getPrices(store.id, matchedProductIds);
        for (const price of storePrices) {
          const key = `${store.id}:${price.storeProductId.split(':')[1] ?? ''}`;
          const existing = pricesMap.get(key) ?? [];
          existing.push(price);
          pricesMap.set(key, existing);
        }

        const storePromotions = await retailDataProvider.getPromotions(store.id);
        promotionsMap.set(store.id, storePromotions);

        for (const productId of matchedProductIds) {
          const storeProductKey = `${store.id}:${productId}`;
          const inventory = await retailDataProvider.getInventory(storeProductKey);
          if (inventory) {
            inventoryMap.set(storeProductKey, inventory);
          }
        }
      }

      const vehicle = useSettingsStore.getState().vehicle;
      const input: OptimizationInput = {
        listId,
        userId: useAuthStore.getState().user?.id ?? '',
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

      const result = optimizationEngine.optimize(input);

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

// ═══════════════════════════════════════════════════════════════════════
// MISSION STATE
// ═══════════════════════════════════════════════════════════════════════

interface MissionState {
  currentMission: ShoppingMission | null;
  isStarted: boolean;

  startMission: (plan: ShoppingPlan) => Promise<void>;
  markItem: (itemId: string, status: MissionItemStatus, price?: number) => Promise<void>;
  completeMission: () => Promise<void>;
  cancelMission: () => void;
}

export const useMissionStore = create<MissionState>()((set, get) => ({
  currentMission: null,
  isStarted: false,

  startMission: async (plan: ShoppingPlan) => {
    const listId = plan.listId;
    const planId = plan.id;

    try {
      // Create mission on backend
      const backendMission = await missionsApi.create(planId, listId);
      const mission = mapBackendMissionToEntity(backendMission);
      set({ currentMission: mission, isStarted: false });
      return;
    } catch (_err) {
      // Offline fallback: create locally
    }

    // Local fallback
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
      userId: useAuthStore.getState().user?.id ?? '',
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

  markItem: async (itemId: string, status: MissionItemStatus, price?: number) => {
    const mission = get().currentMission;
    if (!mission) return;

    // Try backend first
    try {
      const result = await missionsApi.updateItem(
        mission.id,
        itemId,
        status,
        price ? Math.round(price * 100) : undefined,
      );
      const updatedMission = mapBackendMissionToEntity(result.mission);
      set({ currentMission: updatedMission });
      return;
    } catch (_err) {
      // Fall through to local update
    }

    // Local fallback
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

  completeMission: async () => {
    const mission = get().currentMission;
    if (!mission) return;

    // Try backend first
    try {
      await missionsApi.complete(mission.id);
    } catch {
      // Offline: complete locally
    }

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

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS STORE
// ═══════════════════════════════════════════════════════════════════════

interface VehicleData {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
  customEfficiency: number | null;
  isDefault: boolean;
}

interface SettingsState {
  vehicle: VehicleData | null;
  vehicles: VehicleData[];
  valueOfTimePerHour: number | null;
  hasMembership: boolean;
  acceptedCardBrands: string[];
  optimizationMode: OptimizationMode;
  maxBudget: number | null;
  maxStores: number;

  setVehicle: (vehicle: VehicleData | null) => void;
  setValueOfTimePerHour: (value: number | null) => void;
  setHasMembership: (value: boolean) => void;
  setAcceptedCardBrands: (brands: string[]) => void;
  loadFromBackend: () => Promise<void>;
  syncVehicle: (data: Omit<VehicleData, 'id' | 'isDefault'>) => Promise<void>;
  loadVehicles: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  vehicle: null,
  vehicles: [],
  valueOfTimePerHour: null,
  hasMembership: false,
  acceptedCardBrands: [],
  optimizationMode: OptimizationMode.BALANCED,
  maxBudget: null,
  maxStores: 3,

  setVehicle: (vehicle) => set({ vehicle }),
  setValueOfTimePerHour: (value) => set({ valueOfTimePerHour: value }),
  setHasMembership: (value) => set({ hasMembership: value }),
  setAcceptedCardBrands: (brands) => set({ acceptedCardBrands: brands }),

  loadFromBackend: async () => {
    try {
      const prefs = await preferencesApi.get();
      set({
        optimizationMode: (prefs.optimizationMode as OptimizationMode) || OptimizationMode.BALANCED,
        maxBudget: prefs.maxBudgetCents ? prefs.maxBudgetCents / 100 : null,
        maxStores: prefs.maxStores,
        hasMembership: prefs.hasMembership,
        acceptedCardBrands: prefs.acceptedCardBrands,
        valueOfTimePerHour: prefs.valueOfTimePerHour,
      });

      // Also load vehicles
      await get().loadVehicles();
    } catch {
      // Backend unreachable — keep local settings
    }
  },

  loadVehicles: async () => {
    try {
      const backendVehicles = await vehiclesApi.getAll();
      const mapped: VehicleData[] = backendVehicles.map((v) => ({
        id: v.id,
        name: v.name,
        make: v.make ?? '',
        model: v.model ?? '',
        year: v.year ?? 0,
        fuelType: v.fuelType,
        customEfficiency: v.customEfficiencyKmPerLiter,
        isDefault: v.isDefault,
      }));
      set({
        vehicles: mapped,
        vehicle: mapped.find((v) => v.isDefault) ?? mapped[0] ?? null,
      });
    } catch {
      // Backend unreachable
    }
  },

  syncVehicle: async (data) => {
    try {
      // Try to save to backend
      const backend = await vehiclesApi.create({
        name: data.name,
        fuelType: data.fuelType,
        make: data.make || undefined,
        model: data.model || undefined,
        year: data.year || undefined,
      });
      const newVehicle: VehicleData = {
        id: backend.id,
        name: backend.name,
        make: backend.make ?? '',
        model: backend.model ?? '',
        year: backend.year ?? 0,
        fuelType: backend.fuelType,
        customEfficiency: backend.customEfficiencyKmPerLiter,
        isDefault: backend.isDefault,
      };
      set({ vehicle: newVehicle });
      await get().loadVehicles();
    } catch {
      // Offline: keep locally
      set({ vehicle: { id: 'local_' + Date.now(), ...data, isDefault: true } });
    }
  },
}));

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION STATE
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
// LOCAL HELPER: Match Item to Catalog Product (for offline fallback)
// ═══════════════════════════════════════════════════════════════════════

function matchItemToProduct(
  item: ShoppingItem,
  catalog: import('../domain/entities/Product').Product[],
): { product: import('../domain/entities/Product').Product; level: MatchLevel } | null {
  const itemName = (item.normalizedName ?? item.rawInput).toLowerCase();
  const itemBrand = item.brand?.toLowerCase() ?? null;
  const itemCategory = item.category?.toLowerCase() ?? null;

  let bestMatch: { product: import('../domain/entities/Product').Product; score: number; level: MatchLevel } | null = null;

  for (const product of catalog) {
    let score = 0;
    const productName = product.canonicalName.toLowerCase();
    const productBrand = product.brand.toLowerCase();
    const productCategory = product.category.toLowerCase();

    if (productName === itemName) {
      score += 100;
    } else if (productName.includes(itemName) || itemName.includes(productName)) {
      score += 60;
    } else if (itemName.split(' ').some((w) => w.length > 3 && productName.includes(w))) {
      score += 30;
    }

    if (itemBrand && productBrand.toLowerCase() === itemBrand) {
      score += 30;
    } else if (itemBrand && productBrand.toLowerCase().includes(itemBrand)) {
      score += 15;
    }

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

// ═══════════════════════════════════════════════════════════════════════
// LOCAL HELPER: Parse Shopping Text (for offline fallback)
// ═══════════════════════════════════════════════════════════════════════

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
    'Nestle',
    'La Costena',
    'Valentina',
    'Bonafina',
    'Santa Clara',
    'Alpura',
  ];

  const quantityPatterns = [
    /(\d+(?:\.\d+)?)\s*(litros?|lt|l|ml|kilos?|kg|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?)/i,
    /^(\d+)\s+(.+)$/,
  ];

  for (const pattern of quantityPatterns) {
    const match = text.match(pattern);
    if (match) {
      quantity = parseFloat(match[1]);
      const unitStr = match[2].toLowerCase();

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

  for (const b of knownBrands) {
    if (text.toLowerCase().includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }

  const name = text
    .replace(
      /\d+(?:\.\d+)?\s*(litros?|lt|l|ml|kilos?|kg|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?)/gi,
      '',
    )
    .replace(/^de\s+/i, '')
    .trim();

  let category: string | null = null;
  const categoryKeywords: Record<string, string[]> = {
    Dairy: ['leche', 'yogurt', 'queso', 'crema', 'huevos', 'mantequilla'],
    Meat: ['pollo', 'carne', 'res', 'cerdo', 'pechuga', 'costilla'],
    Grains: ['arroz', 'pasta', 'frijol', 'avena', 'trigo'],
    Bakery: ['pan', 'tortilla', 'bolillo'],
    Beverages: ['agua', 'jugo', 'refresco', 'cerveza', 'cafe', 'te'],
    Cleaning: ['detergente', 'jabon', 'fabuloso', 'cloro', 'papel', 'servilleta'],
    PersonalCare: ['shampoo', 'jabon', 'crema', 'pasta', 'cepillo'],
    Snacks: ['papas', 'galletas', 'chocolate', 'candy'],
    Fruits: ['manzana', 'platano', 'naranja', 'limon', 'jitomate', 'cebolla'],
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
