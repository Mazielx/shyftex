import type { FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError, formatError } from '../utils/errors.js';

type ValidationSchema = Record<string, unknown>;

export function validateBody(schema: ValidationSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const errors = validateObject(request.body as Record<string, unknown>, schema, 'body');
    if (errors.length > 0) {
      const response = formatError(new ValidationError('Invalid request body', errors));
      await reply.status(400).send(response);
    }
  };
}

export function validateQuery(schema: ValidationSchema) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const errors = validateObject(request.query as Record<string, unknown>, schema, 'query');
    if (errors.length > 0) {
      const response = formatError(new ValidationError('Invalid query parameters', errors));
      await reply.status(400).send(response);
    }
  };
}

interface FieldError {
  field: string;
  message: string;
}

function validateObject(
  data: Record<string, unknown>,
  schema: ValidationSchema,
  prefix: string
): FieldError[] {
  const errors: FieldError[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    const fieldPath = `${prefix}.${key}`;
    const fieldRules = rules as FieldRules;

    if (fieldRules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: fieldPath, message: `${key} is required` });
      continue;
    }

    if (value === undefined || value === null) continue;

    if (fieldRules.type === 'string' && typeof value !== 'string') {
      errors.push({ field: fieldPath, message: `${key} must be a string` });
      continue;
    }

    if (fieldRules.type === 'number' && typeof value !== 'number') {
      errors.push({ field: fieldPath, message: `${key} must be a number` });
      continue;
    }

    if (fieldRules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push({ field: fieldPath, message: `${key} must be a boolean` });
      continue;
    }

    if (fieldRules.type === 'array' && !Array.isArray(value)) {
      errors.push({ field: fieldPath, message: `${key} must be an array` });
      continue;
    }

    if (fieldRules.minLength !== undefined && typeof value === 'string' && value.length < fieldRules.minLength) {
      errors.push({ field: fieldPath, message: `${key} must be at least ${fieldRules.minLength} characters` });
    }

    if (fieldRules.maxLength !== undefined && typeof value === 'string' && value.length > fieldRules.maxLength) {
      errors.push({ field: fieldPath, message: `${key} must be at most ${fieldRules.maxLength} characters` });
    }

    if (fieldRules.min !== undefined && typeof value === 'number' && value < fieldRules.min) {
      errors.push({ field: fieldPath, message: `${key} must be at least ${fieldRules.min}` });
    }

    if (fieldRules.max !== undefined && typeof value === 'number' && value > fieldRules.max) {
      errors.push({ field: fieldPath, message: `${key} must be at most ${fieldRules.max}` });
    }

    if (fieldRules.enum !== undefined && typeof value === 'string' && !fieldRules.enum.includes(value)) {
      errors.push({ field: fieldPath, message: `${key} must be one of: ${fieldRules.enum.join(', ')}` });
    }

    if (fieldRules.pattern !== undefined && typeof value === 'string' && !fieldRules.pattern.test(value)) {
      errors.push({ field: fieldPath, message: `${key} format is invalid` });
    }
  }

  return errors;
}

interface FieldRules {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[];
  pattern?: RegExp;
}

export const schemas = {
  register: {
    email: { required: true, type: 'string' as const, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, type: 'string' as const, minLength: 8 },
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  },
  login: {
    email: { required: true, type: 'string' as const },
    password: { required: true, type: 'string' as const },
  },
  createList: {
    title: { required: true, type: 'string' as const, minLength: 1, maxLength: 200 },
    rawInput: { required: true, type: 'string' as const, minLength: 1, maxLength: 10000 },
  },
  updateList: {
    title: { type: 'string' as const, minLength: 1, maxLength: 200 },
    status: { type: 'string' as const, enum: ['DRAFT', 'PARSED', 'REVIEWED', 'OPTIMIZED', 'IN_PROGRESS', 'COMPLETED'] },
  },
  optimize: {
    listId: { required: true, type: 'string' as const },
    mode: { required: true, type: 'string' as const, enum: ['MAXIMUM_SAVINGS', 'BALANCED', 'MAXIMUM_CONVENIENCE'] },
  },
  createMission: {
    planId: { required: true, type: 'string' as const },
    listId: { required: true, type: 'string' as const },
  },
  updateMissionItem: {
    status: { type: 'string' as const, enum: ['PENDING', 'FOUND', 'NOT_FOUND', 'SUBSTITUTED', 'SKIPPED'] },
    actualPriceCents: { type: 'number' as const, min: 0 },
    substitutionProductId: { type: 'string' as const },
    notes: { type: 'string' as const, maxLength: 500 },
  },
  createVehicle: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
    make: { type: 'string' as const, maxLength: 100 },
    model: { type: 'string' as const, maxLength: 100 },
    year: { type: 'number' as const, min: 1900, max: 2100 },
    fuelType: { required: true, type: 'string' as const, enum: ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG'] },
    customEfficiencyKmPerLiter: { type: 'number' as const, min: 0, max: 100 },
  },
  updateVehicle: {
    name: { type: 'string' as const, minLength: 1, maxLength: 100 },
    make: { type: 'string' as const, maxLength: 100 },
    model: { type: 'string' as const, maxLength: 100 },
    year: { type: 'number' as const, min: 1900, max: 2100 },
    fuelType: { type: 'string' as const, enum: ['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG'] },
    customEfficiencyKmPerLiter: { type: 'number' as const, min: 0, max: 100 },
    isDefault: { type: 'boolean' as const },
  },
  updatePreferences: {
    defaultOptimizationMode: { type: 'string' as const, enum: ['MAXIMUM_SAVINGS', 'BALANCED', 'MAXIMUM_CONVENIENCE'] },
    maxBudgetCents: { type: 'number' as const, min: 0 },
    maxTravelDistanceKm: { type: 'number' as const, min: 0 },
    maxTravelTimeMinutes: { type: 'number' as const, min: 0 },
    preferredStoreIds: { type: 'array' as const },
    excludedStoreIds: { type: 'array' as const },
    preferredBrands: { type: 'array' as const },
    dietaryRestrictions: { type: 'array' as const },
    currency: { type: 'string' as const, enum: ['MXN', 'USD', 'EUR'] },
    language: { type: 'string' as const, enum: ['es', 'en'] },
  },
} as const;
