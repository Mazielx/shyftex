/**
 * Mock Retail Data Provider.
 *
 * Provides realistic mock data for development and demo mode.
 * All data is clearly marked as MOCK.
 *
 * DO NOT present this data as real in production.
 */

import {
  RetailDataProvider,
  ProductSearchOptions,
  ProductSearchResult,
  StoreProductOptions,
  StoreProductResult,
  StoreProductInfo,
} from '../../domain/interfaces/providers';
import { Product, ProductProps } from '../../domain/entities/Product';
import { Store, StoreProps, StoreService } from '../../domain/entities/Store';
import { Price, PriceProps, DataSource, DataConfidence } from '../../domain/entities/Price';
import { Promotion, PromotionProps, PromotionType } from '../../domain/entities/Promotion';
import { Inventory, InventoryProps, InventoryStatus } from '../../domain/entities/Inventory';
import { Money } from '../../domain/valueObjects/Money';

// ─── Mock Product Database ───

const MOCK_PRODUCTS: ProductProps[] = [
  // Dairy
  {
    id: 'prod_lala_leche_1l',
    name: 'Leche Lala Entera 1L',
    canonicalName: 'leche entera',
    brand: 'Lala',
    category: 'Dairy',
    subcategory: 'Milk',
    barcodes: ['7501020535014'],
    description: 'Leche entera Lala 1 litro',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '1L', quantity: 1, unit: 'litro', barcode: '7501020535014' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_lala_leche_deslact_1l',
    name: 'Leche Lala Deslactosada 1L',
    canonicalName: 'leche deslactosada',
    brand: 'Lala',
    category: 'Dairy',
    subcategory: 'Milk',
    barcodes: ['7501020535021'],
    description: 'Leche deslactosada Lala 1 litro',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '1L', quantity: 1, unit: 'litro', barcode: '7501020535021' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_lala_yogurt_griego',
    name: 'Yogurt Griego Lala 170g',
    canonicalName: 'yogurt griego',
    brand: 'Lala',
    category: 'Dairy',
    subcategory: 'Yogurt',
    barcodes: ['7501020536014'],
    description: 'Yogurt griego Lala 170g',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '170g', quantity: 170, unit: 'gramo', barcode: '7501020536014' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Eggs
  {
    id: 'prod_kuik_huevos_18',
    name: 'Huevos Kuik Pasteurizados 18 pzs',
    canonicalName: 'huevos',
    brand: 'Kuik',
    category: 'Dairy',
    subcategory: 'Eggs',
    barcodes: ['7501069730014'],
    description: 'Huevos pasteurizados Kuik 18 piezas',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [
      { label: '12 pzs', quantity: 12, unit: 'pieza', barcode: '7501069730012' },
      { label: '18 pzs', quantity: 18, unit: 'pieza', barcode: '7501069730014' },
    ],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Rice
  {
    id: 'prod_montalvo_arroz_1k',
    name: 'Arroz Montalvo 1kg',
    canonicalName: 'arroz',
    brand: 'Montalvo',
    category: 'Grains',
    subcategory: 'Rice',
    barcodes: ['7501011110013'],
    description: 'Arroz grains Montalvo 1kg',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '1kg', quantity: 1, unit: 'kilogramo', barcode: '7501011110013' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Cereal
  {
    id: 'prod_kellogg_zucaritas_375g',
    name: "Cereal Kellogg's Zucaritas 375g",
    canonicalName: 'cereal zucaritas',
    brand: "Kellogg's",
    category: 'Breakfast',
    subcategory: 'Cereal',
    barcodes: ['7501030438014'],
    description: "Cereal Zucaritas Kellogg's 375g",
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '375g', quantity: 375, unit: 'gramo', barcode: '7501030438014' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Chicken
  {
    id: 'prod_bachoco_pechuga',
    name: 'Pechuga de Pollo Bachoco',
    canonicalName: 'pechuga de pollo',
    brand: 'Bachoco',
    category: 'Meat',
    subcategory: 'Chicken',
    barcodes: ['7501065010011'],
    description: 'Pechuga de pollo entera Bachoco',
    imageUrl: null,
    defaultUnit: 'kilogramo',
    typicalSizes: [{ label: '1 kg', quantity: 1, unit: 'kilogramo', barcode: '7501065010011' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Cleaning
  {
    id: 'prod_ariel_liquid_1l',
    name: 'Detergente Ariel Líquido 1L',
    canonicalName: 'detergente liquido',
    brand: 'Ariel',
    category: 'Cleaning',
    subcategory: 'Detergent',
    barcodes: ['7501020881016'],
    description: 'Detergente líquido Ariel para ropa 1 litro',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '1L', quantity: 1, unit: 'litro', barcode: '7501020881016' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_fabuloso_1l',
    name: 'Fabuloso Concentrado 1L',
    canonicalName: 'fabuloso',
    brand: 'Fabuloso',
    category: 'Cleaning',
    subcategory: 'Floor Cleaner',
    barcodes: ['7501020882013'],
    description: 'Fabuloso concentrado multiusos 1 litro',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '1L', quantity: 1, unit: 'litro', barcode: '7501020882013' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Paper
  {
    id: 'prod_regio_roll_12',
    name: 'Papel Regio Roll 12 rollos',
    canonicalName: 'papel Regio',
    brand: 'Regio',
    category: 'Paper',
    subcategory: 'Toilet Paper',
    barcodes: ['7501020883010'],
    description: 'Papel higiénico Regio 12 rollos',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '12 rollos', quantity: 12, unit: 'pieza', barcode: '7501020883010' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Bread
  {
    id: 'prod_bimbo_pan_blanco',
    name: 'Pan Blanco Bimbo Grande',
    canonicalName: 'pan blanco',
    brand: 'Bimbo',
    category: 'Bakery',
    subcategory: 'Bread',
    barcodes: ['7501008100011'],
    description: 'Pan blanco Bimbo grande',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: 'grande', quantity: 1, unit: 'pieza', barcode: '7501008100011' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Beverages
  {
    id: 'prod_coca_cola_600ml',
    name: 'Coca-Cola 600ml',
    canonicalName: 'coca cola',
    brand: 'Coca-Cola',
    category: 'Beverages',
    subcategory: 'Soda',
    barcodes: ['7501020884019'],
    description: 'Refresco Coca-Cola 600ml',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [
      { label: '355ml', quantity: 355, unit: 'mililitro', barcode: '7501020884018' },
      { label: '600ml', quantity: 600, unit: 'mililitro', barcode: '7501020884019' },
      { label: '2L', quantity: 2, unit: 'litro', barcode: '7501020884020' },
    ],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'prod_agua_ciel_1l',
    name: 'Agua Ciel 1L',
    canonicalName: 'agua embotellada',
    brand: 'Ciel',
    category: 'Beverages',
    subcategory: 'Water',
    barcodes: ['7501020885016'],
    description: 'Agua purificada Ciel 1 litro',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [
      { label: '600ml', quantity: 600, unit: 'mililitro', barcode: '7501020885015' },
      { label: '1L', quantity: 1, unit: 'litro', barcode: '7501020885016' },
      { label: '1.5L', quantity: 1.5, unit: 'litro', barcode: '7501020885017' },
    ],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Snacks
  {
    id: 'prod_sabritas_original',
    name: 'Sabritas Original 45g',
    canonicalName: 'papas fritas',
    brand: 'Sabritas',
    category: 'Snacks',
    subcategory: 'Chips',
    barcodes: ['7501020886013'],
    description: 'Papas fritas Sabritas Original 45g',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '45g', quantity: 45, unit: 'gramo', barcode: '7501020886013' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Personal Care
  {
    id: 'prod_pantene_shampoo_400ml',
    name: 'Shampoo Pantene Pro-V 400ml',
    canonicalName: 'shampoo',
    brand: 'Pantene',
    category: 'PersonalCare',
    subcategory: 'Shampoo',
    barcodes: ['7501020887010'],
    description: 'Shampoo Pantene Pro-V 400ml',
    imageUrl: null,
    defaultUnit: 'pieza',
    typicalSizes: [{ label: '400ml', quantity: 400, unit: 'mililitro', barcode: '7501020887010' }],
    isMock: true,
    source: 'MOCK',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ─── Mock Stores ───

const MOCK_STORES: StoreProps[] = [
  {
    id: 'store_walmart_polanco',
    retailerId: 'ret_walmart',
    retailerName: 'Walmart',
    name: 'Walmart Polanco',
    address: 'Av. Horacio 1805',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '11560',
    latitude: 19.4363,
    longitude: -99.1965,
    phone: '5555555555',
    hours: [
      { dayOfWeek: 0, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 1, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 2, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 3, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 4, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 5, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '07:00', closeTime: '23:00', isClosed: false },
    ],
    services: [StoreService.BAKERY, StoreService.DELI, StoreService.BUTCHER, StoreService.PARKING],
    isMock: true,
    source: 'MOCK',
  },
  {
    id: 'store_soriana_condesa',
    retailerId: 'ret_soriana',
    retailerName: 'Soriana',
    name: 'Soriana La Condesa',
    address: 'Av. Tamaulipas 170',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '11570',
    latitude: 19.4194,
    longitude: -99.1632,
    phone: '5555555556',
    hours: [
      { dayOfWeek: 0, openTime: '08:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 1, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 2, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 3, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 4, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 5, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '07:00', closeTime: '23:00', isClosed: false },
    ],
    services: [StoreService.BAKERY, StoreService.PHARMACY, StoreService.PARKING],
    isMock: true,
    source: 'MOCK',
  },
  {
    id: 'store_bodega_roma',
    retailerId: 'ret_bodega',
    retailerName: 'Bodega Aurrera',
    name: 'Bodega Aurrera Roma',
    address: 'Calle Orizaba 180',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '06700',
    latitude: 19.4161,
    longitude: -99.1536,
    phone: '5555555557',
    hours: [
      { dayOfWeek: 0, openTime: '08:00', closeTime: '21:00', isClosed: false },
      { dayOfWeek: 1, openTime: '07:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 2, openTime: '07:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 3, openTime: '07:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 4, openTime: '07:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 5, openTime: '07:00', closeTime: '22:00', isClosed: false },
      { dayOfWeek: 6, openTime: '07:00', closeTime: '22:00', isClosed: false },
    ],
    services: [StoreService.BAKERY],
    isMock: true,
    source: 'MOCK',
  },
  {
    id: 'store_costco_santa_fe',
    retailerId: 'ret_costco',
    retailerName: 'Costco',
    name: 'Costco Santa Fe',
    address: 'Periférico Sur 5495',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '05109',
    latitude: 19.3626,
    longitude: -99.2613,
    phone: '5555555558',
    hours: [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '20:30', isClosed: false },
      { dayOfWeek: 1, openTime: '10:30', closeTime: '20:30', isClosed: false },
      { dayOfWeek: 2, openTime: '10:30', closeTime: '20:30', isClosed: false },
      { dayOfWeek: 3, openTime: '10:30', closeTime: '20:30', isClosed: false },
      { dayOfWeek: 4, openTime: '10:30', closeTime: '20:30', isClosed: false },
      { dayOfWeek: 5, openTime: '10:30', closeTime: '20:30', isClosed: false },
      { dayOfWeek: 6, openTime: '09:00', closeTime: '20:30', isClosed: false },
    ],
    services: [
      StoreService.BAKERY,
      StoreService.DELI,
      StoreService.BUTCHER,
      StoreService.PHARMACY,
      StoreService.PARKING,
      StoreService.FUEL_STATION,
    ],
    isMock: true,
    source: 'MOCK',
  },
  {
    id: 'store_chedraui_polanco',
    retailerId: 'ret_chedraui',
    retailerName: 'Chedraui',
    name: 'Chedraui Polanco',
    address: 'Av. Patriotismo 601',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '11550',
    latitude: 19.4263,
    longitude: -99.1914,
    phone: '5555555559',
    hours: [
      { dayOfWeek: 0, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 1, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 2, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 3, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 4, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 5, openTime: '07:00', closeTime: '23:00', isClosed: false },
      { dayOfWeek: 6, openTime: '07:00', closeTime: '23:00', isClosed: false },
    ],
    services: [StoreService.BAKERY, StoreService.DELI, StoreService.PARKING],
    isMock: true,
    source: 'MOCK',
  },
];

// ─── Price Generator ───

function generatePrices(storeId: string, productId: string): Price[] {
  // Deterministic pseudo-random based on store+product IDs
  const seed = (storeId + productId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const basePrice = 15 + (seed % 85); // $15-$100 MXN range

  const regularPrice = Money.fromDecimal(basePrice);
  const hasSale = seed % 3 === 0;
  const salePrice = hasSale ? Money.fromDecimal(basePrice * 0.85) : null;

  return [
    new Price({
      id: `price_${storeId}_${productId}_1`,
      storeProductId: `${storeId}:${productId}`,
      currency: 'MXN',
      regularPrice,
      salePrice,
      unitPrice: null,
      unitOfMeasure: null,
      observedAt: new Date(Date.now() - (seed % 12) * 60 * 60 * 1000), // 0-12 hours old
      validFrom: null,
      validUntil: hasSale ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
      source: DataSource.MOCK,
      confidence: DataConfidence.RECENT,
      membershipRequired: seed % 5 === 0,
      couponRequired: false,
      cardRequired: seed % 4 === 0,
      cardBrand: seed % 4 === 0 ? ['Citibanamex', 'Santander', 'BBVA'][seed % 3] : null,
      conditions: hasSale ? ['Promoción temporal'] : [],
    }),
  ];
}

// ─── Promotion Generator ───

function generatePromotions(storeId: string): Promotion[] {
  const promotions: PromotionProps[] = [
    {
      id: `promo_${storeId}_2x1_dairy`,
      storeId,
      retailerId: '',
      type: PromotionType.TWO_X_ONE,
      name: '2x1 en productos lácteos seleccionados',
      description: 'Lleva 2 y paga 1 en lácteos seleccionados',
      discountPercentage: null,
      discountAmount: null,
      buyQuantity: 2,
      getQuantity: 1,
      maxDiscount: Money.fromDecimal(50),
      minimumPurchase: null,
      applicableProductIds: ['prod_lala_leche_1l', 'prod_lala_leche_deslact_1l'],
      applicableCategories: ['Dairy'],
      cardRequired: false,
      cardBrand: null,
      membershipRequired: false,
      couponCode: null,
      validFrom: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      usageLimit: null,
      usageCount: 0,
      isMock: true,
      source: 'MOCK',
    },
    {
      id: `promo_${storeId}_10pct_cleaning`,
      storeId,
      retailerId: '',
      type: PromotionType.PERCENTAGE_DISCOUNT,
      name: '10% descuento en productos de limpieza',
      description: '10% de descuento en toda la línea de limpieza',
      discountPercentage: 10,
      discountAmount: null,
      buyQuantity: null,
      getQuantity: null,
      maxDiscount: null,
      minimumPurchase: Money.fromDecimal(100),
      applicableProductIds: [],
      applicableCategories: ['Cleaning'],
      cardRequired: true,
      cardBrand: 'Citibanamex',
      membershipRequired: false,
      couponCode: null,
      validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      usageLimit: null,
      usageCount: 0,
      isMock: true,
      source: 'MOCK',
    },
  ];

  return promotions.map((p) => new Promotion(p));
}

// ─── Inventory Generator ───

function generateInventory(storeId: string, productId: string): Inventory {
  const seed = (storeId + productId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const statuses = [
    InventoryStatus.IN_STOCK,
    InventoryStatus.IN_STOCK,
    InventoryStatus.IN_STOCK,
    InventoryStatus.LOW_STOCK,
    InventoryStatus.UNKNOWN,
  ];

  return new Inventory({
    id: `inv_${storeId}_${productId}`,
    storeProductId: `${storeId}:${productId}`,
    status: statuses[seed % statuses.length],
    quantityAvailable: seed % 5 === 0 ? null : 5 + (seed % 50),
    lastChecked: new Date(Date.now() - (seed % 6) * 60 * 60 * 1000),
    source: 'MOCK',
    confidence: 'CONFIRMED',
    isMock: true,
  });
}

// ─── Provider Implementation ───

export class MockRetailDataProvider implements RetailDataProvider {
  readonly name = 'MockRetailDataProvider';
  readonly isMock = true;

  private products: Map<string, Product> = new Map();
  private stores: Map<string, Store> = new Map();

  constructor() {
    // Initialize products
    for (const props of MOCK_PRODUCTS) {
      this.products.set(props.id, new Product(props));
    }
    // Initialize stores
    for (const props of MOCK_STORES) {
      this.stores.set(props.id, new Store(props));
    }
  }

  async searchProducts(
    query: string,
    options?: ProductSearchOptions,
  ): Promise<ProductSearchResult> {
    const normalizedQuery = query.toLowerCase().trim();
    const results: Product[] = [];

    for (const product of this.products.values()) {
      if (
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.canonicalName.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery)
      ) {
        results.push(product);
      }
    }

    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    return {
      products: results.slice(offset, offset + limit),
      total: results.length,
      source: DataSource.MOCK,
      confidence: DataConfidence.RECENT,
    };
  }

  async getProduct(productId: string): Promise<Product | null> {
    return this.products.get(productId) ?? null;
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    for (const product of this.products.values()) {
      if (product.hasBarcode(barcode)) return product;
    }
    return null;
  }

  async getStoresNearby(latitude: number, longitude: number, radiusKm: number): Promise<Store[]> {
    const stores: Store[] = [];
    for (const store of this.stores.values()) {
      const distance = store.distanceTo(latitude, longitude);
      if (distance <= radiusKm) {
        stores.push(store);
      }
    }
    return stores.sort((a, b) => {
      const distA = a.distanceTo(latitude, longitude);
      const distB = b.distanceTo(latitude, longitude);
      return distA - distB;
    });
  }

  async getStore(storeId: string): Promise<Store | null> {
    return this.stores.get(storeId) ?? null;
  }

  async getStoreProducts(
    storeId: string,
    options?: StoreProductOptions,
  ): Promise<StoreProductResult> {
    const items: StoreProductInfo[] = [];
    for (const product of this.products.values()) {
      const prices = generatePrices(storeId, product.id);
      const inventory = generateInventory(storeId, product.id);
      items.push({
        productId: product.id,
        storeId,
        price: prices[0],
        inventory,
      });
    }

    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    return {
      items: items.slice(offset, offset + limit),
      total: items.length,
    };
  }

  async getPrices(storeId: string, productIds: string[]): Promise<Price[]> {
    const prices: Price[] = [];
    for (const productId of productIds) {
      prices.push(...generatePrices(storeId, productId));
    }
    return prices;
  }

  async getPromotions(storeId: string): Promise<Promotion[]> {
    return generatePromotions(storeId);
  }

  async getInventory(storeProductId: string): Promise<Inventory | null> {
    const [storeId, productId] = storeProductId.split(':');
    if (!storeId || !productId) return null;
    return generateInventory(storeId, productId);
  }

  async getProductInventoryAtStore(productId: string, storeId: string): Promise<Inventory | null> {
    return generateInventory(storeId, productId);
  }

  /** Get all products (for debugging) */
  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  /** Get all stores (for debugging) */
  getAllStores(): Store[] {
    return Array.from(this.stores.values());
  }
}
