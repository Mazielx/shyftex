import {
  normalizePlanResult,
  normalizePlanItem,
  toShoppingPlan,
  pesosToCents,
  type RawPlanResult,
} from '../../infrastructure/api/planAdapter';
import { PlanConfidence } from '../../domain/entities/ShoppingPlan';

/**
 * These tests pin the wire contract between `POST /api/v1/optimize` and the
 * domain `ShoppingPlan`.
 *
 * The live backend answers with a pesos-based payload (`estimatedPrice`,
 * `estimatedTotal`, `storeName`) and omits every cents field. Before the
 * adapter existed, the client read the missing cents fields, `Money.fromCents`
 * threw, and the plan silently fell back to the offline engine — the UI showed
 * $0.00 and "Tienda".
 */

/** Byte-for-byte the shape produced by server/src/routes/optimize.ts. */
function currentBackendPayload(): RawPlanResult {
  return {
    planId: 'plan_1700000000000',
    listId: 'list_1',
    mode: 'BALANCED',
    status: 'COMPLETED',
    stores: [
      {
        storeId: 'store_1',
        retailerName: 'Walmart',
        storeName: 'Walmart Miguel Hidalgo',
        address: 'Av. Insurgentes Sur 123, Mexico City, CDMX',
        items: [
          {
            itemId: 'item_1',
            productName: 'Leche Lala 1L',
            quantity: 2,
            unit: 'litro',
            estimatedPrice: 25.5,
            currency: 'MXN',
          },
          {
            itemId: 'item_2',
            productName: 'Huevos',
            quantity: 1,
            unit: 'paquete',
            estimatedPrice: 48.99,
            currency: 'MXN',
          },
        ],
      },
    ],
    summary: {
      totalItems: 7,
      storesToVisit: 1,
      estimatedTotal: 150.75,
      currency: 'MXN',
      estimatedSavings: 30.25,
    },
    warnings: ['Prices are estimated from mock data and may not reflect actual store prices.'],
    isMock: true,
    createdAt: '2026-01-15T12:00:00.000Z',
  };
}

/** The canonical cents payload the client was originally written against. */
function canonicalCentsPayload(): RawPlanResult {
  return {
    planId: 'plan_canonical',
    stores: [
      {
        storeId: 'store_9',
        storeName: 'Soriana',
        retailerName: 'Soriana',
        address: 'Av. Universidad 456',
        latitude: 19.4,
        longitude: -99.1,
        distanceKm: 2.5,
        productCostCents: 3000,
        transportCostCents: 500,
        promos: ['2x1 en KF'],
        items: [
          {
            itemId: 'item_9',
            name: 'Cereal Zucaritas',
            quantity: 1,
            unit: 'caja',
            unitPriceCents: 2500,
            lineTotalCents: 2500,
            promo: '2x1 en KF',
          },
        ],
      },
    ],
    summary: {
      totalProductCostCents: 3000,
      totalTransportCostCents: 500,
      totalDistanceKm: 2.5,
      estimatedTimeMinutes: 20,
      totalItems: 1,
      storesCount: 1,
      savingsCents: 500,
      baselineCents: 3500,
      effectiveCostCents: 3000,
      confidence: 'HIGH',
    },
    warnings: [],
    isMock: false,
  };
}

describe('pesosToCents', () => {
  it('converts decimal pesos to integer cents', () => {
    expect(pesosToCents(25.5)).toBe(2550);
    expect(pesosToCents(48.99)).toBe(4899);
    expect(pesosToCents(0)).toBe(0);
  });

  it('never produces NaN or a negative amount', () => {
    expect(pesosToCents(undefined)).toBe(0);
    expect(pesosToCents(null)).toBe(0);
    expect(pesosToCents(-10)).toBe(0);
    expect(pesosToCents(Number.NaN)).toBe(0);
    expect(Number.isInteger(pesosToCents(19.999))).toBe(true);
  });
});

