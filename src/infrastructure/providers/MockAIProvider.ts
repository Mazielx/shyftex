/**
 * Mock AI Provider.
 *
 * Provides regex-based parsing of shopping lists from Spanish text
 * into structured items. Supports common Mexican products and brands.
 *
 * ALL DATA IS MOCK - clearly marked with isMock: true.
 * No actual AI is used — just intelligent pattern matching.
 */

import {
  AIProvider,
  ParsedShoppingList,
  ParsedItem,
  NormalizedProduct,
  ExplanationContext,
} from '../../domain/interfaces/providers';

// ─── Known Mexican Brands ───

const KNOWN_BRANDS: readonly string[] = [
  'Lala',
  'Bimbo',
  'Coca-Cola',
  'Pepsi',
  'Ariel',
  'Sabritas',
  "Kellogg's",
  'Pantene',
  'Regio',
  'Fabuloso',
  'Montalvo',
  'Bachoco',
  'Kuik',
  'Ciel',
  'Herdez',
  'Nestlé',
  'La Costeña',
  'Valentina',
  'Bonafina',
  'Santa Clara',
  'Alpura',
  'Nutri',
  'Gamesa',
  'Barilla',
  'Knorr',
  'Maggi',
  'Bonafont',
  'Del Monte',
  'Sello Rojo',
  'Azteca',
  'Mission',
  'Bachoco',
  'San Rafael',
  'Calderón',
  'Costa',
  'Chilchota',
  'La Merced',
  'Super',
  'Tío Nacho',
  'Huggies',
  'Pampers',
  'Colgate',
  'Oral-B',
  'Ace',
  'Tide',
  'Downy',
  'Viakal',
  'Globo',
  'Suavel',
];

// ─── Category Keywords ───

const CATEGORY_KEYWORDS: Record<string, readonly string[]> = {
  Dairy: [
    'leche',
    'yogurt',
    'queso',
    'crema',
    'huevos',
    'mantequilla',
    'néctar',
    'requesón',
    'ricotta',
    'cottage',
  ],
  Meat: [
    'pollo',
    'carne',
    'res',
    'cerdo',
    'pechuga',
    'costilla',
    'chorizo',
    'longaniza',
    'tocino',
    'jamón',
    'ternera',
  ],
  Grains: ['arroz', 'pasta', 'frijol', 'avena', 'trigo', 'maíz', 'harina', 'lenteja', 'garbanzo'],
  Bakery: ['pan', 'tortilla', 'bolillo', 'baguette', 'cemita', 'mollete'],
  Beverages: [
    'agua',
    'jugo',
    'refresco',
    'cerveza',
    'café',
    'té',
    'agua mineral',
    'electrolítico',
    'energético',
  ],
  Cleaning: [
    'detergente',
    'jabón',
    'fabuloso',
    'cloro',
    'papel',
    'servilleta',
    'suavizante',
    'fregador',
    'esponja',
    'basura',
  ],
  PersonalCare: [
    'shampoo',
    'acondicionador',
    'crema',
    'pasta dental',
    'cepillo',
    'desodorante',
    'jabón',
    'loción',
    'protector solar',
  ],
  Snacks: [
    'papas',
    'galletas',
    'chocolate',
    'candy',
    'dulce',
    'crocante',
    'palomitas',
    'nuez',
    'cacahuate',
  ],
  Fruits: [
    'manzana',
    'plátano',
    'naranja',
    'limón',
    'jitomate',
    'cebolla',
    'aguacate',
    'piña',
    'mango',
    'papaya',
    'fresa',
    'uva',
  ],
  Vegetables: [
    'lechuga',
    'zanahoria',
    'papa',
    'chile',
    'pimiento',
    'brocoli',
    'espinaca',
    'apio',
    'calabacín',
  ],
  Baby: ['pañal', 'toallita', 'huggies', 'pampers', 'bebé', 'fórmula'],
  Pet: ['perro', 'gato', 'mascota', 'pet', 'alimento para'],
};

// ─── Presentation Patterns ───

const PRESENTATION_PATTERNS: readonly string[] = [
  'bolsa',
  'botella',
  'caja',
  'lata',
  'envase',
  'Display',
  'pack',
  'familiar',
  'individual',
  'mini',
  'grande',
  'pequeño',
  'doypack',
  'tubo',
  'frasco',
  'garrafa',
];

// ─── Unit Normalization Map ───

