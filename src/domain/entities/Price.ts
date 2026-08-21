import { Money } from '../valueObjects/Money';

/**
 * Price entity. Represents the price of a product at a specific store.
 * Includes metadata about data freshness and source.
 */
export interface PriceProps {
  id: string;
  storeProductId: string;
  currency: string;
  regularPrice: Money;
  salePrice: Money | null;
  unitPrice: Money | null;
  unitOfMeasure: string | null;
  observedAt: Date;
  validFrom: Date | null;
  validUntil: Date | null;
  source: DataSource;
  confidence: DataConfidence;
  membershipRequired: boolean;
  couponRequired: boolean;
  cardRequired: boolean;
  cardBrand: string | null;
  conditions: string[];
}

export class Price {
  readonly id: string;
  readonly storeProductId: string;
  readonly currency: string;
  readonly regularPrice: Money;
  readonly salePrice: Money | null;
  readonly unitPrice: Money | null;
  readonly unitOfMeasure: string | null;
  readonly observedAt: Date;
  readonly validFrom: Date | null;
  readonly validUntil: Date | null;
  readonly source: DataSource;
  readonly confidence: DataConfidence;
  readonly membershipRequired: boolean;
  readonly couponRequired: boolean;
  readonly cardRequired: boolean;
  readonly cardBrand: string | null;
  readonly conditions: readonly string[];

  constructor(props: PriceProps) {
    this.id = props.id;
    this.storeProductId = props.storeProductId;
    this.currency = props.currency;
    this.regularPrice = props.regularPrice;
    this.salePrice = props.salePrice;
    this.unitPrice = props.unitPrice;
    this.unitOfMeasure = props.unitOfMeasure;
    this.observedAt = props.observedAt;
    this.validFrom = props.validFrom;
    this.validUntil = props.validUntil;
    this.source = props.source;
    this.confidence = props.confidence;
    this.membershipRequired = props.membershipRequired;
    this.couponRequired = props.couponRequired;
    this.cardRequired = props.cardRequired;
    this.cardBrand = props.cardBrand;
    this.conditions = Object.freeze([...props.conditions]);
  }

  /** Get the effective price considering promotions and conditions */
  getEffectivePrice(requirements?: PriceRequirements): Money {
    // If sale price exists and user meets requirements
    if (this.salePrice && this.meetsRequirements(requirements)) {
      if (!this.isExpired()) {
        return this.salePrice;
      }
    }
    return this.regularPrice;
  }

  /** Check if user qualifies for promotional pricing */
  meetsRequirements(requirements?: PriceRequirements): boolean {
    if (!requirements)
      return !this.membershipRequired && !this.couponRequired && !this.cardRequired;

    if (this.membershipRequired && !requirements.hasMembership) return false;
    if (this.couponRequired && !requirements.hasCoupon) return false;
    if (this.cardRequired && !requirements.acceptedCardBrands.includes(this.cardBrand ?? ''))
      return false;

    return true;
  }

  isExpired(): boolean {
    if (!this.validUntil) return false;
    return new Date() > this.validUntil;
  }

  isStale(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - this.observedAt.getTime() > maxAgeMs;
  }

  isRecent(maxAgeMs: number = 6 * 60 * 60 * 1000): boolean {
    return Date.now() - this.observedAt.getTime() <= maxAgeMs;
  }
}

export interface PriceRequirements {
  hasMembership: boolean;
  hasCoupon: boolean;
  acceptedCardBrands: string[];
}

export enum DataSource {
  OFFICIAL_API = 'OFFICIAL_API',
  PARTNER_FEED = 'PARTNER_FEED',
  WEB_SCRAPING = 'WEB_SCRAPING',
  USER_REPORTED = 'USER_REPORTED',
  MOCK = 'MOCK',
  ESTIMATED = 'ESTIMATED',
}

export enum DataConfidence {
  CONFIRMED = 'CONFIRMED',
  RECENT = 'RECENT',
  ESTIMATED = 'ESTIMATED',
  STALE = 'STALE',
  UNVERIFIED = 'UNVERIFIED',
}
