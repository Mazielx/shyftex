/**
 * useOptimization hook.
 *
 * Wraps the full optimization flow into a single React hook:
 *   parse list -> optimize (backend first, local fallback) -> results
 *
 * Backend-first approach with offline fallback to local optimization engine.
 */

import { useState, useCallback } from 'react';
import {
  useListStore,
  useOptimizationStore,
  useAuthStore,
  useSettingsStore,
} from '../stores/AppStore';
import { OptimizationEngine, OptimizationInput } from '../optimization/OptimizationEngine';
import { MockRetailDataProvider } from '../infrastructure/providers/MockRetailDataProvider';
import { ShoppingItem } from '../domain/entities/ShoppingItem';
import { ShoppingPlan } from '../domain/entities/ShoppingPlan';
import { Money } from '../domain/valueObjects/Money';
import { optimizeApi, ApiError } from '../infrastructure/api/apiClient';
import { toShoppingPlan } from '../infrastructure/api/planAdapter';

const retailDataProvider = new MockRetailDataProvider();
const optimizationEngine = new OptimizationEngine();

// ─── Helpers imported from AppStore (local fallback) ───
// These are duplicated here to keep the hook self-contained for local optimization.
// In production, the backend /optimize endpoint replaces all of this.

export interface OptimizationState {
  isLoading: boolean;
  error: string | null;
  plans: ShoppingPlan[];
  selectedPlan: ShoppingPlan | null;
}

export interface UseOptimizationReturn extends OptimizationState {
  /** Run the full optimization flow from raw text input. */
  runOptimization: (rawInput: string) => Promise<void>;
  /** Select a specific plan from the results. */
  selectPlan: (plan: ShoppingPlan) => void;
  /** Reset state. */
  reset: () => void;
}

const INITIAL_STATE: OptimizationState = {
  isLoading: false,
  error: null,
  plans: [],
  selectedPlan: null,
};

export function useOptimization(): UseOptimizationReturn {
  const [state, setState] = useState<OptimizationState>(INITIAL_STATE);

  const { parseList } = useListStore();
  const { optimizationMode, maxStores, maxBudget, setNearbyStores } = useOptimizationStore();

  const runOptimization = useCallback(
    async (rawInput: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // 1. Parse the raw shopping list (this also matches products, tries backend first)
        await parseList(rawInput);

        // Read the updated items from the store (parseList updates them)
        const currentItems = useListStore.getState().items;
        const currentList = useListStore.getState().currentList;

        if (currentItems.length === 0) {
          setState({
            isLoading: false,
            error: 'No items found in the input.',
            plans: [],
            selectedPlan: null,
          });
          return;
        }

        // 2. Get user location
        const userLocation = useAuthStore.getState().user?.location;
        if (!userLocation) {
          setState({
            isLoading: false,
            error: 'User location is required for optimization.',
            plans: [],
            selectedPlan: null,
          });
          return;
        }

        // 3. Try backend optimization first
        if (currentList) {
          try {
            const result = await optimizeApi.run(
              currentList.id,
              optimizationMode,
              userLocation,
            );

            // Normalize the backend's pesos-based payload (estimatedPrice /
            // storeName) into the integer cents contract the domain expects.
            const plan = toShoppingPlan(result, {
              listId: currentList.id,
              mode: optimizationMode,
              userLocation,
            });

            useOptimizationStore.setState({
              plans: [plan],
              selectedPlan: plan,
            });

            setState({
              isLoading: false,
              error: null,
              plans: [plan],
              selectedPlan: plan,
            });
            return;
          } catch (backendErr) {
            if (backendErr instanceof ApiError && backendErr.code === 'NETWORK_ERROR') {
              // Backend unreachable — fall through to local optimization
            } else {
              // Backend returned a real error (e.g., list not found)
              // Fall through to local optimization as well
            }
          }
        }

        // 4. Offline fallback: local optimization engine
        const stores = await retailDataProvider.getStoresNearby(
          userLocation.latitude,
          userLocation.longitude,
          50,
        );

        if (stores.length === 0) {
          setState({
            isLoading: false,
            error: 'No stores found near your location.',
            plans: [],
            selectedPlan: null,
          });
          return;
        }

        setNearbyStores(stores);

        // 5. Collect matched product IDs
        const matchedProductIds = currentItems
          .filter((item: ShoppingItem) => item.matchedProductId !== null)
          .map((item: ShoppingItem) => item.matchedProductId as string);

        if (matchedProductIds.length === 0) {
          setState({
            isLoading: false,
            error: 'None of your items could be matched to our product catalog.',
            plans: [],
            selectedPlan: null,
          });
          return;
        }

        // 6. Fetch prices, promotions, and inventory for each store
        const pricesMap = new Map<string, import('../domain/entities/Price').Price[]>();
        const promotionsMap = new Map<string, import('../domain/entities/Promotion').Promotion[]>();
        const inventoryMap = new Map<string, import('../domain/entities/Inventory').Inventory>();

        for (const store of stores) {
          const storePrices = await retailDataProvider.getPrices(store.id, matchedProductIds);
          for (const price of storePrices) {
            const productId = price.storeProductId.split(':')[1] ?? '';
            const key = `${store.id}:${productId}`;
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

        // 7. Build optimization input
        const vehicle = useSettingsStore.getState().vehicle;
        const input: OptimizationInput = {
          listId: currentList?.id ?? '',
          userId: useAuthStore.getState().user?.id ?? '',
          items: currentItems,
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
            maxBudget: maxBudget ? Money.fromDecimal(maxBudget) : null,
            maxTimeMinutes: null,
            maxDistanceKm: null,
            maxStores,
            maxDeviationKm: null,
            allowedStoreIds: [],
            excludedStoreIds: [],
            requiredProductIds: [],
          },
          mode: optimizationMode,
        };

        // 8. Run the local optimization engine
        const result = optimizationEngine.optimize(input);

        // 9. Also update the store so other components can access the plans
        useOptimizationStore.setState({
          plans: result.plans,
          selectedPlan: result.plans.length > 0 ? result.plans[0] : null,
        });

        setState({
          isLoading: false,
          error: null,
          plans: result.plans,
          selectedPlan: result.plans.length > 0 ? result.plans[0] : null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Optimization failed.';
        setState({
          isLoading: false,
          error: message,
          plans: [],
          selectedPlan: null,
        });
      }
    },
    [parseList, optimizationMode, maxStores, maxBudget, setNearbyStores],
  );

  const selectPlan = useCallback((plan: ShoppingPlan) => {
    setState((prev) => ({ ...prev, selectedPlan: plan }));
    useOptimizationStore.setState({ selectedPlan: plan });
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    useListStore.getState().clearList();
    useOptimizationStore.setState({
      plans: [],
      selectedPlan: null,
      nearbyStores: [],
    });
  }, []);

  return {
    ...state,
    runOptimization,
    selectPlan,
    reset,
  };
}
