import type { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../services/database.js';
import { formatResponse, formatError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { checkVehicleQuota } from '../services/subscription.js';

export default async function preferencesRoutes(app: FastifyInstance): Promise<void> {
  // ─── Preferences ───

  // Get user preferences
  app.get('/api/v1/preferences', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      let prefs = await db.preferences.findByUser(request.userId);

      // Create defaults if none exist
      if (!prefs) {
        await db.preferences.upsert(request.userId, {
          defaultOptimizationMode: 'BALANCED',
          maxBudgetCents: null,
          maxTravelDistanceKm: 15,
          maxTravelTimeMinutes: 60,
          preferredStoreIds: [],
          excludedStoreIds: [],
          preferredBrands: [],
          dietaryRestrictions: [],
          currency: 'MXN',
          language: 'es',
        });
        const created = await db.preferences.findByUser(request.userId);
        if (!created) {
          throw new NotFoundError('Preferences', request.userId);
        }
        prefs = created;
      }

      return reply.send(formatResponse(prefs));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  // Update user preferences
  app.put('/api/v1/preferences', {
    preHandler: [authenticate, validateBody(schemas.updatePreferences)],
  }, async (request, reply) => {
    try {
      const updates = request.body as {
        defaultOptimizationMode?: string;
        maxBudgetCents?: number | null;
        maxTravelDistanceKm?: number | null;
        maxTravelTimeMinutes?: number | null;
        preferredStoreIds?: string[];
        excludedStoreIds?: string[];
        preferredBrands?: string[];
        dietaryRestrictions?: string[];
        currency?: string;
        language?: string;
      };

      await db.preferences.upsert(request.userId, {
        ...(updates.defaultOptimizationMode !== undefined && { defaultOptimizationMode: updates.defaultOptimizationMode }),
        ...(updates.maxBudgetCents !== undefined && { maxBudgetCents: updates.maxBudgetCents }),
        ...(updates.maxTravelDistanceKm !== undefined && { maxTravelDistanceKm: updates.maxTravelDistanceKm }),
        ...(updates.maxTravelTimeMinutes !== undefined && { maxTravelTimeMinutes: updates.maxTravelTimeMinutes }),
        ...(updates.preferredStoreIds !== undefined && { preferredStoreIds: updates.preferredStoreIds }),
        ...(updates.excludedStoreIds !== undefined && { excludedStoreIds: updates.excludedStoreIds }),
        ...(updates.preferredBrands !== undefined && { preferredBrands: updates.preferredBrands }),
        ...(updates.dietaryRestrictions !== undefined && { dietaryRestrictions: updates.dietaryRestrictions }),
        ...(updates.currency !== undefined && { currency: updates.currency }),
        ...(updates.language !== undefined && { language: updates.language }),
      });

      const updated = await db.preferences.findByUser(request.userId);
      if (!updated) {
        throw new NotFoundError('Preferences', request.userId);
      }

      return reply.send(formatResponse(updated));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  // ─── Vehicles ───

  // List user vehicles
  app.get('/api/v1/vehicles', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const vehicles = await db.vehicles.findByUser(request.userId);
      return reply.send(formatResponse(vehicles));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  // Create vehicle
  app.post('/api/v1/vehicles', {
    preHandler: [authenticate, validateBody(schemas.createVehicle)],
  }, async (request, reply) => {
    try {
      const body = request.body as {
        name: string;
        make?: string;
        model?: string;
        year?: number;
        fuelType: string;
        customEfficiencyKmPerLiter?: number;
      };

      const existing = await db.vehicles.findByUser(request.userId);

      // Enforce free tier vehicle limit
      await checkVehicleQuota(request.userId, existing.length);

      // If this is the first vehicle, make it default
      const isDefault = existing.length === 0;

      const vehicle = await db.vehicles.create({
        id: uuid(),
        userId: request.userId,
        name: body.name,
        make: body.make ?? null,
        model: body.model ?? null,
        year: body.year ?? null,
        fuelType: body.fuelType,
        customEfficiencyKmPerLiter: body.customEfficiencyKmPerLiter ?? null,
        isDefault,
      });

      return reply.status(201).send(formatResponse(vehicle));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      if (error instanceof ForbiddenError) {
        return reply.status(403).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  // Update vehicle
  app.put('/api/v1/vehicles/:id', {
    preHandler: [authenticate, validateBody(schemas.updateVehicle)],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const vehicle = await db.vehicles.findById(id);

      if (!vehicle) {
        throw new NotFoundError('Vehicle', id);
      }
      if (vehicle.userId !== request.userId) {
        throw new ForbiddenError('You do not have access to this vehicle');
      }

      const updates = request.body as {
        name?: string;
        make?: string;
        model?: string;
        year?: number;
        fuelType?: string;
        customEfficiencyKmPerLiter?: number;
        isDefault?: boolean;
      };

      // If setting as default, unset other defaults first
      if (updates.isDefault === true) {
        await db.vehicles.unsetDefaults(request.userId);
      }

      const updated = await db.vehicles.update(id, {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.make !== undefined && { make: updates.make }),
        ...(updates.model !== undefined && { model: updates.model }),
        ...(updates.year !== undefined && { year: updates.year }),
        ...(updates.fuelType !== undefined && { fuelType: updates.fuelType }),
        ...(updates.customEfficiencyKmPerLiter !== undefined && { customEfficiencyKmPerLiter: updates.customEfficiencyKmPerLiter }),
        ...(updates.isDefault !== undefined && { isDefault: updates.isDefault }),
      });

      return reply.send(formatResponse(updated));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      if (error instanceof ForbiddenError) {
        return reply.status(403).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  // Delete vehicle
  app.delete('/api/v1/vehicles/:id', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const vehicle = await db.vehicles.findById(id);

      if (!vehicle) {
        throw new NotFoundError('Vehicle', id);
      }
      if (vehicle.userId !== request.userId) {
        throw new ForbiddenError('You do not have access to this vehicle');
      }

      await db.vehicles.delete(id);

      // If deleted vehicle was default, set another as default
      if (vehicle.isDefault) {
        const remaining = await db.vehicles.findByUser(request.userId);
        if (remaining.length > 0) {
          const first = remaining[0]!;
          await db.vehicles.update(first.id, { isDefault: true });
        }
      }

      return reply.send(formatResponse({ deleted: true }));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      if (error instanceof ForbiddenError) {
        return reply.status(403).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });
}
