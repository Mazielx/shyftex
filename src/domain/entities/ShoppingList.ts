/**
 * ShoppingList entity.
 * Represents a user's shopping list with parsed items.
 */
export enum ShoppingListStatus {
  DRAFT = 'DRAFT',
  PARSED = 'PARSED',
  REVIEWED = 'REVIEWED',
  OPTIMIZED = 'OPTIMIZED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface ShoppingListProps {
  id: string;
  userId: string;
  title: string;
  rawInput: string;
  status: ShoppingListStatus;
  itemCount: number;
  parsedItemCount: number;
  lastOptimizedAt: Date | null;
  isRecurring: boolean;
  recurringInterval: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ShoppingList {
  private props: ShoppingListProps;

  constructor(props: ShoppingListProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get title(): string {
    return this.props.title;
  }
  get rawInput(): string {
    return this.props.rawInput;
  }
  get status(): ShoppingListStatus {
    return this.props.status;
  }
  get itemCount(): number {
    return this.props.itemCount;
  }
  get parsedItemCount(): number {
    return this.props.parsedItemCount;
  }
  get lastOptimizedAt(): Date | null {
    return this.props.lastOptimizedAt;
  }
  get isRecurring(): boolean {
    return this.props.isRecurring;
  }
  get recurringInterval(): string | null {
    return this.props.recurringInterval;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isFullyParsed(): boolean {
    return this.props.parsedItemCount === this.props.itemCount && this.props.itemCount > 0;
  }

  toJSON(): ShoppingListProps {
    return { ...this.props };
  }
}
