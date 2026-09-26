/**
 * Plan adapter — the single boundary between the SHYFTEX backend wire format
 * and the domain `ShoppingPlan` entity.
 *
 * Why this exists
 * ---------------
 * `POST /api/v1/optimize` answers with a *pesos-based, loosely typed* payload:
 *
 *   stores[].items[].estimatedPrice  ->  decimal pesos (e.g. 42.5)
 *   stores[].storeName               ->  plain string
 *   summary.estimatedTotal           ->  decimal pesos
 *   summary.estimatedSavings         ->  decimal pesos
 *   summary.storesToVisit            ->  count of stores
 *
 * ...and omits `unitPriceCents`, `lineTotalCents`, `productCostCents`,
 * `latitude`, `longitude`, `distanceKm`, `promos`, `confidence` and the
 * `totalProductCostCents` family entirely.
 *
 * The client used to read the *missing* cents-based field names, so
 * `Money.fromCents(undefined)` threw and the plan silently fell back to the
 * offline engine — the UI showed $0.00 prices and "Tienda".
 *
 * This module normalizes the wire payload into a fully-populated, integer-cents
 * shape (`NormalizedPlanResult`) and maps it to the domain entity. It is
 * tolerant of BOTH the current pesos payload and the canonical cents payload,
 * so the backend can converge on either contract without breaking the app.
 *
 * All monetary values are converted to integer cents before they reach `Money`
 * (AGENTS.md: never use floating point for money).
 */

import { Money } from '../../domain/valueObjects/Money';
import {
  ShoppingPlan,
  PlanConfidence,
  PlanStoreStop,
  PlanItem,
  PlanPromotionApplied,
  PlanRouteStop,
  PlanExplanation,
  OptimizationMode,
} from '../../domain/entities/ShoppingPlan';
import { MatchLevel } from '../../domain/entities/ShoppingItem';

// ─── Constants ───

/** Cents per major currency unit. */
const CENTS_PER_UNIT = 100;

/** Fallback walking/driving minutes budgeted per store when the backend omits it. */
const DEFAULT_MINUTES_PER_STORE = 15;

/** Fallback coordinates (Mexico City) when neither backend nor caller supplies a location. */
const FALLBACK_LOCATION = { latitude: 19.4326, longitude: -99.1332 } as const;

/** Plan time-to-live in minutes. */
const PLAN_TTL_MINUTES = 30;

/** Honest default: an unmarked backend payload is treated as mock data (AGENTS.md rule 10). */
const DEFAULT_IS_MOCK = true;

// ─── Wire types (what the backend may send) ───

/** A plan item as it arrives on the wire. Every field is optional because the
 *  backend has shipped two different shapes for the same resource. */
export interface RawPlanItem {
  itemId?: string;
  id?: string;
  /** Canonical cents shape. */
  name?: string;
  unitPriceCents?: number;
  lineTotalCents?: number;
  totalCents?: number;
  /** Current pesos shape. */
  productName?: string;
  normalizedName?: string;
  estimatedPrice?: number;
  unitPrice?: number;
  price?: number;
  quantity?: number;
  unit?: string;
  promo?: string | null;
  brand?: string;
  matchLevel?: string;
  [key: string]: unknown;
}

export interface RawPlanStore {
  storeId?: string;
  id?: string;
  /** Canonical shape. */
  storeName?: string;
  retailerName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  productCostCents?: number;
  transportCostCents?: number;
  promos?: string[];
  items?: RawPlanItem[];
  /** `name` is used by storesApi-shaped payloads. */
  name?: string;
  retailer?: string;
  [key: string]: unknown;
}

export interface RawPlanSummary {
  /** Canonical cents shape. */
  totalProductCostCents?: number;
  totalTransportCostCents?: number;
  totalDistanceKm?: number;
  estimatedTimeMinutes?: number;
  totalItems?: number;
  storesCount?: number;
  savingsCents?: number;
  baselineCents?: number;
  effectiveCostCents?: number;
  confidence?: string;
  /** Current pesos shape. */
  estimatedTotal?: number;
  estimatedSavings?: number;
  storesToVisit?: number;
  currency?: string;
  [key: string]: unknown;
}

