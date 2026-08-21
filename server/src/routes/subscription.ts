import type { FastifyInstance } from 'fastify';
import {
  getSubscriptionInfo,
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} from '../services/subscription.js';
import { formatResponse, formatError, UnauthorizedError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

export default async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  // Get current subscription info
  app.get('/api/v1/subscription', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const info = await getSubscriptionInfo(request.userId);
      return reply.send(formatResponse(info));
    } catch (error) {
      return reply.status(500).send(formatError(error));
    }
  });

  // Create Stripe checkout session
  app.post('/api/v1/subscription/checkout', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const result = await createCheckoutSession(request.userId, request.user.email);
      return reply.send(formatResponse(result));
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  // Create Stripe billing portal session
  app.post('/api/v1/subscription/portal', {
    preHandler: [authenticate],
  }, async (request, reply) => {
    try {
      const result = await createPortalSession(request.userId);
      return reply.send(formatResponse(result));
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return reply.status(401).send(formatError(error));
      }
      return reply.status(500).send(formatError(error));
    }
  });

  // Stripe webhook endpoint (raw body needed for signature verification)
  app.post('/api/v1/subscription/webhook', async (request, reply) => {
    try {
      // In production, verify the webhook signature using STRIPE_WEBHOOK_SECRET
      // For now, we accept the event directly
      const event = request.body as { type: string; data: { object: unknown } };
      await handleWebhook(event as Parameters<typeof handleWebhook>[0]);
      return reply.send({ received: true });
    } catch (error) {
      app.log.error('Webhook error: %s', String(error));
      return reply.status(400).send({ error: 'Webhook processing failed' });
    }
  });
}
