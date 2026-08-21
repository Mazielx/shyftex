import type { FastifyInstance } from 'fastify';
import { db } from '../services/database.js';
import { formatResponse, formatError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

export default async function historyRoutes(app: FastifyInstance): Promise<void> {
  // Get purchase history
  app.get('/api/v1/history/purchases', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const purchases = await db.purchases.findByUser(request.userId);

      // Enrich with store names
      const enriched: Array<(typeof purchases)[number] & { storeName: string; retailerName: string }> = [];
      for (const p of purchases) {
        const store = await db.stores.findById(p.storeId);
        enriched.push({
          ...p,
          storeName: store?.name ?? 'Unknown Store',
          retailerName: store?.retailerName ?? 'Unknown',
        });
      }

      return reply.send(formatResponse(enriched));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  // Get savings history
  app.get('/api/v1/history/savings', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const savings = await db.savings.findByUser(request.userId);

      // Calculate summary stats
      const totalSavedCents = savings.reduce((sum, s) => sum + s.netSavingsCents, 0);
      const totalSpentCents = savings.reduce((sum, s) => sum + s.optimizedCostCents, 0);
      const totalBaselineCents = savings.reduce((sum, s) => sum + s.baselineCostCents, 0);

      return reply.send(formatResponse({
        records: savings,
        summary: {
          totalSavedCents,
          totalSpentCents,
          totalBaselineCents,
          tripCount: savings.length,
          averageSavingsPerTrip: savings.length > 0 ? Math.round(totalSavedCents / savings.length) : 0,
          currency: 'MXN',
        },
      }));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  // Get spending analytics
  app.get('/api/v1/history/analytics', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const purchases = await db.purchases.findByUser(request.userId);

      // Group by product category (use first word as rough category)
      const byProduct: Record<string, { count: number; totalCents: number; name: string }> = {};
      for (const p of purchases) {
        const key = p.productName.toLowerCase();
        if (!byProduct[key]) {
          byProduct[key] = { count: 0, totalCents: 0, name: p.productName };
        }
        byProduct[key].count += p.quantity;
        byProduct[key].totalCents += p.priceCents;
      }

      // Group by store
      const byStore: Record<string, { count: number; totalCents: number; name: string }> = {};
      for (const p of purchases) {
        const store = await db.stores.findById(p.storeId);
        const key = p.storeId;
        if (!byStore[key]) {
          byStore[key] = { count: 0, totalCents: 0, name: store?.name ?? 'Unknown' };
        }
        byStore[key].count += p.quantity;
        byStore[key].totalCents += p.priceCents;
      }

      return reply.send(formatResponse({
        byProduct: Object.values(byProduct).sort((a, b) => b.totalCents - a.totalCents),
        byStore: Object.values(byStore).sort((a, b) => b.totalCents - a.totalCents),
        totalTransactions: purchases.length,
      }));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });
}
