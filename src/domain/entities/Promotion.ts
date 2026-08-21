import { Money } from '../valueObjects/Money';

/**
 * Promotion entity.
 * Represents a promotional offer at a store.
 */
export enum PromotionType {
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_DISCOUNT = 'FIXED_DISCOUNT',
  TWO_X_ONE = 'TWO_X_ONE',
  THREE_X_TWO = 'THREE_X_TWO',
  SECOND_UNIT_DISCOUNT = 'SECOND_UNIT_DISCOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  BUNDLE = 'BUNDLE',
  VOLUME_DISCOUNT = 'VOLUME_DISCOUNT',
  LOYALTY_PRICING = 'LOYALTY_PRICING',
  COUPON = 'COUPON',
  CARD_PROMOTION = 'CARD_PROMOTION',
  MEMBERSHIP_PRICE = 'MEMBERSHIP_PRICE',
}

export interface PromotionProps {
  id: string;
  storeId: string;
  retailerId: string;
  type: PromotionType;
  name: string;
  description: string;
  discountPercentage: number | null;
  discountAmount: Money | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  maxDiscount: Money | null;
  minimumPurchase: Money | null;
  applicableProductIds: string[];
  applicableCategories: string[];
  cardRequired: boolean;
  cardBrand: string | null;
  membershipRequired: boolean;
  couponCode: string | null;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usageCount: number;
  isMock: boolean;
  source: string;
}

export class Promotion {
  private props: PromotionProps;

  constructor(props: PromotionProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get storeId(): string {
    return this.props.storeId;
  }
  get retailerId(): string {
    return this.props.retailerId;
  }
  get type(): PromotionType {
    return this.props.type;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get applicableProductIds(): readonly string[] {
    return [...this.props.applicableProductIds];
  }
  get applicableCategories(): readonly string[] {
    return [...this.props.applicableCategories];
  }
  get cardRequired(): boolean {
    return this.props.cardRequired;
  }
  get cardBrand(): string | null {
    return this.props.cardBrand;
  }
  get membershipRequired(): boolean {
    return this.props.membershipRequired;
  }
  get couponCode(): string | null {
    return this.props.couponCode;
  }
  get discountPercentage(): number | null {
    return this.props.discountPercentage;
  }
  get discountAmount(): Money | null {
    return this.props.discountAmount;
  }
  get buyQuantity(): number | null {
    return this.props.buyQuantity;
  }
  get getQuantity(): number | null {
    return this.props.getQuantity;
  }
  get maxDiscount(): Money | null {
    return this.props.maxDiscount;
  }
  get minimumPurchase(): Money | null {
    return this.props.minimumPurchase;
  }
  get validFrom(): Date {
    return this.props.validFrom;
  }
  get validUntil(): Date {
    return this.props.validUntil;
  }
  get usageLimit(): number | null {
    return this.props.usageLimit;
  }
  get usageCount(): number {
    return this.props.usageCount;
  }
  get isMock(): boolean {
    return this.props.isMock;
  }
  get source(): string {
    return this.props.source;
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.props.validFrom && now <= this.props.validUntil;
  }

  isExpired(): boolean {
    return new Date() > this.props.validUntil;
  }

  /** Check if a product ID is applicable for this promotion */
  isApplicableToProduct(productId: string, productCategory: string): boolean {
    if (!this.isActive()) return false;

    if (this.props.applicableProductIds.length > 0) {
      if (!this.props.applicableProductIds.includes(productId)) return false;
    }

    if (this.props.applicableCategories.length > 0) {
      if (!this.props.applicableCategories.includes(productCategory)) return false;
    }

    return true;
  }

  /** Check if user requirements are met */
  meetsUserRequirements(requirements: {
    hasMembership: boolean;
    hasCoupon: boolean;
    cardBrand: string | null;
  }): boolean {
    if (this.props.membershipRequired && !requirements.hasMembership) return false;
    if (this.props.couponCode && !requirements.hasCoupon) return false;
    if (this.props.cardRequired) {
      if (!requirements.cardBrand) return false;
      if (this.props.cardBrand && requirements.cardBrand !== this.props.cardBrand) return false;
    }
    return true;
  }

  toJSON(): PromotionProps {
    return { ...this.props };
  }
}
