import type { FastifyInstance } from 'fastify';
import { db } from '../services/database.js';
import { formatResponse, formatError, NotFoundError, ValidationError } from '../utils/errors.js';
import { validateQuery } from '../middleware/validation.js';

export default async function storesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/stores/nearby', {
    preHandler: [
      validateQuery({
        lat: { required: true, type: 'string' as const },
        lng: { required: true, type: 'string' as const },
        radius: { type: 'string' as const },
      }),
    ],
  }, async (request, reply) => {
    try {
      const { lat, lng, radius } = request.query as {
        lat: string;
        lng: string;
        radius?: string;
      };

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const radiusKm = radius ? parseFloat(radius) : 10;

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        throw new ValidationError('Invalid latitude or longitude values');
      }

      if (latitude < -90 || latitude > 90) {
        throw new ValidationError('Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new ValidationError('Longitude must be between -180 and 180');
      }

      const stores = await db.stores.findNearby(latitude, longitude, radiusKm);

      return reply.send(formatResponse(stores));
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.status(400).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  app.get('/api/v1/stores/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const store = await db.stores.findById(id);

      if (!store) {
        throw new NotFoundError('Store', id);
      }

      return reply.send(formatResponse(store));
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });
}
