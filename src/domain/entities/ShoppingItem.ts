/**
 * ShoppingItem entity.
 * Represents a single product that the user wants to buy.
 * Preserves original input while providing normalized data.
 */
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

export interface ShoppingItemProps {
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
  createdAt: Date;
  updatedAt: Date;
}

export class ShoppingItem {
  private props: ShoppingItemProps;

  constructor(props: ShoppingItemProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get listId(): string {
    return this.props.listId;
  }
  get rawInput(): string {
    return this.props.rawInput;
  }
  get normalizedName(): string | null {
    return this.props.normalizedName;
  }
  get category(): string | null {
    return this.props.category;
  }
  get brand(): string | null {
    return this.props.brand;
  }
  get presentation(): string | null {
    return this.props.presentation;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unit(): string {
    return this.props.unit;
  }
  get size(): string | null {
    return this.props.size;
  }
  get barcode(): string | null {
    return this.props.barcode;
  }
  get exactProductId(): string | null {
    return this.props.exactProductId;
  }
  get allowsSubstitution(): boolean {
    return this.props.allowsSubstitution;
  }
  get brandRestrictions(): readonly string[] {
    return Object.freeze([...this.props.brandRestrictions]);
  }
  get substituteProductIds(): readonly string[] {
    return Object.freeze([...this.props.substituteProductIds]);
  }
  get priority(): ItemPriority {
    return this.props.priority;
  }
  get isRequired(): boolean {
    return this.props.isRequired;
  }
  get notes(): string {
    return this.props.notes;
  }
  get matchedProductId(): string | null {
    return this.props.matchedProductId;
  }
  get matchLevel(): MatchLevel {
    return this.props.matchLevel;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Check if this item has a valid product match */
  hasMatch(): boolean {
    return (
      this.props.matchedProductId !== null && this.props.matchLevel !== MatchLevel.INCOMPATIBLE
    );
  }

  /** Check if the match is exact (the exact product requested) */
  isExactMatch(): boolean {
    return this.props.matchLevel === MatchLevel.EXACT_MATCH;
  }

  /** Check if this item can be substituted */
  canSubstitute(): boolean {
    return this.props.allowsSubstitution && this.props.substituteProductIds.length > 0;
  }

  /** Update the product match */
  updateMatch(productId: string, matchLevel: MatchLevel): void {
    this.props.matchedProductId = productId;
    this.props.matchLevel = matchLevel;
    this.props.updatedAt = new Date();
  }

  /** Accept a substitution */
  acceptSubstitution(productId: string): void {
    if (!this.allowsSubstitution) {
      throw new Error('This item does not allow substitutions');
    }
    this.props.matchedProductId = productId;
    this.props.matchLevel = MatchLevel.ACCEPTABLE_SUBSTITUTE;
    this.props.updatedAt = new Date();
  }

  toJSON(): ShoppingItemProps {
    return { ...this.props };
  }
}