const UNIT_MAP: Record<string, string> = {
  litros: 'litro',
  litro: 'litro',
  lt: 'litro',
  l: 'litro',
  ml: 'mililitro',
  mililitros: 'mililitro',
  mililitro: 'mililitro',
  kilos: 'kilogramo',
  kilo: 'kilogramo',
  kg: 'kilogramo',
  kilogramos: 'kilogramo',
  kilogramo: 'kilogramo',
  gramos: 'gramo',
  gramo: 'gramo',
  g: 'gramo',
  onzas: 'onza',
  onza: 'onza',
  oz: 'onza',
  piezas: 'pieza',
  pieza: 'pieza',
  pzs: 'pieza',
  pzas: 'pieza',
  rollos: 'rollo',
  rollo: 'rollo',
  paquetes: 'paquete',
  paquete: 'paquete',
  pcks: 'paquete',
  cajas: 'caja',
  caja: 'caja',
  latas: 'lata',
  lata: 'lata',
  docenas: 'docena',
  docena: 'docena',
  manojos: 'manojo',
  manojo: 'manojo',
  tazas: 'taza',
  taza: 'taza',
};

// ─── Provider Implementation ───

export class MockAIProvider implements AIProvider {
  readonly name = 'MockAIProvider';
  readonly isMock = true;

  async parseShoppingList(rawText: string, language: string): Promise<ParsedShoppingList> {
    const lines = rawText
      .split(/[,;\n]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const items: ParsedItem[] = [];
    let totalConfidence = 0;

    for (const line of lines) {
      const parsed = this.parseSingleItem(line);
      items.push(parsed);
      totalConfidence += parsed.confidence;
    }

    const averageConfidence =
      items.length > 0 ? Math.round((totalConfidence / items.length) * 100) / 100 : 0;

    return {
      items,
      language,
      confidence: averageConfidence,
    };
  }

  async normalizeProductName(name: string, language: string): Promise<NormalizedProduct> {
    const lowerName = name.toLowerCase().trim();

    // Find brand
    const brand = this.extractBrand(lowerName);

    // Find category
    const category = this.extractCategory(lowerName);

    // Clean product name
    let canonicalName = lowerName;
    if (brand) {
      canonicalName = canonicalName
        .replace(new RegExp(this.escapeRegex(brand.toLowerCase()), 'gi'), '')
        .replace(/^de\s+/i, '')
        .trim();
    }

    canonicalName = canonicalName
      .replace(
        /\d+(?:\.\d+)?\s*(litros?|lt|l|ml|kilos?|kg|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?)/gi,
        '',
      )
      .replace(/^\s*,\s*|\s*,\s*$/g, '')
      .trim();

    const confidence = canonicalName.length > 2 ? 0.7 : 0.4;

    return {
      canonicalName: canonicalName || lowerName,
      brand: brand ?? '',
      category: category ?? '',
      subcategory: null,
      confidence,
    };
  }

  async generateExplanation(context: ExplanationContext): Promise<string> {
    const parts: string[] = [];

    if (context.planSummary) {
      parts.push(context.planSummary);
    }

    if (context.keyDecisions.length > 0) {
      parts.push('Key decisions:');
      for (const decision of context.keyDecisions) {
        parts.push(`- ${decision}`);
      }
    }

    if (context.savingsBreakdown) {
      parts.push(`Savings: ${context.savingsBreakdown}`);
    }

    return parts.join('\n');
  }

  // ─── Private: Single Item Parsing ───

  private parseSingleItem(text: string): ParsedItem {
    const cleaned = text.trim();
    let confidence = 0.8;

    const quantity = this.extractQuantity(cleaned);
    const unit = this.extractUnit(cleaned, quantity);
    const brand = this.extractBrand(cleaned);
    const size = this.extractSize(cleaned);
    const presentation = this.extractPresentation(cleaned);
    const category = this.extractCategory(cleaned);
    const productName = this.extractProductName(cleaned, quantity, unit, brand);

    // Adjust confidence based on parsing quality
    if (productName.length < 2) confidence -= 0.3;
    if (category) confidence += 0.05;
    if (brand) confidence += 0.05;
    if (quantity !== 1) confidence += 0.05;
    if (size) confidence += 0.05;

    confidence = Math.max(0.1, Math.min(1.0, confidence));

    const alternatives = this.generateAlternatives(productName, brand);

    return {
      rawInput: cleaned,
      quantity,
      unit,
      productName,
      brand,
      presentation,
      size,
      category,
      confidence: Math.round(confidence * 100) / 100,
      alternatives,
    };
  }

  // ─── Quantity Extraction ───

  private extractQuantity(text: string): number {
    const patterns: readonly RegExp[] = [
      /^(\d+(?:\.\d+)?)\s*(?:de\s+)?(?:un\s+)?/i,
      /(\d+(?:\.\d+)?)\s*(litros?|lt|l|ml|mililitros?|kilos?|kg|kilogramos?|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?|docenas?|manojos?|tazas?)\b/i,
      /(\d+(?:\.\d+)?)\s+/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const qty = parseFloat(match[1]);
        if (qty > 0 && qty < 10000) {
          return qty;
        }
      }
    }

    return 1;
  }

  // ─── Unit Extraction ───

