export enum ShoppingListStatus {
  DRAFT = 'DRAFT',
  PARSED = 'PARSED',
  REVIEWED = 'REVIEWED',
  OPTIMIZED = 'OPTIMIZED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface ShoppingListRecord {
  id: string;
  userId: string;
  title: string;
  rawInput: string;
  status: ShoppingListStatus;
  itemCount: number;
  parsedItemCount: number;
  lastOptimizedAt: string | null;
  isRecurring: boolean;
  recurringInterval: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItemRecord {
  id: string;
  listId: string;
  rawInput: string;
  normalizedName: string | null;
  category: string | null;
  brand: string | null;
  presentation: string | null;
  quantity: number;
  unit: string;
  size: string | null;
  barcode: string | null;
  exactProductId: string | null;
  allowsSubstitution: boolean;
  brandRestrictions: string[];
  substituteProductIds: string[];
  priority: ItemPriority;
  isRequired: boolean;
  notes: string;
  matchedProductId: string | null;
  matchLevel: MatchLevel;
  createdAt: string;
  updatedAt: string;
}

export enum ItemPriority {
  REQUIRED = 'REQUIRED',
  PREFERRED = 'PREFERRED',
  OPTIONAL = 'OPTIONAL',
}

export enum MatchLevel {
  EXACT_MATCH = 'EXACT_MATCH',
  PRODUCT_VARIANT_MATCH = 'PRODUCT_VARIANT_MATCH',
  ACCEPTABLE_SUBSTITUTE = 'ACCEPTABLE_SUBSTITUTE',
  POSSIBLE_SUBSTITUTE = 'POSSIBLE_SUBSTITUTE',
  INCOMPATIBLE = 'INCOMPATIBLE',
}

export enum StoreService {
  PHARMACY = 'PHARMACY',
  BAKERY = 'BAKERY',
  DELI = 'DELI',
  BUTCHER = 'BUTCHER',
  ATM = 'ATM',
  PARKING = 'PARKING',
  DRIVE_THROUGH = 'DRIVE_THROUGH',
  FUEL_STATION = 'FUEL_STATION',
}

export interface StoreHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface StoreRecord {
  id: string;
  retailerId: string;
  retailerName: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  hours: StoreHours[];
  services: StoreService[];
  isMock: boolean;
  source: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export enum OptimizationMode {
  MAXIMUM_SAVINGS = 'MAXIMUM_SAVINGS',
  BALANCED = 'BALANCED',
  MAXIMUM_CONVENIENCE = 'MAXIMUM_CONVENIENCE',
}

export interface OptimizeRequest {
  listId: string;
  userLocation: { latitude: number; longitude: number };
  mode: OptimizationMode;
  constraints?: OptimizationConstraints;
}

export interface OptimizationConstraints {
  maxBudget: number | null;
  maxTimeMinutes: number | null;
  maxDistanceKm: number | null;
  maxStores: number;
  allowedStoreIds: string[];
  excludedStoreIds: string[];
}

export interface OptimizeResult {
  plans: unknown[];
  unfulfilledItems: unknown[];
  warnings: string[];
  isMock: boolean;
}

// ─── Mission Types ───

export enum MissionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MissionItemStatus {
  PENDING = 'PENDING',
  FOUND = 'FOUND',
  NOT_FOUND = 'NOT_FOUND',
  SUBSTITUTED = 'SUBSTITUTED',
  SKIPPED = 'SKIPPED',
}

export interface MissionItemRecord {
  id: string;
  missionId: string;
  storeId: string;
  shoppingItemId: string;
  productName: string;
  quantity: number;
  unit: string;
  expectedPriceCents: number;
  status: MissionItemStatus;
  substitutionProductId: string | null;
  actualPriceCents: number | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MissionRecord {
  id: string;
  userId: string;
  planId: string;
  listId: string;
  status: MissionStatus;
  totalExpectedCostCents: number;
  totalActualCostCents: number | null;
  storeCount: number;
  storesVisited: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── History Types ───

export interface PurchaseRecord {
  id: string;
  userId: string;
  missionId: string;
  storeId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  priceCents: number;
  currency: string;
  purchasedAt: string;
}

export interface SavingsRecord {
  id: string;
  userId: string;
  planId: string;
  missionId: string | null;
  baselineCostCents: number;
  optimizedCostCents: number;
  transportCostCents: number;
  netSavingsCents: number;
  savedAt: string;
}

// ─── Vehicle Types ───

export enum FuelType {
  GASOLINE = 'GASOLINE',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  LPG = 'LPG',
}

export interface VehicleRecord {
  id: string;
  userId: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  fuelType: FuelType;
  customEfficiencyKmPerLiter: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Preferences Types ───

export interface UserPreferencesRecord {
  id: string;
  userId: string;
  defaultOptimizationMode: string;
  maxBudgetCents: number | null;
  maxTravelDistanceKm: number | null;
  maxTravelTimeMinutes: number | null;
  preferredStoreIds: string[];
  excludedStoreIds: string[];
  preferredBrands: string[];
  dietaryRestrictions: string[];
  currency: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}
