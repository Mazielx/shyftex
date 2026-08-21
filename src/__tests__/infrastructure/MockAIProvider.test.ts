/**
 * Tests for MockAIProvider.
 * Verifies Spanish NLP parsing, brand detection, category assignment,
 * quantity/unit extraction, and normalization.
 */

import { MockAIProvider } from '../../infrastructure/providers/MockAIProvider';

describe('MockAIProvider', () => {
  let provider: MockAIProvider;

  beforeEach(() => {
    provider = new MockAIProvider();
  });

  describe('metadata', () => {
    it('should be marked as mock', () => {
      expect(provider.isMock).toBe(true);
      expect(provider.name).toBe('MockAIProvider');
    });
  });

  describe('parseShoppingList', () => {
    it('should parse a simple comma-separated list', async () => {
      const result = await provider.parseShoppingList('leche, pan, huevos', 'es');
      expect(result.items).toHaveLength(3);
      expect(result.language).toBe('es');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should parse a newline-separated list', async () => {
      const result = await provider.parseShoppingList('leche\npan\nhuevos', 'es');
      expect(result.items).toHaveLength(3);
    });

    it('should parse mixed delimiters', async () => {
      const result = await provider.parseShoppingList('leche; pan, huevos\ncerveza', 'es');
      expect(result.items).toHaveLength(4);
    });

    it('should handle empty input', async () => {
      const result = await provider.parseShoppingList('', 'es');
      expect(result.items).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should extract quantity and unit', async () => {
      const result = await provider.parseShoppingList('2 litros de leche', 'es');
      expect(result.items).toHaveLength(1);
      const item = result.items[0]!;
      expect(item.quantity).toBe(2);
      expect(item.unit).toBe('litro');
    });

    it('should extract brand from text', async () => {
      const result = await provider.parseShoppingList('leche Lala', 'es');
      const item = result.items[0]!;
      expect(item.brand).toBe('Lala');
    });

    it('should detect category', async () => {
      const result = await provider.parseShoppingList('detergente Ariel', 'es');
      const item = result.items[0]!;
      expect(item.category).toBe('Cleaning');
    });

    it('should detect size', async () => {
      const result = await provider.parseShoppingList('2 litros de agua', 'es');
      const item = result.items[0]!;
      expect(item.size).toBeTruthy();
    });

    it('should detect presentation', async () => {
      const result = await provider.parseShoppingList('papel familiar', 'es');
      const item = result.items[0]!;
      expect(item.presentation).toBe('familiar');
    });

    it('should produce alternatives for branded products', async () => {
      const result = await provider.parseShoppingList('Lala leche', 'es');
      const item = result.items[0]!;
      expect(item.alternatives).toBeInstanceOf(Array);
      expect(item.alternatives.length).toBeGreaterThan(0);
    });

    it('should handle single item', async () => {
      const result = await provider.parseShoppingList('arroz', 'es');
      expect(result.items).toHaveLength(1);
    });

    it('should handle Mexican product names correctly', async () => {
      const result = await provider.parseShoppingList(
        '1 kg de frijol, 2 litros de leche Lala, pan Bimbo, jabón Dove',
        'es',
      );
      expect(result.items).toHaveLength(4);

      const brands = result.items.map((i) => i.brand).filter(Boolean);
      expect(brands).toContain('Lala');
      expect(brands).toContain('Bimbo');
    });

    it('should assign confidence values between 0.1 and 1.0', async () => {
      const result = await provider.parseShoppingList('leche, arroz, jabón', 'es');
      for (const item of result.items) {
        expect(item.confidence).toBeGreaterThanOrEqual(0.1);
        expect(item.confidence).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('normalizeProductName', () => {
    it('should extract brand from product name', async () => {
      const result = await provider.normalizeProductName('Leche Lala 2%', 'es');
      expect(result.brand).toBe('Lala');
    });

    it('should extract category', async () => {
      const result = await provider.normalizeProductName('Detergente líquido', 'es');
      expect(result.category).toBe('Cleaning');
    });

    it('should produce a canonical name', async () => {
      const result = await provider.normalizeProductName('Arroz integral 1kg', 'es');
      expect(result.canonicalName).toBeTruthy();
      expect(typeof result.canonicalName).toBe('string');
    });

    it('should have reasonable confidence', async () => {
      const result = await provider.normalizeProductName('Papas Sabritas', 'es');
      expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    });
  });

  describe('generateExplanation', () => {
    it('should generate explanation from context', async () => {
      const explanation = await provider.generateExplanation({
        planSummary: 'Shopping at 2 stores saves $150 MXN',
        keyDecisions: ['Chose Walmart for dairy', 'Chose Soriana for cleaning'],
        savingsBreakdown: 'Total savings: $150 MXN',
        userPreferences: '',
      });

      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(0);
      expect(explanation).toContain('Shopping at 2 stores');
    });

    it('should handle empty context', async () => {
      const explanation = await provider.generateExplanation({
        planSummary: '',
        keyDecisions: [],
        savingsBreakdown: '',
        userPreferences: '',
      });
      expect(typeof explanation).toBe('string');
    });
  });
});
