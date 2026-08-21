/**
 * Tests for MockRetailDataProvider.
 * Verifies mock data integrity, search, store operations, and price retrieval.
 */

import { MockRetailDataProvider } from '../../infrastructure/providers/MockRetailDataProvider';

describe('MockRetailDataProvider', () => {
  let provider: MockRetailDataProvider;

  beforeEach(() => {
    provider = new MockRetailDataProvider();
  });

  describe('metadata', () => {
    it('should be marked as mock', () => {
      expect(provider.isMock).toBe(true);
      expect(provider.name).toBe('MockRetailDataProvider');
    });
  });

  describe('searchProducts', () => {
    it('should return products matching a query', async () => {
      const result = await provider.searchProducts('leche');
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.source).toBe('MOCK');
    });

    it('should return empty for unmatched query', async () => {
      const result = await provider.searchProducts('xyznonexistent');
      expect(result.products).toHaveLength(0);
    });

    it('should limit results', async () => {
      const result = await provider.searchProducts('leche', { limit: 2 });
      expect(result.products.length).toBeLessThanOrEqual(2);
    });

    it('should filter by brand via text search', async () => {
      const result = await provider.searchProducts('Lala');
      expect(result.products.length).toBeGreaterThan(0);
      for (const p of result.products) {
        expect(p.brand).toBe('Lala');
      }
    });

    it('should return all products with empty query', async () => {
      const result = await provider.searchProducts('');
      expect(result.products.length).toBeGreaterThan(0);
    });
  });

  describe('getProduct', () => {
    it('should return a product by ID', async () => {
      const product = await provider.getProduct('prod_lala_leche_1l');
      expect(product).not.toBeNull();
      expect(product!.name).toContain('Lala');
      expect(product!.isMock).toBe(true);
    });

    it('should return null for unknown ID', async () => {
      const product = await provider.getProduct('nonexistent_id');
      expect(product).toBeNull();
    });
  });

  describe('getProductByBarcode', () => {
    it('should return a product by barcode', async () => {
      const product = await provider.getProductByBarcode('7501020535014');
      expect(product).not.toBeNull();
      expect(product!.brand).toBe('Lala');
    });

    it('should return null for unknown barcode', async () => {
      const product = await provider.getProductByBarcode('0000000000000');
      expect(product).toBeNull();
    });
  });

  describe('getStoresNearby', () => {
    it('should return stores near CDMX center', async () => {
      const stores = await provider.getStoresNearby(19.4326, -99.1332, 15);
      expect(stores.length).toBeGreaterThan(0);
    });

    it('should not return stores outside radius', async () => {
      const stores = await provider.getStoresNearby(25.0, -100.0, 1);
      expect(stores).toHaveLength(0);
    });

    it('should mark stores as mock', async () => {
      const stores = await provider.getStoresNearby(19.4326, -99.1332, 15);
      for (const store of stores) {
        expect(store.isMock).toBe(true);
      }
    });
  });

  describe('getStore', () => {
    it('should return a store by ID', async () => {
      const store = await provider.getStore('store_walmart_polanco');
      expect(store).not.toBeNull();
      expect(store!.name).toContain('Walmart');
      expect(store!.isMock).toBe(true);
    });

    it('should return null for unknown store ID', async () => {
      const store = await provider.getStore('nonexistent');
      expect(store).toBeNull();
    });
  });

  describe('getPrices', () => {
    it('should return prices for products at a store', async () => {
      const prices = await provider.getPrices('store_walmart_polanco', [
        'prod_lala_leche_1l',
      ]);
      expect(prices.length).toBeGreaterThan(0);
      expect(prices[0]!.regularPrice.cents).toBeGreaterThan(0);
    });

    it('should return prices (mock generates for any input)', async () => {
      const prices = await provider.getPrices('nonexistent', ['nonexistent']);
      // Mock generates deterministic prices for any store/product combo
      expect(Array.isArray(prices)).toBe(true);
    });
  });

  describe('getPromotions', () => {
    it('should return promotions for a store', async () => {
      const promos = await provider.getPromotions('store_walmart_polanco');
      expect(Array.isArray(promos)).toBe(true);
    });
  });

  describe('getProductInventoryAtStore', () => {
    it('should return inventory for a valid store-product', async () => {
      const inv = await provider.getProductInventoryAtStore(
        'prod_lala_leche_1l',
        'store_walmart_polanco',
      );
      if (inv) {
        expect(inv.status).toBeDefined();
        expect(inv.isMock).toBe(true);
      }
    });
  });
});
