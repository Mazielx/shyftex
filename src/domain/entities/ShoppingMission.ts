/**
 * ShoppingMission entity.
 * Represents an active shopping trip based on a plan.
 */
export enum MissionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
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

export interface ShoppingMissionProps {
  id: string;
  planId: string;
  userId: string;
  status: MissionStatus;
  currentStopIndex: number;
  startedAt: Date | null;
  completedAt: Date | null;
  items: MissionItem[];
  totalSpent: number | null;
  totalSaved: number | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MissionItem {
  id: string;
  missionId: string;
  storeId: string;
  productId: string;
  productName: string;
  expectedPrice: number;
  actualPrice: number | null;
  quantity: number;
  status: MissionItemStatus;
  substitutionProductId: string | null;
  notes: string;
  foundAt: Date | null;
}

export class ShoppingMission {
  private props: ShoppingMissionProps;

  constructor(props: ShoppingMissionProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get planId(): string {
    return this.props.planId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get status(): MissionStatus {
    return this.props.status;
  }
  get currentStopIndex(): number {
    return this.props.currentStopIndex;
  }
  get startedAt(): Date | null {
    return this.props.startedAt;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
  get items(): readonly MissionItem[] {
    return [...this.props.items];
  }
  get totalSpent(): number | null {
    return this.props.totalSpent;
  }
  get totalSaved(): number | null {
    return this.props.totalSaved;
  }
  get notes(): string {
    return this.props.notes;
  }

  get progress(): { completed: number; total: number; percentage: number } {
    const total = this.props.items.length;
    const completed = this.props.items.filter((i) => i.status !== MissionItemStatus.PENDING).length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  get itemsNotFound(): MissionItem[] {
    return this.props.items.filter((i) => i.status === MissionItemStatus.NOT_FOUND);
  }

  start(): void {
    if (this.props.status !== MissionStatus.NOT_STARTED) {
      throw new Error('Mission already started');
    }
    this.props.status = MissionStatus.IN_PROGRESS;
    this.props.startedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markItemFound(itemId: string, actualPrice: number): void {
    const item = this.props.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found in mission');
    item.status = MissionItemStatus.FOUND;
    item.actualPrice = actualPrice;
    item.foundAt = new Date();
    this.props.updatedAt = new Date();
  }

  markItemNotFound(itemId: string, notes: string = ''): void {
    const item = this.props.items.find((i) => i.id === itemId);
    if (!item) throw new Error('Item not found in mission');
    item.status = MissionItemStatus.NOT_FOUND;
    item.notes = notes;
    this.props.updatedAt = new Date();
  }

  complete(): void {
    this.props.status = MissionStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
    // Calculate totals
    this.props.totalSpent = this.props.items
      .filter((i) => i.status === MissionItemStatus.FOUND && i.actualPrice !== null)
      .reduce((sum, i) => sum + (i.actualPrice ?? 0) * i.quantity, 0);
    this.props.totalSaved = this.props.items
      .filter((i) => i.status === MissionItemStatus.FOUND && i.actualPrice !== null)
      .reduce(
        (sum, i) => sum + (i.expectedPrice - (i.actualPrice ?? i.expectedPrice)) * i.quantity,
        0,
      );
  }

  toJSON(): ShoppingMissionProps {
    return { ...this.props };
  }
}
