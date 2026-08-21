import {
  ShoppingItem,
  ShoppingItemProps,
  ItemPriority,
  MatchLevel,
} from '../../domain/entities/ShoppingItem';

function createItemProps(overrides: Partial<ShoppingItemProps> = {}): ShoppingItemProps {
  return {
    id: 'item-1',
    listId: 'list-1',
    rawInput: 'Leche Lala 1L',
    normalizedName: 'Leche entera Lala 1L',
    category: 'Lácteos',
    brand: 'Lala',
    presentation: 'Cartón',
    quantity: 2,
    unit: 'pieza',
    size: '1L',
    barcode: '7501020400123',
    exactProductId: 'prod-leche-lala-1l',
    allowsSubstitution: true,
    brandRestrictions: [],
    substituteProductIds: ['prod-leche-almendras-1l'],
    priority: ItemPriority.REQUIRED,
    isRequired: true,
    notes: '',
    matchedProductId: 'prod-leche-lala-1l',
    matchLevel: MatchLevel.EXACT_MATCH,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('ShoppingItem Entity', () => {
  describe('Creation', () => {
    it('creates with all props', () => {
      const props = createItemProps();
      const item = new ShoppingItem(props);

      expect(item.id).toBe('item-1');
      expect(item.listId).toBe('list-1');
      expect(item.rawInput).toBe('Leche Lala 1L');
      expect(item.normalizedName).toBe('Leche entera Lala 1L');
      expect(item.category).toBe('Lácteos');
      expect(item.brand).toBe('Lala');
      expect(item.presentation).toBe('Cartón');
      expect(item.quantity).toBe(2);
      expect(item.unit).toBe('pieza');
      expect(item.size).toBe('1L');
      expect(item.barcode).toBe('7501020400123');
      expect(item.exactProductId).toBe('prod-leche-lala-1l');
      expect(item.allowsSubstitution).toBe(true);
      expect(item.substituteProductIds).toEqual(['prod-leche-almendras-1l']);
      expect(item.priority).toBe(ItemPriority.REQUIRED);
      expect(item.isRequired).toBe(true);
      expect(item.matchedProductId).toBe('prod-leche-lala-1l');
      expect(item.matchLevel).toBe(MatchLevel.EXACT_MATCH);
    });

    it('returns a copy of brandRestrictions (frozen)', () => {
      const original = ['BrandA'];
      const item = new ShoppingItem(createItemProps({ brandRestrictions: original }));
      const refs = item.brandRestrictions;
      expect(refs).toEqual(original);
      expect(refs).not.toBe(original);
    });

    it('returns a copy of substituteProductIds (frozen)', () => {
      const original = ['prod-1', 'prod-2'];
      const item = new ShoppingItem(createItemProps({ substituteProductIds: original }));
      const refs = item.substituteProductIds;
      expect(refs).toEqual(original);
      expect(refs).not.toBe(original);
    });
  });

  describe('Match Detection', () => {
    it('hasMatch returns true when matchedProductId is set and not INCOMPATIBLE', () => {
      const item = new ShoppingItem(
        createItemProps({
          matchedProductId: 'prod-1',
          matchLevel: MatchLevel.EXACT_MATCH,
        }),
      );
      expect(item.hasMatch()).toBe(true);
    });

    it('hasMatch returns true for PRODUCT_VARIANT_MATCH', () => {
      const item = new ShoppingItem(
        createItemProps({
          matchedProductId: 'prod-1',
          matchLevel: MatchLevel.PRODUCT_VARIANT_MATCH,
        }),
      );
      expect(item.hasMatch()).toBe(true);
    });

    it('hasMatch returns true for ACCEPTABLE_SUBSTITUTE', () => {
      const item = new ShoppingItem(
        createItemProps({
          matchedProductId: 'prod-1',
          matchLevel: MatchLevel.ACCEPTABLE_SUBSTITUTE,
        }),
      );
      expect(item.hasMatch()).toBe(true);
    });

    it('hasMatch returns true for POSSIBLE_SUBSTITUTE', () => {
      const item = new ShoppingItem(
        createItemProps({
          matchedProductId: 'prod-1',
          matchLevel: MatchLevel.POSSIBLE_SUBSTITUTE,
        }),
      );
      expect(item.hasMatch()).toBe(true);
    });

    it('hasMatch returns false when matchedProductId is null', () => {
      const item = new ShoppingItem(createItemProps({ matchedProductId: null }));
      expect(item.hasMatch()).toBe(false);
    });

    it('hasMatch returns false when matchLevel is INCOMPATIBLE', () => {
      const item = new ShoppingItem(
        createItemProps({
          matchedProductId: 'prod-1',
          matchLevel: MatchLevel.INCOMPATIBLE,
        }),
      );
      expect(item.hasMatch()).toBe(false);
    });
  });

  describe('Match Level Checks', () => {
    it('isExactMatch returns true for EXACT_MATCH', () => {
      const item = new ShoppingItem(createItemProps({ matchLevel: MatchLevel.EXACT_MATCH }));
      expect(item.isExactMatch()).toBe(true);
    });

    it('isExactMatch returns false for other match levels', () => {
      const levels = [
        MatchLevel.PRODUCT_VARIANT_MATCH,
        MatchLevel.ACCEPTABLE_SUBSTITUTE,
        MatchLevel.POSSIBLE_SUBSTITUTE,
        MatchLevel.INCOMPATIBLE,
      ];
      for (const level of levels) {
        const item = new ShoppingItem(createItemProps({ matchLevel: level }));
        expect(item.isExactMatch()).toBe(false);
      }
    });
  });

  describe('Substitution Logic', () => {
    it('canSubstitute returns true when allowed and substitutes exist', () => {
      const item = new ShoppingItem(
        createItemProps({
          allowsSubstitution: true,
          substituteProductIds: ['prod-sub-1'],
        }),
      );
      expect(item.canSubstitute()).toBe(true);
    });

    it('canSubstitute returns false when substitution not allowed', () => {
      const item = new ShoppingItem(
        createItemProps({
          allowsSubstitution: false,
          substituteProductIds: ['prod-sub-1'],
        }),
      );
      expect(item.canSubstitute()).toBe(false);
    });

    it('canSubstitute returns false when no substitute products', () => {
      const item = new ShoppingItem(
        createItemProps({
          allowsSubstitution: true,
          substituteProductIds: [],
        }),
      );
      expect(item.canSubstitute()).toBe(false);
    });

    it('acceptSubstitution updates match to ACCEPTABLE_SUBSTITUTE', () => {
      const item = new ShoppingItem(createItemProps({ allowsSubstitution: true }));
      item.acceptSubstitution('prod-sub-alt');

      expect(item.matchedProductId).toBe('prod-sub-alt');
      expect(item.matchLevel).toBe(MatchLevel.ACCEPTABLE_SUBSTITUTE);
    });

    it('acceptSubstitution throws when substitution not allowed', () => {
      const item = new ShoppingItem(createItemProps({ allowsSubstitution: false }));
      expect(() => item.acceptSubstitution('prod-sub')).toThrow(
        'This item does not allow substitutions',
      );
    });
  });

  describe('updateMatch', () => {
    it('updates matchedProductId and matchLevel', () => {
      const item = new ShoppingItem(createItemProps());
      const before = item.updatedAt;

      item.updateMatch('prod-new', MatchLevel.PRODUCT_VARIANT_MATCH);

      expect(item.matchedProductId).toBe('prod-new');
      expect(item.matchLevel).toBe(MatchLevel.PRODUCT_VARIANT_MATCH);
      expect(item.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('Priority', () => {
    it('has different priority levels', () => {
      expect(ItemPriority.REQUIRED).toBe('REQUIRED');
      expect(ItemPriority.PREFERRED).toBe('PREFERRED');
      expect(ItemPriority.OPTIONAL).toBe('OPTIONAL');
    });

    it('can change priority via construction', () => {
      const item = new ShoppingItem(
        createItemProps({ priority: ItemPriority.OPTIONAL, isRequired: false }),
      );
      expect(item.priority).toBe(ItemPriority.OPTIONAL);
      expect(item.isRequired).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    it('serializes to JSON', () => {
      const item = new ShoppingItem(createItemProps());
      const json = item.toJSON();
      expect(json.id).toBe('item-1');
      expect(json.matchedProductId).toBe('prod-leche-lala-1l');
      expect(json.quantity).toBe(2);
    });

    it('creates a copy on toJSON (not a reference leak)', () => {
      const item = new ShoppingItem(createItemProps());
      const json = item.toJSON();
      json.id = 'modified';
      expect(item.id).toBe('item-1');
    });
  });
});