export interface RawPlanResult {
  planId?: string;
  id?: string;
  listId?: string;
  mode?: string;
  status?: string;
  stores?: RawPlanStore[];
  summary?: RawPlanSummary;
  warnings?: unknown[];
  isMock?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

// ─── Normalized types (guaranteed, integer cents) ───

export interface NormalizedPlanItem {
  itemId: string;
  /** Decimal pesos, for consumers that render pesos directly. */
  unitPrice: number;
  /** Integer cents, the only shape `Money` accepts. */
  unitPriceCents: number;
  lineTotalCents: number;
  lineTotal: number;
  name: string;
  quantity: number;
  unit: string;
  promo: string | null;
  brand: string;
  matchLevel: string;
}

export interface NormalizedPlanStore {
  storeId: string;
  storeName: string;
  retailerName: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  productCostCents: number;
  transportCostCents: number;
  items: NormalizedPlanItem[];
  promos: string[];
  /** `{ name }` view of the store, matching the `Store` entity shape. */
  store: { id: string; name: string; retailerName: string };
}

export interface NormalizedPlanSummary {
  totalProductCostCents: number;
  totalTransportCostCents: number;
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  totalItems: number;
  storesCount: number;
  savingsCents: number;
  baselineCents: number;
  effectiveCostCents: number;
  confidence: PlanConfidence;
  currency: string;
}

export interface NormalizedPlanResult {
  planId: string;
  listId: string;
  mode: OptimizationMode;
  stores: NormalizedPlanStore[];
  summary: NormalizedPlanSummary;
  warnings: string[];
  isMock: boolean;
  createdAt: Date;
}

// ─── Coercion helpers ───

/** Coerce to a finite, non-negative number. Returns `fallback` for anything else. */
function toFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Coerce to a non-negative integer. Guards `Money`, which rejects NaN/negatives. */
function toCents(value: unknown): number {
  const numeric = toFiniteNumber(value, 0);
  if (numeric <= 0) return 0;
  return Math.round(numeric);
}

/** Coerce a pesos amount (decimal) into integer cents. */
export function pesosToCents(pesos: unknown): number {
  return toCents(toFiniteNumber(pesos, 0) * CENTS_PER_UNIT);
}

/** Coerce a cents amount that may already be an integer, else derive it from pesos. */
function resolveCents(centsValue: unknown, pesosValue: unknown): number {
  const explicit = toCents(centsValue);
  if (explicit > 0) return explicit;
  return pesosToCents(pesosValue);
}

/** First non-empty string among the candidates, else `fallback`. */
function firstText(candidates: Array<unknown>, fallback: string): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate;
  }
  return fallback;
}

/** First finite number among the candidates, else 0. */
function firstNumber(candidates: Array<unknown>): number {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  }
  return 0;
}

/** Keep only string entries from an unknown array. */
function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
}

// ─── Item normalization ───

export function normalizePlanItem(raw: RawPlanItem): NormalizedPlanItem {
  const quantity = Math.max(1, Math.round(toFiniteNumber(raw.quantity, 1)));
  const unitPriceCents = resolveCents(
    firstNumber([raw.unitPriceCents, raw.priceCents]),
    firstNumber([raw.estimatedPrice, raw.unitPrice, raw.price]),
  );
  const lineTotalCents = toCents(
    firstNumber([raw.lineTotalCents, raw.totalCents]) || unitPriceCents * quantity,
  );

  return {
    itemId: firstText([raw.itemId, raw.id], ''),
    unitPrice: unitPriceCents / CENTS_PER_UNIT,
    unitPriceCents,
    lineTotalCents,
    lineTotal: lineTotalCents / CENTS_PER_UNIT,
    name: firstText([raw.name, raw.productName, raw.normalizedName], 'Producto'),
    quantity,
    unit: firstText([raw.unit], 'pieza'),
    promo: typeof raw.promo === 'string' && raw.promo.length > 0 ? raw.promo : null,
    brand: firstText([raw.brand], ''),
    matchLevel: firstText([raw.matchLevel], MatchLevel.EXACT_MATCH),
  };
}

// ─── Store normalization ───

