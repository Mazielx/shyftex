/**
 * Subscription service — handles Stripe integration and usage limits.
 * Free tier: 5 optimizations/month, 1 vehicle max
 * Pro tier: unlimited
 */
import Stripe from 'stripe';
import { db } from './database.js';
import { ForbiddenError } from '../utils/errors.js';

const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY'];
const APP_URL = process.env['APP_URL'] ?? 'http://localhost:4000';

const FREE_TIER_LIMITS = {
  optimizationsPerMonth: 5,
  maxVehicles: 1,
} as const;

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required for subscription features');
    }
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
  optimizationsUsed: number;
  optimizationsLimit: number;
  currentPeriodEnd: Date | null;
}

export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  let sub = await db.subscriptions.findByUser(userId);
  if (!sub) {
    sub = await db.subscriptions.upsert(userId, {
      plan: 'FREE',
      status: 'ACTIVE',
      optimizationsUsed: 0,
      optimizationsLimit: FREE_TIER_LIMITS.optimizationsPerMonth,
    });
  }
  return {
    plan: sub.plan,
    status: sub.status,
    optimizationsUsed: sub.optimizationsUsed,
    optimizationsLimit: sub.optimizationsLimit,
    currentPeriodEnd: sub.currentPeriodEnd,
  };
}

export async function checkOptimizationQuota(userId: string): Promise<void> {
  const sub = await getSubscriptionInfo(userId);
  if (sub.plan === 'PRO' && sub.status === 'ACTIVE') return;
  if (sub.optimizationsUsed >= sub.optimizationsLimit) {
    throw new ForbiddenError(
      `You've used ${sub.optimizationsUsed}/${sub.optimizationsLimit} free optimizations this month. Upgrade to Pro for unlimited.`
    );
  }
}

export async function recordOptimizationUsage(userId: string): Promise<void> {
  const sub = await db.subscriptions.findByUser(userId);
  if (!sub) {
    await db.subscriptions.upsert(userId, {
      plan: 'FREE',
      status: 'ACTIVE',
      optimizationsUsed: 1,
      optimizationsLimit: FREE_TIER_LIMITS.optimizationsPerMonth,
    });
  } else if (sub.plan === 'FREE') {
    await db.subscriptions.incrementOptimizations(userId);
  }
}

export async function checkVehicleQuota(userId: string, currentCount: number): Promise<void> {
  const sub = await getSubscriptionInfo(userId);
  if (sub.plan === 'PRO' && sub.status === 'ACTIVE') return;
  if (currentCount >= FREE_TIER_LIMITS.maxVehicles) {
    throw new ForbiddenError(
      `Free tier allows ${FREE_TIER_LIMITS.maxVehicles} vehicle(s). Upgrade to Pro for unlimited.`
    );
  }
}

// ─── Stripe Checkout ───

export async function createCheckoutSession(userId: string, userEmail: string): Promise<{ url: string }> {
  const stripe = getStripe();

  // Find or create Stripe customer
  let sub = await db.subscriptions.findByUser(userId);
  let customerId = sub?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.subscriptions.upsert(userId, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'ShyftEx Pro',
            description: 'Unlimited optimizations, vehicles, and priority support',
          },
          recurring: { interval: 'month' },
          unit_amount: 14900, // $149.00 MXN
        },
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/settings`,
    metadata: { userId },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return { url: session.url };
}

export async function createPortalSession(userId: string): Promise<{ url: string }> {
  const stripe = getStripe();
  const sub = await db.subscriptions.findByUser(userId);

  if (!sub?.stripeCustomerId) {
    throw new ForbiddenError('No subscription found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${APP_URL}/settings`,
  });

  if (!session.url) {
    throw new Error('Failed to create portal session');
  }

  return { url: session.url };
}

// ─── Stripe Webhook ───

export async function handleWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.['userId'];
      if (!userId) return;

      const subscriptionId = session.subscription as string;
      await db.subscriptions.upsert(userId, {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        plan: 'PRO',
        status: 'ACTIVE',
        optimizationsLimit: 999999,
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as Record<string, unknown>)['subscription'] as string | undefined;
      if (!subId) return;

      const sub = await findSubscriptionByStripeId(subId);
      if (!sub) return;

      await db.subscriptions.upsert(sub.userId, {
        status: 'ACTIVE',
        optimizationsUsed: 0, // Reset monthly count
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as Record<string, unknown>)['subscription'] as string | undefined;
      if (!subId) return;

      const sub = await findSubscriptionByStripeId(subId);
      if (!sub) return;

      await db.subscriptions.upsert(sub.userId, {
        status: 'PAST_DUE',
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await findSubscriptionByStripeId(subscription.id);
      if (!sub) return;

      await db.subscriptions.upsert(sub.userId, {
        plan: 'FREE',
        status: 'CANCELLED',
        stripeSubscriptionId: undefined,
        optimizationsLimit: FREE_TIER_LIMITS.optimizationsPerMonth,
      });
      break;
    }
  }
}

async function findSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<{ userId: string } | null> {
  const { prisma } = await import('../lib/prisma.js');
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    select: { userId: true },
  });
  return sub;
}
