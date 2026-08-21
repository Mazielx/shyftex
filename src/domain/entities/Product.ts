/**
 * Product entity.
 * Represents a product in the catalog, independent of any specific store.
 */
export interface ProductProps {
  id: string;
  name: string;
  canonicalName: string;
  brand: string;
  category: string;
  subcategory: string | null;
  barcodes: string[];
  description: string;
  imageUrl: string | null;
  defaultUnit: string;
  typicalSizes: ProductSize[];
  isMock: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSize {
  label: string;
  quantity: number;
  unit: string;
  barcode: string | null;
}

export class Product {
  private props: ProductProps;

  constructor(props: ProductProps) {
    this.props = { ...props };
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get canonicalName(): string {
    return this.props.canonicalName;
  }
  get brand(): string {
    return this.props.brand;
  }
  get category(): string {
    return this.props.category;
  }
  get subcategory(): string | null {
    return this.props.subcategory;
  }
  get barcodes(): readonly string[] {
    return [...this.props.barcodes];
  }
  get description(): string {
    return this.props.description;
  }
  get imageUrl(): string | null {
    return this.props.imageUrl;
  }
  get defaultUnit(): string {
    return this.props.defaultUnit;
  }
  get typicalSizes(): readonly ProductSize[] {
    return [...this.props.typicalSizes];
  }
  get isMock(): boolean {
    return this.props.isMock;
  }
  get source(): string {
    return this.props.source;
  }

  /** Check if a barcode matches this product */
  hasBarcode(barcode: string): boolean {
    return this.props.barcodes.includes(barcode);
  }

  /** Find a size match by quantity and unit */
  findSize(quantity: number, unit: string): ProductSize | null {
    return this.props.typicalSizes.find((s) => s.unit === unit && s.quantity === quantity) ?? null;
  }

  /** Get canonical search key for normalization */
  getSearchKey(): string {
    return `${this.props.canonicalName}|${this.props.brand}|${this.props.category}`.toLowerCase();
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }
}