function normalizePlanStore(
  raw: RawPlanStore,
  fallbackLocation: { latitude: number; longitude: number },
): NormalizedPlanStore {
  const items = Array.isArray(raw.items) ? raw.items.map(normalizePlanItem) : [];
  const storeId = firstText([raw.storeId, raw.id], '');
  const storeName = firstText([raw.storeName, raw.name, raw.retailerName], 'Tienda');
  const retailerName = firstText([raw.retailerName, raw.retailer], storeName);
  const derivedProductCost = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

  return {
    storeId,
    storeName,
    retailerName,
    address: firstText([raw.address], ''),
    latitude: toFiniteNumber(raw.latitude, fallbackLocation.latitude),
    longitude: toFiniteNumber(raw.longitude, fallbackLocation.longitude),
    distanceKm: toFiniteNumber(raw.distanceKm, 0),
    productCostCents: toCents(firstNumber([raw.productCostCents])) || derivedProductCost,
    transportCostCents: toCents(firstNumber([raw.transportCostCents])),
    items,
    promos: toStringList(raw.promos),
    store: { id: storeId, name: storeName, retailerName },
  };
}

// ─── Plan normalization ───

export interface NormalizeOptions {
  listId: string;
  mode?: OptimizationMode;
  /** Used when the backend omits per-store coordinates. */
  userLocation?: { latitude: number; longitude: number };
}

export function normalizePlanResult(
  raw: RawPlanResult,
  options: NormalizeOptions,
): NormalizedPlanResult {
  const fallbackLocation = options.userLocation ?? FALLBACK_LOCATION;
  const summary: RawPlanSummary = raw.summary ?? {};

  const stores = Array.isArray(raw.stores)
    ? raw.stores.map((store) => normalizePlanStore(store, fallbackLocation))
    : [];

  const derivedProductCost = stores.reduce((sum, store) => sum + store.productCostCents, 0);
  const derivedTransportCost = stores.reduce((sum, store) => sum + store.transportCostCents, 0);
  const derivedDistance = stores.reduce((sum, store) => sum + store.distanceKm, 0);
  const derivedItemCount = stores.reduce((sum, store) => sum + store.items.length, 0);

  const totalProductCostCents =
    toCents(firstNumber([summary.totalProductCostCents])) ||
    pesosToCents(summary.estimatedTotal) ||
    derivedProductCost;
  const totalTransportCostCents =
    toCents(firstNumber([summary.totalTransportCostCents])) || derivedTransportCost;
  const savingsCents =
    toCents(firstNumber([summary.savingsCents])) || pesosToCents(summary.estimatedSavings);
  const storesCount = Math.max(
    stores.length,
    Math.round(firstNumber([summary.storesCount, summary.storesToVisit])),
  );
  const totalDistanceKm =
    toFiniteNumber(summary.totalDistanceKm, derivedDistance) || derivedDistance;
  const effectiveCostCents =
    toCents(firstNumber([summary.effectiveCostCents])) ||
    Math.max(0, totalProductCostCents + totalTransportCostCents - savingsCents);
  const baselineCents =
    toCents(firstNumber([summary.baselineCents])) ||
    (savingsCents > 0 ? effectiveCostCents + savingsCents : 0);

  return {
    planId: firstText([raw.planId, raw.id], `plan_${options.listId}`),
    listId: firstText([raw.listId], options.listId),
    mode: toOptimizationMode(raw.mode) ?? options.mode ?? OptimizationMode.BALANCED,
    stores,
    summary: {
      totalProductCostCents,
      totalTransportCostCents,
      totalDistanceKm,
      estimatedTimeMinutes:
        Math.round(toFiniteNumber(summary.estimatedTimeMinutes, 0)) ||
        storesCount * DEFAULT_MINUTES_PER_STORE,
      totalItems:
        Math.round(toFiniteNumber(summary.totalItems, derivedItemCount)) || derivedItemCount,
      storesCount,
      savingsCents,
      baselineCents,
      effectiveCostCents,
      confidence: toPlanConfidence(summary.confidence),
      currency: firstText([summary.currency], 'MXN'),
    },
    warnings: toStringList(raw.warnings),
    isMock: typeof raw.isMock === 'boolean' ? raw.isMock : DEFAULT_IS_MOCK,
    createdAt: toDate(raw.createdAt),
  };
}

// ─── Enum coercion ───

function toOptimizationMode(value: unknown): OptimizationMode | null {
  if (typeof value !== 'string') return null;
  const match = Object.values(OptimizationMode).find((mode) => mode === value);
  return match ?? null;
}

