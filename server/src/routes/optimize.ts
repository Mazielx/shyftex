import type { FastifyInstance } from 'fastify';
import { db } from '../services/database.js';
import { formatResponse, formatError, NotFoundError, ValidationError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { recordOptimizationUsage } from '../services/subscription.js';
import type { OptimizationMode } from '../types.js';

export default async function optimizeRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/optimize', {
    preHandler: [authenticate, validateBody(schemas.optimize)],
  }, async (request, reply) => {
    try {
      const body = request.body as {
        listId: string;
        mode: OptimizationMode;
        userLocation?: { latitude: number; longitude: number };
        constraints?: {
          maxBudget?: number | null;
          maxTimeMinutes?: number | null;
          maxDistanceKm?: number | null;
          maxStores?: number;
          allowedStoreIds?: string[];
          excludedStoreIds?: string[];
        };
      };

      const { listId, mode } = body;

      const list = await db.lists.findById(listId);
      if (!list) {
        throw new NotFoundError('ShoppingList', listId);
      }

      if (list.userId !== request.userId) {
        return reply.status(403).send(formatError({
          name: 'Error',
          code: 'FORBIDDEN',
          message: 'You do not have access to this list',
          statusCode: 403,
        }));
      }

      const items = await db.items.findByList(listId);
      if (items.length === 0) {
        throw new ValidationError('List has no items to optimize');
      }

      const userLat = body.userLocation?.latitude ?? 19.4326;
      const userLng = body.userLocation?.longitude ?? -99.1332;
      const nearbyStores = await db.stores.findNearby(userLat, userLng, 15);

      const result = {
        planId: `plan_${Date.now()}`,
        listId,
        mode,
        status: 'COMPLETED',
        stores: nearbyStores.map((store) => ({
          storeId: store.id,
          retailerName: store.retailerName,
          storeName: store.name,
          address: `${store.address}, ${store.city}, ${store.state}`,
          items: items.slice(0, 2).map((item) => ({
            itemId: item.id,
            productName: item.normalizedName ?? item.rawInput,
            quantity: item.quantity,
            unit: item.unit,
            estimatedPrice: Math.round(Math.random() * 10000) / 100,
            currency: 'MXN',
          })),
        })),
        summary: {
          totalItems: items.length,
          storesToVisit: Math.min(nearbyStores.length, 3),
          estimatedTotal: Math.round(Math.random() * 50000) / 100,
          currency: 'MXN',
          estimatedSavings: Math.round(Math.random() * 5000) / 100,
        },
        warnings: [
          'Prices are estimated from mock data and may not reflect actual store prices.',
          'Product availability is not guaranteed.',
        ],
        isMock: true,
        createdAt: new Date().toISOString(),
      };

      await db.lists.update(listId, {
        status: 'OPTIMIZED',
        lastOptimizedAt: new Date(),
      });

      await recordOptimizationUsage(request.userId);

      return reply.send(formatResponse(result));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      if (error instanceof ValidationError) {
        return reply.status(400).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });
}