  private extractUnit(text: string, quantity: number): string {
    const unitPattern =
      /\b(litros?|lt|l|ml|mililitros?|kilos?|kg|kilogramos?|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?|docenas?|manojos?|tazas?)\b/i;

    const match = text.match(unitPattern);
    if (match && match[1]) {
      const unitKey = match[1].toLowerCase();
      return UNIT_MAP[unitKey] ?? unitKey;
    }

    // If quantity > 1 and no explicit unit, default to pieza
    if (quantity > 1) return 'pieza';

    // Check if it's a liquid-looking product
    const liquidKeywords = ['leche', 'agua', 'jugo', 'refresco', 'aceite', 'vinagre'];
    if (liquidKeywords.some((kw) => text.toLowerCase().includes(kw))) {
      return 'pieza';
    }

    return 'pieza';
  }

  // ─── Brand Extraction ───

  private extractBrand(text: string): string | null {
    const lowerText = text.toLowerCase();

    for (const brand of KNOWN_BRANDS) {
      const brandLower = brand.toLowerCase();
      // Use word boundary matching
      const escaped = this.escapeRegex(brandLower);
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerText)) {
        return brand;
      }
    }

    return null;
  }

  // ─── Category Extraction ───

  private extractCategory(text: string): string | null {
    const lowerText = text.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return category;
        }
      }
    }

    return null;
  }

  // ─── Size Extraction ───

  private extractSize(text: string): string | null {
    const sizePattern =
      /\b(\d+(?:\.\d+)?)\s*(litros?|lt|l|ml|mililitros?|kilos?|kg|kilogramos?|gramos?|g|onzas?|oz)\b/i;
    const match = text.match(sizePattern);

    if (match && match[1] && match[2]) {
      return `${match[1]}${this.normalizeSizeUnit(match[2])}`;
    }

    // Check for quantity-based sizes like "12 rollos"
    const qtySizePattern = /(\d+)\s+(rollos?|paquetes?|piezas?|latas?|cajas?)/i;
    const qtyMatch = text.match(qtySizePattern);
    if (qtyMatch && qtyMatch[1] && qtyMatch[2]) {
      return `${qtyMatch[1]} ${qtyMatch[2]}`;
    }

    return null;
  }

  // ─── Presentation Extraction ───

  private extractPresentation(text: string): string | null {
    const lowerText = text.toLowerCase();

    for (const presentation of PRESENTATION_PATTERNS) {
      if (lowerText.includes(presentation.toLowerCase())) {
        return presentation;
      }
    }

    return null;
  }

  // ─── Product Name Extraction ───

  private extractProductName(
    text: string,
    quantity: number,
    unit: string,
    brand: string | null,
  ): string {
    let name = text;

    // Remove quantity + unit patterns
    name = name.replace(
      /\d+(?:\.\d+)?\s*(litros?|lt|l|ml|mililitros?|kilos?|kg|kilogramos?|gramos?|g|onzas?|oz|piezas?|pzs?|pzas?|rollos?|paquetes?|pcks?|cajas?|latas?|docenas?|manojos?|tazas?)/gi,
      '',
    );

    // Remove leading quantity
    name = name.replace(/^\d+(?:\.\d+)?\s*(de\s+|un\s+)?/i, '');

    // Remove brand
    if (brand) {
      const escaped = this.escapeRegex(brand);
      name = name.replace(new RegExp(escaped, 'gi'), '');
    }

    // Remove filler words
    name = name
      .replace(/\b(de|del|el|la|los|las|un|una|unos|unas|con|para|y)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s,]+|[\s,]+$/g, '')
      .trim();

    // Capitalize first letter
    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    return name || text.trim();
  }

  // ─── Size Unit Normalization ───

  private normalizeSizeUnit(unit: string): string {
    const lower = unit.toLowerCase();
    if (lower.startsWith('lit') || lower === 'lt' || lower === 'l') return 'L';
    if (lower === 'ml' || lower.startsWith('mililitro')) return 'ml';
    if (lower.startsWith('kilo') || lower === 'kg') return 'kg';
    if (lower.startsWith('gram') || lower === 'g') return 'g';
    if (lower.startsWith('onza') || lower === 'oz') return 'oz';
    return lower;
  }

  // ─── Alternative Names ───

  private generateAlternatives(productName: string, brand: string | null): string[] {
    const alternatives: string[] = [];
    const lowerName = productName.toLowerCase();

    if (brand) {
      alternatives.push(`${brand} ${productName}`);
    }

    // Add category-based alternatives
    const category = this.extractCategory(lowerName);
    if (category) {
      const categoryKeywords = CATEGORY_KEYWORDS[category];
      if (categoryKeywords) {
        for (const keyword of categoryKeywords) {
          if (!lowerName.includes(keyword)) {
            alternatives.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            break;
          }
        }
      }
    }

    return alternatives.slice(0, 3);
  }

  // ─── Utility ───

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
