/**
 * Optimization Engine.
 *
 * This is the CORE of the application. It takes a shopping list, user preferences,
 * store data, prices, promotions, transport options, and constraints to produce
 * optimal shopping plans.
 *
 * CRITICAL RULES:
 * - This module is PURE TypeScript with NO external dependencies
 * - All calculations are deterministic
 * - Money calculations use integer cents
 * - The engine is independently testable
 * - AI/LLM is NEVER used for calculations, only for explanations
 */

import { Money } from '../domain/valueObjects/Money';
import {
  ShoppingPlan,
  OptimizationMode,
  PlanConfidence,
  PlanStoreStop,
  PlanItem,
  PlanRouteStop,
  PlanExplanation,
  PlanPromotionApplied,
} from '../domain/entities/ShoppingPlan';
import { ShoppingItem, ItemPriority, MatchLevel } from '../domain/entities/ShoppingItem';
import { Store } from '../domain/entities/Store';
import { Price, DataSource, DataConfidence } from '../domain/entities/Price';
import { Promotion, PromotionType } from '../domain/entities/Promotion';
import { Inventory, InventoryStatus } from '../domain/entities/Inventory';

// ─── Input Types ───

export interface OptimizationInput {
  listId: string;
  userId: string;
  items: ShoppingItem[];
  stores: Store[];
  prices: Map<string, Price[]>; // storeProductId -> prices
  promotions: Map<string, Promotion[]>; // storeId -> promotions
  inventory: Map<string, Inventory>; // storeProductId -> inventory
  userLocation: { latitude: number; longitude: number };
  userPreferences: UserOptimizationPreferences;
  constraints: OptimizationConstraints;
  mode: OptimizationMode;
}

export interface UserOptimizationPreferences {
  maxWalkingDistanceKm: number;
  preferredRetailerIds: string[];
  avoidedRetailerIds: string[];
  acceptedSubstitutionBrands: string[];
  hasMembership: boolean;
  hasCoupons: boolean;
  acceptedCardBrands: string[];
  vehicleFuelEfficiency: number | null; // km/L
  valueOfTimePerHour: number | null; // MXN
}

export interface OptimizationConstraints {
  maxBudget: Money | null;
  maxTimeMinutes: number | null;
  maxDistanceKm: number | null;
  maxStores: number;
  maxDeviationKm: number | null;
  allowedStoreIds: string[];
  excludedStoreIds: string[];
  requiredProductIds: string[];
}

// ─── Output Types ───

export interface OptimizationResult {
  plans: ShoppingPlan[];
  unfulfilledItems: UnfulfilledItem[];
  warnings: string[];
}

export interface UnfulfilledItem {
  shoppingItemId: string;
  productName: string;
  reason: string;
  suggestedAlternative: string | null;
}

// ─── Scoring Types ───

interface StoreScore {
  store: Store;
  productCost: Money;
  transportCost: Money;
  availableItems: ShoppingItem[];
  unavailableItems: ShoppingItem[];
  promotions: Promotion[];
  promotionSavings: Money;
  totalScore: number;
  costScore: number;
  transportScore: number;
  convenienceScore: number;
}

// ─── Main Optimization Engine ───

export class OptimizationEngine {
  /**
   * Main entry point. Produces optimized shopping plans.
   */
  optimize(input: OptimizationInput): OptimizationResult {
    // 1. Filter stores based on constraints
    const candidateStores = this.filterCandidateStores(input);

    // 2. Score each store individually
    const storeScores = this.scoreStores(candidateStores, input);

    // 3. Generate multi-store strategies
    const strategies = this.generateStrategies(storeScores, input);

    // 4. Build plans from strategies
    const plans = strategies.map((strategy) => this.buildPlan(strategy, input));

    // 5. Rank plans by mode
    const rankedPlans = this.rankPlans(plans, input.mode);

    // 6. Identify unfulfilled items
    const unfulfilled = this.findUnfulfilledItems(rankedPlans, input);

    return {
      plans: rankedPlans.slice(0, 3), // Max 3 plans
      unfulfilledItems: unfulfilled,
      warnings: this.generateGlobalWarnings(input, rankedPlans),
    };
  }

  // ─── Step 1: Filter Stores ───