describe('normalizePlanItem', () => {
  it('maps estimatedPrice pesos onto unitPriceCents and exposes unitPrice', () => {
    const item = normalizePlanItem({
      itemId: 'item_1',
      productName: 'Leche Lala 1L',
      quantity: 2,
      unit: 'litro',
      estimatedPrice: 25.5,
    });

    expect(item.unitPriceCents).toBe(2550);
    expect(item.unitPrice).toBe(25.5);
    expect(item.name).toBe('Leche Lala 1L');
  });

  it('derives lineTotalCents from unitPriceCents times quantity', () => {
    const item = normalizePlanItem({
      itemId: 'item_1',
      name: 'Leche',
      quantity: 3,
      unitPriceCents: 1000,
    });

    expect(item.lineTotalCents).toBe(3000);
  });

  it('prefers an explicit lineTotalCents over the derived one', () => {
    const item = normalizePlanItem({
      itemId: 'item_1',
      name: 'Leche',
      quantity: 3,
      unitPriceCents: 1000,
      lineTotalCents: 2500,
    });

    expect(item.lineTotalCents).toBe(2500);
  });

  it('defaults quantity to 1 so a line total is never zero-by-accident', () => {
    expect(normalizePlanItem({ itemId: 'i', estimatedPrice: 10 }).quantity).toBe(1);
    expect(normalizePlanItem({ itemId: 'i', estimatedPrice: 10 }).lineTotalCents).toBe(1000);
  });
});

describe('normalizePlanResult — current backend (pesos) payload', () => {
  const normalized = normalizePlanResult(currentBackendPayload(), {
    listId: 'list_1',
    userLocation: { latitude: 19.4326, longitude: -99.1332 },
  });

  it('converts summary totals from pesos to cents', () => {
    expect(normalized.summary.totalProductCostCents).toBe(15075);
    expect(normalized.summary.savingsCents).toBe(3025);
  });

  it('derives the effective cost from product + transport - savings', () => {
    // 15075 + 0 - 3025
    expect(normalized.summary.effectiveCostCents).toBe(12050);
    expect(normalized.summary.baselineCents).toBe(15075);
  });

  it('keeps the store name instead of degrading to "Tienda"', () => {
    expect(normalized.stores[0].storeName).toBe('Walmart Miguel Hidalgo');
    expect(normalized.stores[0].retailerName).toBe('Walmart');
    expect(normalized.stores[0].store).toEqual({
      id: 'store_1',
      name: 'Walmart Miguel Hidalgo',
      retailerName: 'Walmart',
    });
  });

  it('derives the per-store product cost from its item line totals', () => {
    // (25.50 * 2) + 48.99 = 99.99
    expect(normalized.stores[0].productCostCents).toBe(9999);
  });

  it('falls back to the caller location when the backend omits coordinates', () => {
    expect(normalized.stores[0].latitude).toBe(19.4326);
    expect(normalized.stores[0].longitude).toBe(-99.1332);
  });

  it('synthesizes a time budget when the backend omits estimatedTimeMinutes', () => {
    expect(normalized.summary.estimatedTimeMinutes).toBeGreaterThan(0);
  });

  it('normalizes storesCount from storesToVisit and defaults confidence', () => {
    expect(normalized.summary.storesCount).toBe(1);
    expect(normalized.summary.confidence).toBe(PlanConfidence.MEDIUM);
  });

  it('preserves the mock marker and warnings', () => {
    expect(normalized.isMock).toBe(true);
    expect(normalized.warnings).toHaveLength(1);
    expect(normalized.createdAt.toISOString()).toBe('2026-01-15T12:00:00.000Z');
  });
});

describe('normalizePlanResult — canonical cents payload', () => {
  const normalized = normalizePlanResult(canonicalCentsPayload(), { listId: 'list_1' });

  it('passes cents fields through untouched (backward compatibility)', () => {
    expect(normalized.summary.totalProductCostCents).toBe(3000);
    expect(normalized.summary.savingsCents).toBe(500);
    expect(normalized.summary.effectiveCostCents).toBe(3000);
    expect(normalized.stores[0].productCostCents).toBe(3000);
    expect(normalized.stores[0].items[0].unitPriceCents).toBe(2500);
  });

  it('keeps the backend coordinates, promos and confidence', () => {
    expect(normalized.stores[0].latitude).toBe(19.4);
    expect(normalized.stores[0].distanceKm).toBe(2.5);
    expect(normalized.stores[0].promos).toEqual(['2x1 en KF']);
    expect(normalized.summary.confidence).toBe(PlanConfidence.HIGH);
    expect(normalized.summary.estimatedTimeMinutes).toBe(20);
  });

  it('honours an explicit isMock: false', () => {
    expect(normalized.isMock).toBe(false);
  });
});

