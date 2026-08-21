/**
 * Provider interfaces.
 * All external services must implement these interfaces.
 * The optimization engine depends ONLY on these interfaces, never on implementations.
 */

import { Product } from '../entities/Product';
import { Store } from '../entities/Store';
import { Price, DataConfidence, DataSource } from '../entities/Price';
import { Promotion } from '../entities/Promotion';
import { Inventory, InventoryStatus } from '../entities/Inventory';

// ─── Retail Data Provider ───

export interface RetailDataProvider {
  readonly name: string;
  readonly isMock: boolean;

  searchProducts(query: string, options?: ProductSearchOptions): Promise<ProductSearchResult>;
  getProduct(productId: string): Promise<Product | null>;
  getProductByBarcode(barcode: string): Promise<Product | null>;

  getStoresNearby(latitude: number, longitude: number, radiusKm: number): Promise<Store[]>;
  getStore(storeId: string): Promise<Store | null>;
  getStoreProducts(storeId: string, options?: StoreProductOptions): Promise<StoreProductResult>;

  getPrices(storeId: string, productIds: string[]): Promise<Price[]>;
  getPromotions(storeId: string): Promise<Promotion[]>;
  getInventory(storeProductId: string): Promise<Inventory | null>;
  getProductInventoryAtStore(productId: string, storeId: string): Promise<Inventory | null>;
}

export interface ProductSearchOptions {
  limit?: number;
  offset?: number;
  category?: string;
  brand?: string;
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  source: DataSource;
  confidence: DataConfidence;
}

export interface StoreProductOptions {
  limit?: number;
  offset?: number;
  category?: string;
}

export interface StoreProductResult {
  items: StoreProductInfo[];
  total: number;
}

export interface StoreProductInfo {
  productId: string;
  storeId: string;
  price: Price;
  inventory: Inventory | null;
}

// ─── Map Provider ───

export interface MapProvider {
  readonly name: string;
  readonly isMock: boolean;

  getRoute(origin: LatLng, destination: LatLng, options?: RouteOptions): Promise<RouteResult>;
  getMultiStopRoute(origin: LatLng, stops: LatLng[], options?: RouteOptions): Promise<RouteResult>;
  getDistance(origin: LatLng, destination: LatLng): Promise<DistanceResult>;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteOptions {
  mode: TransportMode;
  avoidTolls?: boolean;
  avoidHighways?: boolean;
}

export type TransportMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  polyline: string | null;
  steps: RouteStep[];
  tollCost: number | null;
  fuelEstimate: number | null;
}

export interface RouteStep {
  instruction: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
}

// ─── Fuel Price Provider ───

export interface FuelPriceProvider {
  readonly name: string;
  readonly isMock: boolean;

  getFuelPrice(
    fuelType: FuelType,
    latitude: number,
    longitude: number,
  ): Promise<FuelPriceResult | null>;
  getNearbyFuelPrices(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<FuelStation[]>;
}

export type FuelType = 'MAGNA' | 'PREMIUM' | 'DIESEL' | 'DIESEL_PREMIUM';

export interface FuelPriceResult {
  fuelType: FuelType;
  pricePerLiter: number;
  currency: string;
  stationName: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  observedAt: Date;
  source: string;
  confidence: DataConfidence;
}

export interface FuelStation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  prices: FuelPriceResult[];
  distanceFromOriginKm: number;
}

// ─── OCR Provider ───

export interface OCRProvider {
  readonly name: string;
  readonly isMock: boolean;

  recognizeText(imageBase64: string): Promise<OCRResult>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

// ─── AI Provider ───

export interface AIProvider {
  readonly name: string;
  readonly isMock: boolean;

  parseShoppingList(rawText: string, language: string): Promise<ParsedShoppingList>;
  normalizeProductName(name: string, language: string): Promise<NormalizedProduct>;
  generateExplanation(context: ExplanationContext): Promise<string>;
}

export interface ParsedShoppingList {
  items: ParsedItem[];
  language: string;
  confidence: number;
}

export interface ParsedItem {
  rawInput: string;
  quantity: number;
  unit: string;
  productName: string;
  brand: string | null;
  presentation: string | null;
  size: string | null;
  category: string | null;
  confidence: number;
  alternatives: string[];
}

export interface NormalizedProduct {
  canonicalName: string;
  brand: string;
  category: string;
  subcategory: string | null;
  confidence: number;
}

export interface ExplanationContext {
  planSummary: string;
  keyDecisions: string[];
  savingsBreakdown: string;
  userPreferences: string;
}

// ─── Notification Provider ───

export interface NotificationProvider {
  readonly name: string;

  sendNotification(userId: string, notification: NotificationPayload): Promise<void>;
  sendPushNotification(userId: string, notification: PushPayload): Promise<void>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushPayload extends NotificationPayload {
  sound?: string;
  badge?: number;
}

// ─── Store Product Helpers ───

export interface StoreProductWithDetails {
  productId: string;
  storeId: string;
  productName: string;
  brand: string;
  regularPrice: number;
  salePrice: number | null;
  inventoryStatus: InventoryStatus;
  dataSource: DataSource;
  confidence: DataConfidence;
  observedAt: Date;
}
