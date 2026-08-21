import { Money } from '../valueObjects/Money';

/**
 * ShoppingPlan entity.
 * Represents an optimized shopping strategy for a user's list.
 */
export enum OptimizationMode {
  MAXIMUM_SAVINGS = 'MAXIMUM_SAVINGS',
  BALANCED = 'BALANCED',
  MAXIMUM_CONVENIENCE = 'MAXIMUM_CONVENIENCE',
  CUSTOM = 'CUSTOM',
}

export enum PlanConfidence {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface ShoppingPlanProps {
  id: string;
  userId: string;
  listId: string;
  mode: OptimizationMode;
  totalProductCost: Money;
  totalTransportCost: Money;
  totalTimeMinutes: number;
  totalDistanceKm: number;
  effectiveTotalCost: Money;
  estimatedSavings: Money | null;
  baselineCost: Money | null;
  baselineDescription: string | null;
  confidence: PlanConfidence;
  storeStops: PlanStoreStop[];
  route: PlanRouteStop[];
  assumptions: string[];
  warnings: string[];
  explanations: PlanExplanation[];
  isMock: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface PlanStoreStop {
  storeId: string;
  storeName: string;
  retailerName: string;
  address: string;
  latitude: number;
  longitude: number;
  productCost: Money;
  transportCost: Money;
  items: PlanItem[];
  promotions: PlanPromotionApplied[];
}

export interface PlanItem {
  shoppingItemId: string;
  productId: string;
  productName: string;
  brand: string;
  quantity: number;
  unit: string;
  originalPrice: Money;
  effectivePrice: Money;
  savings: Money;
  matchLevel: string;
  isSubstitution: boolean;
  substituteForProductId: string | null;
}

export interface PlanPromotionApplied {
  promotionId: string;
  name: string;
  type: string;
  savings: Money;
  requiredMembership: boolean;
  requiredCard: boolean;
}

export interface PlanRouteStop {
  order: number;
  type: 'HOME' | 'STORE' | 'FUEL_STATION';
  storeId: string | null;
  storeName: string | null;
  latitude: number;
  longitude: number;
  address: string;
  estimatedArrivalMinutes: number;
  distanceFromPreviousKm: number;
}

export interface PlanExplanation {
  category: 'SAVINGS' | 'CHOICE' | 'WARNING' | 'ASSUMPTION';
  text: string;
  details: string | null;
}

export class ShoppingPlan {
  private props: ShoppingPlanProps;

  constructor(props: ShoppingPlanProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get listId(): string {
    return this.props.listId;
  }
  get mode(): OptimizationMode {
    return this.props.mode;
  }
  get totalProductCost(): Money {
    return this.props.totalProductCost;
  }
  get totalTransportCost(): Money {
    return this.props.totalTransportCost;
  }
  get totalTimeMinutes(): number {
    return this.props.totalTimeMinutes;
  }
  get totalDistanceKm(): number {
    return this.props.totalDistanceKm;
  }
  get effectiveTotalCost(): Money {
    return this.props.effectiveTotalCost;
  }
  get estimatedSavings(): Money | null {
    return this.props.estimatedSavings;
  }
  get baselineCost(): Money | null {
    return this.props.baselineCost;
  }
  get baselineDescription(): string | null {
    return this.props.baselineDescription;
  }
  get confidence(): PlanConfidence {
    return this.props.confidence;
  }
  get storeStops(): readonly PlanStoreStop[] {
    return [...this.props.storeStops];
  }
  get route(): readonly PlanRouteStop[] {
    return [...this.props.route];
  }
  get assumptions(): readonly string[] {
    return [...this.props.assumptions];
  }
  get warnings(): readonly string[] {
    return [...this.props.warnings];
  }
  get explanations(): readonly PlanExplanation[] {
    return [...this.props.explanations];
  }
  get isMock(): boolean {
    return this.props.isMock;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get numberOfStores(): number {
    return this.props.storeStops.length;
  }

  get totalItems(): number {
    return this.props.storeStops.reduce((sum, stop) => sum + stop.items.length, 0);
  }

  get totalSavings(): Money {
    if (!this.props.estimatedSavings) return Money.zero();
    return this.props.estimatedSavings;
  }

  hasWarnings(): boolean {
    return this.props.warnings.length > 0;
  }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  toJSON(): ShoppingPlanProps {
    return { ...this.props };
  }
}