  private filterCandidateStores(input: OptimizationInput): Store[] {
    return input.stores.filter((store) => {
      // Excluded stores
      if (input.constraints.excludedStoreIds.includes(store.id)) return false;

      // Allowed stores (if specified, only these are allowed)
      if (
        input.constraints.allowedStoreIds.length > 0 &&
        !input.constraints.allowedStoreIds.includes(store.id)
      )
        return false;

      // Avoided retailers
      if (input.userPreferences.avoidedRetailerIds.includes(store.retailerId)) return false;

      // Distance check
      const distance = store.distanceTo(input.userLocation.latitude, input.userLocation.longitude);
      if (input.constraints.maxDeviationKm && distance > input.constraints.maxDeviationKm)
        return false;

      return true;
    });
  }

  // ─── Step 2: Score Stores ───

  private scoreStores(stores: Store[], input: OptimizationInput): StoreScore[] {
    return stores
      .map((store) => this.scoreSingleStore(store, input))
      .filter((score) => score.availableItems.length > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  private scoreSingleStore(store: Store, input: OptimizationInput): StoreScore {
    const storePromotions = input.promotions.get(store.id) ?? [];
    const priceEntries: Array<{ item: ShoppingItem; price: Price; effectivePrice: Money }> = [];
    const availableItems: ShoppingItem[] = [];
    const unavailableItems: ShoppingItem[] = [];
    let promotionSavings = Money.zero();

    for (const item of input.items) {
      if (item.matchedProductId) {
        const storeProductKey = `${store.id}:${item.matchedProductId}`;
        const prices = input.prices.get(storeProductKey) ?? [];
        const inventory = input.inventory.get(storeProductKey);

        // Check inventory
        const isAvailable =
          !inventory ||
          inventory.status === InventoryStatus.IN_STOCK ||
          inventory.status === InventoryStatus.LOW_STOCK ||
          inventory.status === InventoryStatus.UNKNOWN;

        if (isAvailable && prices.length > 0) {
          const price = prices[0]; // Best price
          const effectivePrice = price.getEffectivePrice({
            hasMembership: input.userPreferences.hasMembership,
            hasCoupon: input.userPreferences.hasCoupons,
            acceptedCardBrands: input.userPreferences.acceptedCardBrands,
          });

          priceEntries.push({ item, price, effectivePrice });
          availableItems.push(item);
        } else {
          unavailableItems.push(item);
        }
      } else {
        // Product not matched - item unavailable at this store conceptually
        unavailableItems.push(item);
      }
    }

    // Calculate product cost
    let productCost = Money.zero();
    for (const entry of priceEntries) {
      const lineCost = entry.effectivePrice.multiply(entry.item.quantity);
      productCost = productCost.add(lineCost);
    }

    // Calculate transport cost (simplified - real implementation uses routes)
    const distance = store.distanceTo(input.userLocation.latitude, input.userLocation.longitude);
    const transportCost = this.estimateTransportCost(distance, input);

    // Calculate promotion savings
    for (const promo of storePromotions) {
      if (!promo.isActive()) continue;
      if (
        !promo.meetsUserRequirements({
          hasMembership: input.userPreferences.hasMembership,
          hasCoupon: input.userPreferences.hasCoupons,
          cardBrand: input.userPreferences.acceptedCardBrands[0] ?? null,
        })
      )
        continue;

      const promoSavings = this.calculatePromotionSavings(
        promo,
        priceEntries,
        availableItems,
        input,
      );
      promotionSavings = promotionSavings.add(promoSavings);
    }

    // Calculate scores (0-100, higher is better)
    const maxPossibleCost = this.estimateMaxCost(input);
    const costScore =
      maxPossibleCost.cents > 0
        ? Math.max(0, 100 - (productCost.cents / maxPossibleCost.cents) * 100)
        : 50;

    const transportScore = Math.max(0, 100 - distance * 5); // 5 points per km penalty

    const availableRatio = input.items.length > 0 ? availableItems.length / input.items.length : 0;
    const convenienceScore = availableRatio * 100;

    const totalScore = costScore * 0.5 + transportScore * 0.25 + convenienceScore * 0.25;

    return {
      store,
      productCost: productCost.subtract(promotionSavings),
      transportCost,
      availableItems,
      unavailableItems,
      promotions: storePromotions,
      promotionSavings,
      totalScore,
      costScore,
      transportScore,
      convenienceScore,
    };
  }

  // ─── Step 3: Generate Strategies ───

  private generateStrategies(storeScores: StoreScore[], input: OptimizationInput): Strategy[][] {
    const strategies: Strategy[][] = [];
    const maxStores = Math.min(input.constraints.maxStores, 3);

    // Strategy 1: Single best store
    if (storeScores.length > 0) {
      strategies.push([this.storeScoreToStrategy(storeScores[0], input)]);
    }

    // Strategy 2: Two best stores (if they complement each other)
    if (storeScores.length >= 2 && maxStores >= 2) {
      const top2 = storeScores.slice(0, 2);
      if (this.strategiesComplement(top2, input)) {
        strategies.push(top2.map((s) => this.storeScoreToStrategy(s, input)));
      }
    }

    // Strategy 3: Maximum savings (top stores by cost)
    if (storeScores.length >= 2 && maxStores >= 2) {
      const byCost = [...storeScores].sort((a, b) => a.productCost.cents - b.productCost.cents);
      if (byCost[0].store.id !== storeScores[0].store.id) {
        strategies.push(byCost.slice(0, 2).map((s) => this.storeScoreToStrategy(s, input)));
      }
    }

    // Strategy 4: Maximum convenience (fewest stores)
    // Already covered by single store strategy

    // Deduplicate strategies
    return this.deduplicateStrategies(strategies);
  }

  private storeScoreToStrategy(score: StoreScore, input: OptimizationInput): Strategy {
    return {
      storeId: score.store.id,
      store: score.store,
      productCost: score.productCost,
      transportCost: score.transportCost,
      availableItems: score.availableItems,
      unavailableItems: score.unavailableItems,
      promotionSavings: score.promotionSavings,
    };
  }

  private strategiesComplement(scores: StoreScore[], input: OptimizationInput): boolean {
    // Check if the second store provides items the first doesn't
    const allItemIds = new Set(scores.flatMap((s) => s.availableItems.map((i) => i.id)));
    const totalAvailable = allItemIds.size;
    const singleBestAvailable = scores[0].availableItems.length;
    return totalAvailable > singleBestAvailable;
  }

  private deduplicateStrategies(strategies: Strategy[][]): Strategy[][] {
    const seen = new Set<string>();
    return strategies.filter((s) => {
      const key = s
        .map((x) => x.storeId)
        .sort()
        .join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ─── Step 4: Build Plans ───

  private buildPlan(strategies: Strategy[], input: OptimizationInput): ShoppingPlan {
    const totalProductCost = strategies.reduce((sum, s) => sum.add(s.productCost), Money.zero());
    const totalTransportCost = strategies.reduce(
      (sum, s) => sum.add(s.transportCost),
      Money.zero(),
    );
    const totalTime = strategies.reduce(
      (sum, s) => sum + this.estimateDriveTime(s.store, input),
      0,
    );

    // Build store stops
    const storeStops: PlanStoreStop[] = strategies.map((s) => this.buildStoreStop(s, input));

    // Build route
    const route = this.buildRoute(strategies, input);

    // Calculate baseline cost (all items at most expensive store)
    const baselineCost = this.calculateBaselineCost(input);

    // Calculate savings
    const effectiveTotalCost = totalProductCost.add(totalTransportCost);
    const estimatedSavings = baselineCost.isGreaterThan(Money.zero())
      ? baselineCost.difference(effectiveTotalCost)
      : null;

    // Determine confidence
    const confidence = this.determineConfidence(storeStops, input);

    // Generate explanations
    const explanations = this.generateExplanations(
      strategies,
      effectiveTotalCost,
      estimatedSavings,
      baselineCost,
      input,
    );

    // Generate warnings
    const warnings = this.generatePlanWarnings(strategies, input);

    // Generate assumptions
    const assumptions = this.generateAssumptions(input);

    const now = new Date();
    return new ShoppingPlan({
      id: this.generateId(),
      userId: input.userId,
      listId: input.listId,
      mode: input.mode,
      totalProductCost,
      totalTransportCost,
      totalTimeMinutes: totalTime,
      totalDistanceKm: strategies.reduce((sum, s) => {
        const dist = s.store.distanceTo(input.userLocation.latitude, input.userLocation.longitude);
        return sum + dist * 2; // Round trip
      }, 0),
      effectiveTotalCost,
      estimatedSavings,
      baselineCost: baselineCost.isGreaterThan(Money.zero()) ? baselineCost : null,
      baselineDescription: baselineCost.isGreaterThan(Money.zero())
        ? 'Buying all items at the most expensive store without promotions'
        : null,
      confidence,
      storeStops,
      route,
      assumptions,
      warnings,
      explanations,
      isMock: input.stores.some((s) => s.isMock),
      createdAt: now,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes
    });
  }

  private buildStoreStop(strategy: Strategy, input: OptimizationInput): PlanStoreStop {
    const items: PlanItem[] = strategy.availableItems.map((item) => {
      const storeProductKey = `${strategy.storeId}:${item.matchedProductId}`;
      const prices = input.prices.get(storeProductKey) ?? [];
      const price = prices[0];
      const effectivePrice =
        price?.getEffectivePrice({
          hasMembership: input.userPreferences.hasMembership,
          hasCoupon: input.userPreferences.hasCoupons,
          acceptedCardBrands: input.userPreferences.acceptedCardBrands,
        }) ?? Money.zero();
      const originalPrice = price?.regularPrice ?? Money.zero();

      return {
        shoppingItemId: item.id,
        productId: item.matchedProductId ?? '',
        productName: item.normalizedName ?? item.rawInput,
        brand: item.brand ?? '',
        quantity: item.quantity,
        unit: item.unit,
        originalPrice,
        effectivePrice,
        savings: originalPrice.isGreaterThan(effectivePrice)
          ? originalPrice.difference(effectivePrice)
          : Money.zero(),
        matchLevel: item.matchLevel,
        isSubstitution: item.matchLevel === MatchLevel.ACCEPTABLE_SUBSTITUTE,
        substituteForProductId:
          item.matchLevel === MatchLevel.ACCEPTABLE_SUBSTITUTE ? item.exactProductId : null,
      };
    });

    const productCost = items.reduce(
      (sum, item) => sum.add(item.effectivePrice.multiply(item.quantity)),
      Money.zero(),
    );

    // Calculate applicable promotion savings
    const storePromotions = input.promotions.get(strategy.storeId) ?? [];
    const appliedPromotions: PlanPromotionApplied[] = [];
    for (const promo of storePromotions) {
      if (!promo.isActive()) continue;
      if (
        !promo.meetsUserRequirements({
          hasMembership: input.userPreferences.hasMembership,
          hasCoupon: input.userPreferences.hasCoupons,
          cardBrand: input.userPreferences.acceptedCardBrands[0] ?? null,
        })
      )
        continue;

      const savings = this.calculatePromotionSavingsForItems(promo, items);
      if (savings.isGreaterThan(Money.zero())) {
        appliedPromotions.push({
          promotionId: promo.id,
          name: promo.name,
          type: promo.type,
          savings,
          requiredMembership: promo.membershipRequired,
          requiredCard: promo.cardRequired,
        });
      }
    }

    return {
      storeId: strategy.storeId,
      storeName: strategy.store.name,
      retailerName: strategy.store.retailerName,
      address: strategy.store.getFullAddress(),
      latitude: strategy.store.latitude,
      longitude: strategy.store.longitude,
      productCost,
      transportCost: strategy.transportCost,
      items,
      promotions: appliedPromotions,
    };
  }

  private buildRoute(strategies: Strategy[], input: OptimizationInput): PlanRouteStop[] {
    const route: PlanRouteStop[] = [];
    let accumulatedTime = 0;

    // Home start
    route.push({
      order: 0,
      type: 'HOME',
      storeId: null,
      storeName: null,
      latitude: input.userLocation.latitude,
      longitude: input.userLocation.longitude,
      address: 'Home',
      estimatedArrivalMinutes: 0,
      distanceFromPreviousKm: 0,
    });

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      const distance = strategy.store.distanceTo(
        input.userLocation.latitude,
        input.userLocation.longitude,
      );
      const driveTime = this.estimateDriveTime(strategy.store, input);

      accumulatedTime += driveTime;
      route.push({
        order: i + 1,
        type: 'STORE',
        storeId: strategy.store.id,
        storeName: `${strategy.store.retailerName} - ${strategy.store.name}`,
        latitude: strategy.store.latitude,
        longitude: strategy.store.longitude,
        address: strategy.store.getFullAddress(),
        estimatedArrivalMinutes: accumulatedTime,
        distanceFromPreviousKm: distance,
      });

      // Add shopping time estimate (5 min + 2 min per item)
      accumulatedTime += 5 + strategy.availableItems.length * 2;
    }

    return route;
  }

  // ─── Promotion Savings Calculator ───

  private calculatePromotionSavings(
    promo: Promotion,
    priceEntries: Array<{ item: ShoppingItem; price: Price; effectivePrice: Money }>,
    availableItems: ShoppingItem[],
    input: OptimizationInput,
  ): Money {
    let totalSavings = Money.zero();

    const applicableEntries = priceEntries.filter((entry) => {
      return promo.isApplicableToProduct(
        entry.item.matchedProductId ?? '',
        entry.item.category ?? '',
      );
    });

    if (applicableEntries.length === 0) return Money.zero();

    switch (promo.type) {
      case PromotionType.PERCENTAGE_DISCOUNT:
        if (promo.discountPercentage) {
          totalSavings = applicableEntries.reduce((sum, entry) => {
            const lineCost = entry.effectivePrice.multiply(entry.item.quantity);
            const discount = lineCost.multiply(promo.discountPercentage! / 100);
            return sum.add(discount);
          }, Money.zero());
        }
        break;

      case PromotionType.FIXED_DISCOUNT:
        if (promo.discountAmount) {
          totalSavings = promo.discountAmount.multiply(applicableEntries.length);
        }
        break;

      case PromotionType.TWO_X_ONE:
        for (const entry of applicableEntries) {
          if (entry.item.quantity >= 2) {
            const pairs = Math.floor(entry.item.quantity / 2);
            totalSavings = totalSavings.add(entry.effectivePrice.multiply(pairs));
          }
        }
        break;

      case PromotionType.THREE_X_TWO:
        for (const entry of applicableEntries) {
          if (entry.item.quantity >= 3) {
            const sets = Math.floor(entry.item.quantity / 3);
            totalSavings = totalSavings.add(entry.effectivePrice.multiply(sets));
          }
        }
        break;

      default:
        break;
    }

    // Apply max discount cap
    if (promo.maxDiscount && totalSavings.isGreaterThan(promo.maxDiscount)) {
      totalSavings = promo.maxDiscount;
    }

    return totalSavings;
  }

  private calculatePromotionSavingsForItems(promo: Promotion, items: PlanItem[]): Money {
    let totalSavings = Money.zero();

    const applicableItems = items.filter((item) => {
      return promo.isApplicableToProduct(item.productId, '');
    });

    if (applicableItems.length === 0) return Money.zero();

    switch (promo.type) {
      case PromotionType.TWO_X_ONE:
        for (const item of applicableItems) {
          if (item.quantity >= 2) {
            const pairs = Math.floor(item.quantity / 2);
            totalSavings = totalSavings.add(item.effectivePrice.multiply(pairs));
          }
        }
        break;

      case PromotionType.THREE_X_TWO:
        for (const item of applicableItems) {
          if (item.quantity >= 3) {
            const sets = Math.floor(item.quantity / 3);
            totalSavings = totalSavings.add(item.effectivePrice.multiply(sets));
          }
        }
        break;

      case PromotionType.PERCENTAGE_DISCOUNT:
        if (promo.discountPercentage) {
          totalSavings = applicableItems.reduce((sum, item) => {
            const lineCost = item.effectivePrice.multiply(item.quantity);
            return sum.add(lineCost.multiply(promo.discountPercentage! / 100));
          }, Money.zero());
        }
        break;

      default:
        break;
    }

    return totalSavings;
  }

  // ─── Scoring Helpers ───

  private estimateTransportCost(distance: number, input: OptimizationInput): Money {
    // Round trip
    const roundTripKm = distance * 2;

    if (input.userPreferences.vehicleFuelEfficiency) {
      // Calculate fuel cost
      const fuelNeeded = roundTripKm / input.userPreferences.vehicleFuelEfficiency;
      const fuelPricePerLiter = 24.5; // Default estimate for Mexico
      return Money.fromDecimal(fuelNeeded * fuelPricePerLiter);
    }

    // Default: $3 per km estimate for driving
    return Money.fromDecimal(roundTripKm * 3);
  }

  private estimateMaxCost(input: OptimizationInput): Money {
    // Estimate the maximum possible cost as a reference
    return Money.fromDecimal(input.items.length * 200); // $200 per item average
  }

  private estimateDriveTime(store: Store, input: OptimizationInput): number {
    const distance = store.distanceTo(input.userLocation.latitude, input.userLocation.longitude);
    // Average 30 km/h in city
    return Math.round((distance / 30) * 60);
  }

  private calculateBaselineCost(input: OptimizationInput): Money {
    // Baseline: most expensive store with no promotions
    // For each item, find the highest price across all stores
    let baseline = Money.zero();
    for (const item of input.items) {
      let highestPrice = Money.zero();
      for (const [key, prices] of input.prices) {
        if (key.endsWith(`:${item.matchedProductId}`)) {
          for (const price of prices) {
            if (price.regularPrice.isGreaterThan(highestPrice)) {
              highestPrice = price.regularPrice;
            }
          }
        }
      }
      if (highestPrice.isGreaterThan(Money.zero())) {
        baseline = baseline.add(highestPrice.multiply(item.quantity));
      }
    }
    return baseline;
  }

  private determineConfidence(stops: PlanStoreStop[], input: OptimizationInput): PlanConfidence {
    let highConfidenceItems = 0;
    let totalItems = 0;

    for (const stop of stops) {
      for (const item of stop.items) {
        totalItems++;
        const key = `${stop.storeId}:${item.productId}`;
        const prices = input.prices.get(key) ?? [];
        const inv = input.inventory.get(key);

        const priceConfident = prices.some(
          (p) =>
            p.confidence === DataConfidence.CONFIRMED || p.confidence === DataConfidence.RECENT,
        );
        const inventoryOk = !inv || inv.status === InventoryStatus.IN_STOCK;

        if (priceConfident && inventoryOk) highConfidenceItems++;
      }
    }

    const ratio = totalItems > 0 ? highConfidenceItems / totalItems : 0;
    if (ratio >= 0.8) return PlanConfidence.HIGH;
    if (ratio >= 0.5) return PlanConfidence.MEDIUM;
    return PlanConfidence.LOW;
  }

  // ─── Explanations ───

  private generateExplanations(
    strategies: Strategy[],
    effectiveTotalCost: Money,
    estimatedSavings: Money | null,
    baselineCost: Money,
    input: OptimizationInput,
  ): PlanExplanation[] {
    const explanations: PlanExplanation[] = [];

    // Explain store choice
    for (const strategy of strategies) {
      if (strategy.availableItems.length > 0) {
        explanations.push({
          category: 'CHOICE',
          text: `We recommend ${strategy.store.retailerName} (${strategy.store.name}) because ${strategy.availableItems.length} products are available there.`,
          details: `Product cost at this store: ${strategy.productCost.format()}`,
        });
      }
    }

    // Explain savings
    if (estimatedSavings && estimatedSavings.isGreaterThan(Money.zero())) {
      explanations.push({
        category: 'SAVINGS',
        text: `You save approximately ${estimatedSavings.format()} compared to the baseline.`,
        details: `Baseline (most expensive option): ${baselineCost.format()}`,
      });
    }

    // Explain transport cost
    const totalTransport = strategies.reduce((sum, s) => sum.add(s.transportCost), Money.zero());
    if (totalTransport.isGreaterThan(Money.zero())) {
      explanations.push({
        category: 'ASSUMPTION',
        text: `Estimated transport cost: ${totalTransport.format()}.`,
        details: input.userPreferences.vehicleFuelEfficiency
          ? `Based on your vehicle's fuel efficiency of ${input.userPreferences.vehicleFuelEfficiency} km/L.`
          : 'Default transport cost estimate used.',
      });
    }

    // Explain unavailable items
    const unavailableCount = strategies.reduce((sum, s) => sum + s.unavailableItems.length, 0);
    if (unavailableCount > 0) {
      explanations.push({
        category: 'WARNING',
        text: `${unavailableCount} item(s) could not be found or matched. These are excluded from the plan.`,
        details: 'Try updating your list with more specific product names.',
      });
    }

    return explanations;
  }

  private generatePlanWarnings(strategies: Strategy[], input: OptimizationInput): string[] {
    const warnings: string[] = [];

    // Budget warning
    if (input.constraints.maxBudget) {
      const totalCost = strategies.reduce(
        (sum, s) => sum.add(s.productCost).add(s.transportCost),
        Money.zero(),
      );
      if (totalCost.isGreaterThan(input.constraints.maxBudget)) {
        warnings.push(
          `This plan exceeds your budget of ${input.constraints.maxBudget.format()} by ${totalCost.difference(input.constraints.maxBudget).format()}.`,
        );
      }
    }

    // Time warning
    if (input.constraints.maxTimeMinutes) {
      const totalTime = strategies.reduce(
        (sum, s) => sum + this.estimateDriveTime(s.store, input),
        0,
      );
      if (totalTime > input.constraints.maxTimeMinutes) {
        warnings.push(
          `Estimated travel time (${totalTime} min) exceeds your maximum (${input.constraints.maxTimeMinutes} min).`,
        );
      }
    }

    // Unavailable items
    for (const strategy of strategies) {
      if (strategy.unavailableItems.length > 0) {
        warnings.push(
          `${strategy.unavailableItems.length} item(s) are not available at ${strategy.store.retailerName}.`,
        );
      }
    }

    // Stale data warning
    const hasStalePrices = strategies.some((s) => {
      const prices = input.prices.get(`${s.storeId}:*`);
      return false; // Simplified
    });
    if (hasStalePrices) {
      warnings.push('Some prices may be outdated. Final cost may vary.');
    }

    return warnings;
  }

  private generateAssumptions(input: OptimizationInput): string[] {
    const assumptions: string[] = [];

    assumptions.push('Prices are as observed at the time of data collection.');
    assumptions.push('Product availability is estimated and may change.');

    if (!input.userPreferences.vehicleFuelEfficiency) {
      assumptions.push('Fuel cost estimated using default values.');
    }

    if (!input.userPreferences.valueOfTimePerHour) {
      assumptions.push('Time cost is not included (user has not configured a value for time).');
    }

    assumptions.push('Travel times are estimates based on typical conditions.');

    return assumptions;
  }

  private generateGlobalWarnings(input: OptimizationInput, plans: ShoppingPlan[]): string[] {
    const warnings: string[] = [];

    if (plans.length === 0) {
      warnings.push('No feasible plan found with your current constraints.');
    }

    if (input.items.length > 0) {
      const matchedCount = input.items.filter((i) => i.hasMatch()).length;
      if (matchedCount < input.items.length) {
        warnings.push(
          `${input.items.length - matchedCount} product(s) could not be matched to our catalog.`,
        );
      }
    }

    return warnings;
  }

  // ─── Ranking ───

  private rankPlans(plans: ShoppingPlan[], mode: OptimizationMode): ShoppingPlan[] {
    return [...plans].sort((a, b) => {
      switch (mode) {
        case OptimizationMode.MAXIMUM_SAVINGS:
          // Lowest effective cost wins
          return a.effectiveTotalCost.cents - b.effectiveTotalCost.cents;

        case OptimizationMode.MAXIMUM_CONVENIENCE:
          // Fewer stores, less time, less distance
          if (a.numberOfStores !== b.numberOfStores) {
            return a.numberOfStores - b.numberOfStores;
          }
          return a.totalTimeMinutes - b.totalTimeMinutes;

        case OptimizationMode.BALANCED:
        default: {
          // Balance cost and convenience
          const aScore = a.effectiveTotalCost.cents + a.totalTimeMinutes * 100;
          const bScore = b.effectiveTotalCost.cents + b.totalTimeMinutes * 100;
          return aScore - bScore;
        }
      }
    });
  }

  // ─── Unfulfilled Items ───

  private findUnfulfilledItems(plans: ShoppingPlan[], input: OptimizationInput): UnfulfilledItem[] {
    if (plans.length === 0) {
      return input.items.map((item) => ({
        shoppingItemId: item.id,
        productName: item.normalizedName ?? item.rawInput,
        reason: 'No feasible plan found',
        suggestedAlternative: null,
      }));
    }

    const bestPlan = plans[0];
    const bestPlanProductIds = new Set(
      bestPlan.storeStops.flatMap((stop) => stop.items.map((item) => item.productId)),
    );

    return input.items
      .filter((item) => item.matchedProductId && !bestPlanProductIds.has(item.matchedProductId))
      .map((item) => ({
        shoppingItemId: item.id,
        productName: item.normalizedName ?? item.rawInput,
        reason: 'Not available at recommended stores',
        suggestedAlternative: null,
      }));
  }

  // ─── Helpers ───

  private generateId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

interface Strategy {
  storeId: string;
  store: Store;
  productCost: Money;
  transportCost: Money;
  availableItems: ShoppingItem[];
  unavailableItems: ShoppingItem[];
  promotionSavings: Money;
}
