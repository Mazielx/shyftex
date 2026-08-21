import type { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../services/database.js';
import { formatResponse, formatError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

// ─── Spanish NLP Parser (mirrors MockAIProvider) ───

interface ParsedItem {
  rawInput: string;
  normalizedName: string | null;
  brand: string | null;
  category: string | null;
  quantity: number;
  unit: string;
}

const BRAND_PATTERNS: Record<string, string[]> = {
  lala: ['lala', 'l-21', 'l21'],
  bimbo: ['bimbo', 'blanco.navito'],
  coca: ['coca.cola', 'cocacola', 'fanta', 'sprite'],
  barilla: ['barilla', 'la.moderna'],
  knorr: ['knorr', 'consomate'],
  delmonte: ['del monte', 'delmonte'],
  kelloggs: ['kellogg', 'corn flakes', 'special.k'],
  nestle: ['nescafe', 'nestle', 'maggi', 'laucherita'],
  morelos: ['morelos'],
  heinz: ['heinz', 'orozco'],
  bonafina: ['bonafina'],
  bodemar: ['bodemar', 'city.classic'],
  mourra: ['mourra', 'diana'],
  rico: ['rico', 'tuny'],
  bodetal: ['bodetal', 'la.fronteriza'],
  classic: ['classic', 'city'],
  bonafont: ['bonafont'],
  '7up': ['7up', '7.up', '7-up'],
  peñafiel: ['peñafiel'],
  sabritas: ['sabritas', 'ruffles', 'doritos', 'lays', 'tostitos'],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Lácteos: [
    'leche', 'yogurt', 'queso', 'crema', 'mantequilla', 'carta',
    'nispero', 'danette', 'activia',
  ],
  Panadería: ['pan', 'tortilla', 'bolillo', 'mantecada', 'galleta', 'oreo'],
  Carnes: ['pollo', 'res', 'cerdo', 'atún', 'jamón', 'chorizo', 'longaniza', 'tocino', 'pescado'],
  Frutas_y_Verduras: ['jitomate', 'cebolla', 'aguacate', 'limón', 'manzana', 'plátano', 'naranja', 'fresa', 'zanahoria', 'papa', 'chile'],
  Bebidas: ['agua', 'refresco', 'jugo', 'cerveza', 'café', 'té', 'tang'],
  Abarrotes: [
    'arroz', 'frijol', 'aceite', 'azúcar', 'sal', 'pasta', 'salsa',
    'catsup', 'mayonesa', 'mostaza', 'consome', 'sopa',
  ],
  Limpieza: ['jabón', 'detergente', 'suavizante', 'cloro', 'esponja', 'papel', 'servilleta', 'fabuloso'],
  Higiene: ['shampoo', 'crema.pelo', 'cepillo', 'pasta.dental', 'desodorante', 'talco', 'gel'],
};

const UNIT_PATTERNS: Array<{ pattern: RegExp; unit: string }> = [
  { pattern: /(\d+)\s*(litros?|lts?|lt|l)\b/i, unit: 'litro' },
  { pattern: /(\d+)\s*(ml|mililitros?)\b/i, unit: 'mililitro' },
  { pattern: /(\d+)\s*(kilos?|kgs?|kg)\b/i, unit: 'kilogramo' },
  { pattern: /(\d+)\s*(gramos?|grs?|gr?|g)\b/i, unit: 'gramo' },
  { pattern: /(\d+)\s*(piezas?|pzas?|pzs?|pza)\b/i, unit: 'pieza' },
  { pattern: /(\d+)\s*(rollos?|rollo)\b/i, unit: 'rollo' },
  { pattern: /(\d+)\s*(cajas?|caja)\b/i, unit: 'caja' },
  { pattern: /(\d+)\s*(paquetes?|paq)\b/i, unit: 'paquete' },
  { pattern: /(\d+)\s*(docenas?|doc)\b/i, unit: 'docena' },
  { pattern: /(\d+)\s*latas?/i, unit: 'lata' },
  { pattern: /(\d+)\s*botellas?/i, unit: 'botella' },
  { pattern: /(\d+)\s*bolsas?/i, unit: 'bolsa' },
  { pattern: /(\d+)\s*pack/i, unit: 'pack' },
];

function parseLine(line: string): ParsedItem {
  const trimmed = line.trim();
  if (!trimmed) {
    return { rawInput: trimmed, normalizedName: null, brand: null, category: null, quantity: 1, unit: 'pieza' };
  }

  // Extract quantity + unit
  let quantity = 1;
  let unit = 'pieza';
  let nameText = trimmed;

  for (const { pattern, unit: mappedUnit } of UNIT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      quantity = parseInt(match[1] ?? '1', 10);
      unit = mappedUnit;
      nameText = trimmed.replace(match[0], '').trim();
      break;
    }
  }

  // Standalone number at start
  if (quantity === 1) {
    const numMatch = nameText.match(/^(\d+)\s+/);
    if (numMatch?.[1]) {
      quantity = parseInt(numMatch[1], 10);
      nameText = nameText.replace(numMatch[0], '').trim();
    }
  }

  // Detect brand
  let brand: string | null = null;
  const lower = nameText.toLowerCase();
  for (const [b, keywords] of Object.entries(BRAND_PATTERNS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        brand = b.charAt(0).toUpperCase() + b.slice(1);
        break;
      }
    }
    if (brand) break;
  }

  // Detect category
  let category: string | null = null;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        category = cat;
        break;
      }
    }
    if (category) break;
  }

  // Normalize name: lowercase, trim, title case
  const normalizedName = nameText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  return {
    rawInput: trimmed,
    normalizedName: normalizedName || null,
    brand,
    category,
    quantity,
    unit,
  };
}

