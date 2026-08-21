import type { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { db } from '../services/database.js';
import { formatResponse, formatError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, schemas } from '../middleware/validation.js';

export default async function listsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/lists', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const lists = await db.lists.findByUser(request.userId);
      return reply.send(formatResponse(lists));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  app.post('/api/v1/lists', {
    preHandler: [authenticate, validateBody(schemas.createList)],
  }, async (request, reply) => {
    try {
      const { title, rawInput } = request.body as { title: string; rawInput: string };

      const list = await db.lists.create({
        id: uuid(),
        userId: request.userId,
        title,
        rawInput,
        status: 'DRAFT',
        itemCount: 0,
        parsedItemCount: 0,
      });

      return reply.status(201).send(formatResponse(list));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  app.get('/api/v1/lists/:id', {
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

      const items = await db.items.findByList(id);

      return reply.send(formatResponse({ ...list, items }));
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

  app.put('/api/v1/lists/:id', {
    preHandler: [authenticate, validateBody(schemas.updateList)],
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

      const updates = request.body as {
        title?: string;
        status?: string;
        isRecurring?: boolean;
        recurringInterval?: string | null;
      };

      const updated = await db.lists.update(id, {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.isRecurring !== undefined && { isRecurring: updates.isRecurring }),
        ...(updates.recurringInterval !== undefined && { recurringInterval: updates.recurringInterval }),
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

  app.delete('/api/v1/lists/:id', {
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

      await db.lists.delete(id);

      const items = await db.items.findByList(id);
      for (const item of items) {
        await db.items.delete(item.id);
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
