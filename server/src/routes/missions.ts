import type { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../services/database.js';
import { formatResponse, formatError, NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, schemas } from '../middleware/validation.js';

export default async function missionsRoutes(app: FastifyInstance): Promise<void> {
  // Create a mission from a plan
  app.post('/api/v1/missions', {
    preHandler: [authenticate, validateBody(schemas.createMission)],
  }, async (request, reply) => {
    try {
      const { planId, listId } = request.body as { planId: string; listId: string };

      const list = await db.lists.findById(listId);
      if (!list) {
        throw new NotFoundError('ShoppingList', listId);
      }
      if (list.userId !== request.userId) {
        throw new ForbiddenError('You do not have access to this list');
      }

      const items = await db.items.findByList(listId);
      if (items.length === 0) {
        throw new ValidationError('List has no items for a mission');
      }

      const nearbyStores = await db.stores.findNearby(19.4326, -99.1332, 15);
      if (nearbyStores.length === 0) {
        throw new ValidationError('No stores found nearby');
      }

      const missionId = uuid();

      // Create mission items — distribute items across first store for simplicity
      const defaultStore = nearbyStores[0]!;
      const missionItems = items.map((item) => ({
        id: uuid(),
        missionId,
        storeId: defaultStore.id,
        shoppingItemId: item.id,
        productName: item.normalizedName ?? item.rawInput,
        quantity: item.quantity,
        unit: item.unit,
        expectedPriceCents: Math.round(Math.random() * 10000),
        status: 'PENDING',
      }));

      const totalExpectedCost = missionItems.reduce((sum, mi) => sum + mi.expectedPriceCents, 0);

      const mission = await db.missions.create({
        id: missionId,
        userId: request.userId,
        planId,
        listId,
        status: 'IN_PROGRESS',
        totalExpectedCostCents: totalExpectedCost,
        storeCount: 1,
      });

      await db.missionItems.createMany(missionItems);

      // Update list status
      await db.lists.update(listId, { status: 'IN_PROGRESS' });

      return reply.status(201).send(formatResponse({ mission, items: missionItems }));
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

  // Get mission details
  app.get('/api/v1/missions/:id', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const mission = await db.missions.findById(id);

      if (!mission) {
        throw new NotFoundError('Mission', id);
      }
      if (mission.userId !== request.userId) {
        throw new ForbiddenError('You do not have access to this mission');
      }

      const items = await db.missionItems.findByMission(id);

      return reply.send(formatResponse({ mission, items }));
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

  // Update mission item status
  app.put('/api/v1/missions/:missionId/items/:itemId', {
    preHandler: [authenticate, validateBody(schemas.updateMissionItem)],
  }, async (request, reply) => {
    try {
      const { missionId, itemId } = request.params as { missionId: string; itemId: string };
      const mission = await db.missions.findById(missionId);

      if (!mission) {
        throw new NotFoundError('Mission', missionId);
      }
      if (mission.userId !== request.userId) {
        throw new ForbiddenError('You do not have access to this mission');
      }

      const item = await db.missionItems.findById(itemId);
      if (!item || item.missionId !== missionId) {
        throw new NotFoundError('MissionItem', itemId);
      }

      const updates = request.body as {
        status?: string;
        actualPriceCents?: number;
        substitutionProductId?: string;
        notes?: string;
      };

      const updatedItem = await db.missionItems.update(itemId, {
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.actualPriceCents !== undefined && { actualPriceCents: updates.actualPriceCents }),
        ...(updates.substitutionProductId !== undefined && { substitutionProductId: updates.substitutionProductId }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
      });

      // Recalculate mission totals
      const allItems = await db.missionItems.findByMission(missionId);
      const totalActualCost = allItems.reduce((sum, mi) => {
        if (mi.actualPriceCents !== null) return sum + mi.actualPriceCents;
        return sum + mi.expectedPriceCents;
      }, 0);

      const updatedMission = await db.missions.update(missionId, {
        totalActualCostCents: totalActualCost,
      });

      return reply.send(formatResponse({ item: updatedItem, mission: updatedMission }));
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

  // Complete mission
  app.post('/api/v1/missions/:id/complete', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const mission = await db.missions.findById(id);

      if (!mission) {
        throw new NotFoundError('Mission', id);
      }
      if (mission.userId !== request.userId) {
        throw new ForbiddenError('You do not have access to this mission');
      }

      const updatedMission = await db.missions.update(id, {
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      // Update list status
      const list = await db.lists.findById(mission.listId);
      if (list) {
        await db.lists.update(mission.listId, { status: 'COMPLETED' });
      }

      // Create purchase records for found items
      const allItems = await db.missionItems.findByMission(id);
      const purchases = allItems
        .filter((item) => item.status === 'FOUND' || item.status === 'SUBSTITUTED')
        .map((item) => ({
          id: uuid(),
          userId: request.userId,
          missionId: id,
          storeId: item.storeId,
          productId: item.substitutionProductId ?? null,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          priceCents: item.actualPriceCents ?? item.expectedPriceCents,
          currency: 'MXN',
        }));

      if (purchases.length > 0) {
        await db.purchases.createMany(purchases);
      }

      // Create savings record
      const optimizedCostCents = mission.totalActualCostCents ?? mission.totalExpectedCostCents;
      const savingsRecord = await db.savings.create({
        id: uuid(),
        userId: request.userId,
        planId: mission.planId,
        missionId: id,
        baselineCostCents: mission.totalExpectedCostCents,
        optimizedCostCents,
        transportCostCents: 0,
        netSavingsCents: mission.totalExpectedCostCents - optimizedCostCents,
      });

      return reply.send(formatResponse({ mission: updatedMission, savings: savingsRecord }));
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

  // List user missions
  app.get('/api/v1/missions', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const missions = await db.missions.findByUser(request.userId);
      return reply.send(formatResponse(missions));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });
}