describe('normalizePlanResult — degenerate payloads', () => {
  it('never throws on an empty payload and yields zeroed money', () => {
    const normalized = normalizePlanResult({}, { listId: 'list_empty' });

    expect(normalized.stores).toEqual([]);
    expect(normalized.summary.totalProductCostCents).toBe(0);
    expect(normalized.summary.savingsCents).toBe(0);
    expect(normalized.summary.effectiveCostCents).toBe(0);
    expect(normalized.warnings).toEqual([]);
    expect(normalized.planId).toBe('plan_list_empty');
    expect(normalized.listId).toBe('list_empty');
  });

  it('clamps negative money to zero so Money never receives an invalid amount', () => {
    const normalized = normalizePlanResult(
      {
        stores: [
          {
            storeId: 's',
            storeName: 'S',
            items: [{ itemId: 'i', name: 'X', estimatedPrice: -99, quantity: 1 }],
          },
        ],
        summary: { estimatedTotal: -500, estimatedSavings: -20 },
      },
      { listId: 'list_neg' },
    );

    expect(normalized.summary.totalProductCostCents).toBe(0);
    expect(normalized.summary.savingsCents).toBe(0);
    expect(normalized.stores[0].items[0].unitPriceCents).toBe(0);
  });

  it('falls back to CDMX coordinates when no location is available anywhere', () => {
    const normalized = normalizePlanResult(
      { stores: [{ storeId: 's', storeName: 'S' }] },
      { listId: 'list_noloc' },
    );

    expect(normalized.stores[0].latitude).toBe(19.4326);
    expect(normalized.stores[0].longitude).toBe(-99.1332);
  });

  it('treats an unmarked payload as mock data rather than real (AGENTS.md rule 10)', () => {
    expect(normalizePlanResult({}, { listId: 'l' }).isMock).toBe(true);
  });

  it('degrades store and item labels instead of rendering empty strings', () => {
    const normalized = normalizePlanResult(
      { stores: [{ items: [{ estimatedPrice: 10 }] }] },
      { listId: 'l' },
    );

    expect(normalized.stores[0].storeName).toBe('Tienda');
    expect(normalized.stores[0].items[0].name).toBe('Producto');
    expect(normalized.stores[0].items[0].unit).toBe('pieza');
  });
});

describe('toShoppingPlan', () => {
  it('builds a renderable plan from the live pesos payload (regression: no $0.00)', () => {
    const plan = toShoppingPlan(currentBackendPayload(), {
      listId: 'list_1',
      userLocation: { latitude: 19.4326, longitude: -99.1332 },
    });

    expect(plan.totalProductCost.toDecimal()).toBe(150.75);
    expect(plan.totalProductCost.cents).toBe(15075);
    expect(plan.estimatedSavings?.toDecimal()).toBe(30.25);
    expect(plan.effectiveTotalCost.toDecimal()).toBe(120.5);
    expect(plan.numberOfStores).toBe(1);
    expect(plan.totalTimeMinutes).toBeGreaterThan(0);
    expect(plan.isMock).toBe(true);

    const stop = plan.storeStops[0];
    expect(stop.storeName).toBe('Walmart Miguel Hidalgo');
    expect(stop.productCost.toDecimal()).toBe(99.99);
    expect(stop.items[0].originalPrice.toDecimal()).toBe(25.5);
    // 2 x 25.50
    expect(stop.items[0].effectivePrice.toDecimal()).toBe(51);
    expect(stop.items[0].productName).toBe('Leche Lala 1L');
  });

  it('builds a route that starts at home and reaches every store', () => {
    const plan = toShoppingPlan(currentBackendPayload(), {
      listId: 'list_1',
      userLocation: { latitude: 19.4326, longitude: -99.1332 },
    });

    expect(plan.route).toHaveLength(2);
    expect(plan.route[0].type).toBe('HOME');
    expect(plan.route[0].latitude).toBe(19.4326);
    expect(plan.route[1].type).toBe('STORE');
    expect(plan.route[1].storeName).toBe('Walmart Miguel Hidalgo');
  });

  it('carries the requested mode and list through to the entity', () => {
    const plan = toShoppingPlan(currentBackendPayload(), { listId: 'list_1' });

    expect(plan.listId).toBe('list_1');
    expect(plan.mode).toBe('BALANCED');
    expect(plan.id).toBe('plan_1700000000000');
  });

  it('does not throw on an empty payload', () => {
    const plan = toShoppingPlan({}, { listId: 'list_empty' });

    expect(plan.storeStops).toHaveLength(0);
    expect(plan.totalProductCost.isZero()).toBe(true);
    expect(plan.route).toHaveLength(1);
  });
});