function toPlanConfidence(value: unknown): PlanConfidence {
  if (typeof value === 'string') {
    const match = Object.values(PlanConfidence).find((level) => level === value);
    if (match) return match;
  }
  return PlanConfidence.MEDIUM;
}

function toDate(value: unknown): Date {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

// ─── Entity mapping ───

function toPlanItem(item: NormalizedPlanItem): PlanItem {
  return {
    shoppingItemId: item.itemId,
    productId: item.itemId,
    productName: item.name,
    brand: item.brand,
    quantity: item.quantity,
    unit: item.unit,
    originalPrice: Money.fromCents(item.unitPriceCents),
    effectivePrice: Money.fromCents(item.lineTotalCents),
    savings: Money.zero(),
    matchLevel: item.matchLevel,
    isSubstitution: false,
    substituteForProductId: null,
  };
}

function toPlanPromotions(promos: string[]): PlanPromotionApplied[] {
  return promos.map((promo) => ({
    promotionId: promo,
    name: promo,
    type: 'DISCOUNT',
    savings: Money.zero(),
    requiredMembership: false,
    requiredCard: false,
  }));
}

function toStoreStop(store: NormalizedPlanStore): PlanStoreStop {
  return {
    storeId: store.storeId,
    storeName: store.storeName,
    retailerName: store.retailerName,
    address: store.address,
    latitude: store.latitude,
    longitude: store.longitude,
    productCost: Money.fromCents(store.productCostCents),
    transportCost: Money.fromCents(store.transportCostCents),
    items: store.items.map(toPlanItem),
    promotions: toPlanPromotions(store.promos),
  };
}

function toRoute(
  stores: NormalizedPlanStore[],
  fallback: { latitude: number; longitude: number },
): PlanRouteStop[] {
  const home: PlanRouteStop = {
    order: 0,
    type: 'HOME',
    storeId: null,
    storeName: null,
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    address: 'Home',
    estimatedArrivalMinutes: 0,
    distanceFromPreviousKm: 0,
  };

  const stops: PlanRouteStop[] = stores.map((store, index) => ({
    order: index + 1,
    type: 'STORE',
    storeId: store.storeId,
    storeName: store.storeName,
    latitude: store.latitude,
    longitude: store.longitude,
    address: store.address,
    estimatedArrivalMinutes: Math.round(store.distanceKm * 3),
    distanceFromPreviousKm: store.distanceKm,
  }));

  return [home, ...stops];
}

/** Map a wire payload straight to the domain entity. */
export function toShoppingPlan(raw: RawPlanResult, options: NormalizeOptions): ShoppingPlan {
  const normalized = normalizePlanResult(raw, options);
  const fallbackLocation = options.userLocation ?? FALLBACK_LOCATION;

  const explanations: PlanExplanation[] = [
    {
      category: 'CHOICE',
      text: `Optimized across ${normalized.summary.storesCount} store(s).`,
      details: null,
    },
  ];

  const createdAt = normalized.createdAt;

  return new ShoppingPlan({
    id: normalized.planId,
    userId: '',
    listId: normalized.listId,
    mode: normalized.mode,
    totalProductCost: Money.fromCents(normalized.summary.totalProductCostCents),
    totalTransportCost: Money.fromCents(normalized.summary.totalTransportCostCents),
    totalTimeMinutes: normalized.summary.estimatedTimeMinutes,
    totalDistanceKm: normalized.summary.totalDistanceKm,
    effectiveTotalCost: Money.fromCents(normalized.summary.effectiveCostCents),
    estimatedSavings:
      normalized.summary.savingsCents > 0 ? Money.fromCents(normalized.summary.savingsCents) : null,
    baselineCost:
      normalized.summary.baselineCents > 0
        ? Money.fromCents(normalized.summary.baselineCents)
        : null,
    baselineDescription: null,
    confidence: normalized.summary.confidence,
    storeStops: normalized.stores.map(toStoreStop),
    route: toRoute(normalized.stores, fallbackLocation),
    assumptions: ['Prices from backend. May vary.'],
    warnings: normalized.warnings,
    explanations,
    isMock: normalized.isMock,
    createdAt,
    expiresAt: new Date(createdAt.getTime() + PLAN_TTL_MINUTES * 60 * 1000),
  });
}