function matchLevelFromParsed(parsed: ParsedItem): string {
  if (!parsed.normalizedName) return 'INCOMPATIBLE';
  if (parsed.brand) return 'EXACT_MATCH';
  if (parsed.category) return 'PRODUCT_VARIANT_MATCH';
  return 'ACCEPTABLE_SUBSTITUTE';
}

export default async function parseRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/lists/:id/parse', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const list = await db.lists.findById(id);

      if (!list) {
        throw new NotFoundError('ShoppingList', id);
      }
      if (list.userId !== request.userId) {
        throw new ForbiddenError('You do not have access to this list');
      }

      const rawInput = list.rawInput;
      if (!rawInput || rawInput.trim().length === 0) {
        throw new ValidationError('List has no input text to parse');
      }

      // Remove existing items
      const existingItems = await db.items.findByList(id);
      for (const item of existingItems) {
        await db.items.delete(item.id);
      }

      // Parse lines
      const lines = rawInput.split('\n').filter((l) => l.trim().length > 0);
      const parsedItems = [];

      for (const line of lines) {
        const parsed = parseLine(line);

        const item = await db.items.create({
          id: uuid(),
          listId: id,
          rawInput: parsed.rawInput,
          normalizedName: parsed.normalizedName,
          brand: parsed.brand,
          category: parsed.category,
          quantity: parsed.quantity,
          unit: parsed.unit,
          allowsSubstitution: true,
          brandRestrictions: parsed.brand ? [parsed.brand] : [],
          priority: 'REQUIRED',
          isRequired: true,
          notes: '',
          matchLevel: matchLevelFromParsed(parsed),
        });

        parsedItems.push(item);
      }

      // Update list status
      const updatedList = await db.lists.update(id, {
        status: 'PARSED',
        itemCount: parsedItems.length,
        parsedItemCount: parsedItems.filter((i) => i.normalizedName !== null).length,
      });

      return reply.send(formatResponse({
        list: updatedList,
        items: parsedItems,
        stats: {
          total: parsedItems.length,
          parsed: parsedItems.filter((i) => i.normalizedName !== null).length,
          withBrand: parsedItems.filter((i) => i.brand !== null).length,
          withCategory: parsedItems.filter((i) => i.category !== null).length,
        },
      }));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      if (error instanceof ForbiddenError) {
        return reply.status(403).send(formatError(error));
      }
      if (error instanceof ValidationError) {
        return reply.status(400).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });
}
