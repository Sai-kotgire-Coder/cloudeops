import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  createPaymentOrder,
  verifyPayment,
  getUserPlanDetails,
  getUsageLimits
} from '../lib/paymentService.js';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  amount: z.number().int().positive().optional(),
  planDurationDays: z.number().int().positive().optional()
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string()
});

/**
 * POST /api/payment/create-order
 * Create a payment order for upgrading to Pro plan
 */
router.post('/create-order', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { amount, planDurationDays } = createOrderSchema.parse(req.body);

    // Get plan configuration from env
    const proAmount = amount || parseInt(process.env.PRO_PLAN_AMOUNT || '9900');
    const proDurationDays = planDurationDays || parseInt(process.env.PRO_PLAN_DURATION_DAYS || '30');

    // Create order
    const result = await createPaymentOrder({
      userId,
      amount: proAmount,
      planType: 'pro',
      planDurationDays: proDurationDays
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating payment order:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

/**
 * POST /api/payment/verify
 * Verify payment and upgrade user to Pro
 */
router.post('/verify', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyPaymentSchema.parse(req.body);

    // Verify payment
    const result = await verifyPayment({
      userId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/**
 * GET /api/payment/plan
 * Get current user's plan details
 */
router.get('/plan', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    const planDetails = await getUserPlanDetails(userId);

    if (!planDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limits = getUsageLimits(planDetails.isPro);

    return res.status(200).json({
      ...planDetails,
      limits
    });
  } catch (error: any) {
    console.error('Error fetching plan details:', error);
    return res.status(500).json({ error: 'Failed to fetch plan details' });
  }
});

/**
 * POST /api/payment/cancel
 * Cancel the user's Pro plan. There's no recurring auto-renewal to stop
 * here (Pro is a one-time 30-day top-up, not a Razorpay subscription
 * object), so "cancel" means immediately reverting to the Free plan --
 * there's no partial-refund or "stays active until period end" logic.
 */
router.post('/cancel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isPro) {
      return res.status(400).json({ error: 'You don\'t have an active Pro plan to cancel' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isPro: false, planType: 'free', planExpiry: null }
    });

    return res.status(200).json({ message: 'Your Pro plan has been cancelled. You are now on the Free plan.' });
  } catch (error: any) {
    console.error('Error cancelling plan:', error);
    return res.status(500).json({ error: 'Failed to cancel plan' });
  }
});

/**
 * GET /api/payment/usage
 * Get current user's resource usage
 */
router.get('/usage', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    // Get user plan
    const planDetails = await getUserPlanDetails(userId);
    if (!planDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current usage
    const [instances, applications, pipelines, containers, tickets] = await Promise.all([
      prisma.instance.count({ where: { userId } }),
      prisma.application.count({ where: { userId } }),
      prisma.pipeline.count({ where: { userId } }),
      prisma.container.count({ where: { userId } }),
      prisma.ticket.count({ where: { userId } })
    ]);

    const limits = getUsageLimits(planDetails.isPro);

    return res.status(200).json({
      plan: planDetails.planType,
      usage: {
        instances: { current: instances, limit: limits.maxInstances },
        applications: { current: applications, limit: limits.maxApplications },
        pipelines: { current: pipelines, limit: limits.maxPipelines },
        containers: { current: containers, limit: limits.maxContainers },
        tickets: { current: tickets, limit: limits.maxTickets }
      }
    });
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

/**
 * GET /api/payment/pricing
 * Get pricing information (no auth required)
 */
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      free: {
        name: 'Free Plan',
        price: 0,
        currency: 'INR',
        duration: 'Forever',
        features: [
          'Up to 1 instance',
          'Up to 1 application',
          'Up to 2 pipelines',
          'Up to 3 containers',
          'Basic monitoring',
          'Community support'
        ],
        limits: getUsageLimits(false)
      },
      pro: {
        name: 'Pro Plan',
        price: parseInt(process.env.PRO_PLAN_AMOUNT || '9900') / 100,
        currency: 'INR',
        duration: `${process.env.PRO_PLAN_DURATION_DAYS || 30} days`,
        features: [
          'Unlimited instances',
          'Unlimited applications',
          'Unlimited pipelines',
          'Unlimited containers',
          'Advanced monitoring',
          'Priority support',
          'Advanced scenarios',
          'Custom configurations'
        ],
        limits: getUsageLimits(true),
        buttonText: 'Upgrade to Pro 🚀'
      }
    });
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    return res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

export default router;
