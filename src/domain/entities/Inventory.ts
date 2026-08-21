/**
 * Inventory entity.
 * Represents stock availability for a store product.
 */
export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  UNKNOWN = 'UNKNOWN',
  ESTIMATED = 'ESTIMATED',
}

export interface InventoryProps {
  id: string;
  storeProductId: string;
  status: InventoryStatus;
  quantityAvailable: number | null;
  lastChecked: Date;
  source: string;
  confidence: string;
  isMock: boolean;
}

export class Inventory {
  private props: InventoryProps;

  constructor(props: InventoryProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get storeProductId(): string {
    return this.props.storeProductId;
  }
  get status(): InventoryStatus {
    return this.props.status;
  }
  get quantityAvailable(): number | null {
    return this.props.quantityAvailable;
  }
  get lastChecked(): Date {
    return this.props.lastChecked;
  }
  get source(): string {
    return this.props.source;
  }
  get confidence(): string {
    return this.props.confidence;
  }
  get isMock(): boolean {
    return this.props.isMock;
  }

  isAvailable(): boolean {
    return (
      this.props.status === InventoryStatus.IN_STOCK ||
      this.props.status === InventoryStatus.LOW_STOCK
    );
  }

  isUnknown(): boolean {
    return (
      this.props.status === InventoryStatus.UNKNOWN ||
      this.props.status === InventoryStatus.ESTIMATED
    );
  }

  isConfirmed(): boolean {
    const age = Date.now() - this.props.lastChecked.getTime();
    return age < 6 * 60 * 60 * 1000 && this.props.confidence === 'CONFIRMED';
  }

  toJSON(): InventoryProps {
    return { ...this.props };
  }
}
