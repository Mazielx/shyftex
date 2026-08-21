/**
 * Store entity.
 * Represents a specific physical store location.
 */
export interface StoreProps {
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

export interface StoreHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // "08:00"
  closeTime: string; // "22:00"
  isClosed: boolean;
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

export class Store {
  private props: StoreProps;

  constructor(props: StoreProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get retailerId(): string {
    return this.props.retailerId;
  }
  get retailerName(): string {
    return this.props.retailerName;
  }
  get name(): string {
    return this.props.name;
  }
  get address(): string {
    return this.props.address;
  }
  get city(): string {
    return this.props.city;
  }
  get state(): string {
    return this.props.state;
  }
  get zipCode(): string {
    return this.props.zipCode;
  }
  get latitude(): number {
    return this.props.latitude;
  }
  get longitude(): number {
    return this.props.longitude;
  }
  get phone(): string | null {
    return this.props.phone;
  }
  get hours(): readonly StoreHours[] {
    return [...this.props.hours];
  }
  get services(): readonly StoreService[] {
    return [...this.props.services];
  }
  get isMock(): boolean {
    return this.props.isMock;
  }
  get source(): string {
    return this.props.source;
  }

  /** Check if store is currently open */
  isOpen(at: Date = new Date()): boolean {
    const dayOfWeek = at.getDay();
    const todayHours = this.props.hours.find((h) => h.dayOfWeek === dayOfWeek);

    if (!todayHours || todayHours.isClosed) return false;

    const currentTime = `${at.getHours().toString().padStart(2, '0')}:${at.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  /** Get full address as single string */
  getFullAddress(): string {
    return `${this.props.address}, ${this.props.city}, ${this.props.state} ${this.props.zipCode}`;
  }

  /** Check if store has a specific service */
  hasService(service: StoreService): boolean {
    return this.props.services.includes(service);
  }

  /** Calculate distance to another point (Haversine formula) */
  distanceTo(lat: number, lng: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat - this.props.latitude);
    const dLon = this.toRad(lng - this.props.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(this.props.latitude)) *
        Math.cos(this.toRad(lat)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  toJSON(): StoreProps {
    return { ...this.props };
  }
}
