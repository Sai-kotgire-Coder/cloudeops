import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { getUsageLimits } from '../lib/paymentService.js';

export interface FeatureRequest extends Request {
  userId?: string;
  userPlan?: {
    isPro: boolean;
    planType: string;
  };
}

/**
 * Middleware to check if user has access to a feature based on plan
 */
export const featureGateMiddleware = (featureName: string, resourceType?: string) => {
  return async (req: FeatureRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated (get from auth middleware)
      if (!req.headers.authorization) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = req.headers.authorization.substring(7);
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, secret) as { id: string };
      const userId = decoded.id;

      // Get user and their plan
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          isPro: true,
          planType: true,
          planExpiry: true
        }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if plan expired
      let isPro = user.isPro;
      if (isPro && user.planExpiry) {
        if (new Date() > user.planExpiry) {
          // Plan expired, downgrade user
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPro: false,
              planType: 'free',
              planExpiry: null
            }
          });
          isPro = false;
        }
      }

      // Store user plan info in request
      (req as any).userPlan = {
        isPro,
        planType: user.planType
      };
      (req as any).userId = userId;

      // Free users have limited access
      if (!isPro) {
        // Define free tier restrictions
        const freeRestrictions = {
          'create_instance': true,
          'create_application': true,
          'create_pipeline': true,
          'create_container': true,
          'create_scenario': true,
          'advanced_monitoring': true,
          'custom_configurations': true
        };

        if (freeRestrictions[featureName as keyof typeof freeRestrictions]) {
          // Check usage limits
          if (resourceType) {
            const limits = getUsageLimits(false);
            let currentCount = 0;

            // Get current resource count
            if (resourceType === 'instances') {
              currentCount = await prisma.instance.count({ where: { userId } });
            } else if (resourceType === 'applications') {
              currentCount = await prisma.application.count({ where: { userId } });
            } else if (resourceType === 'pipelines') {
              currentCount = await prisma.pipeline.count({ where: { userId } });
            } else if (resourceType === 'containers') {
              currentCount = await prisma.container.count({ where: { userId } });
            }

            // Check if limit exceeded
            const limit = (limits as any)[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`];
            if (currentCount >= limit) {
              res.status(403).json({
                error: `Upgrade to Pro plan to create more ${resourceType}`,
                current: currentCount,
                limit,
                upgradeUrl: '/api/payment/pricing'
              });
              return;
            }
          }
        }
      }

      next();
    } catch (error: any) {
      console.error('Feature gating error:', error);
      res.status(500).json({ error: 'Feature gating check failed' });
    }
  };
};

/**
 * Middleware to check resource usage limits
 */
export const checkUsageLimitMiddleware = async (
  req: FeatureRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.headers.authorization) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = req.headers.authorization.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as { id: string };
    const userId = decoded.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Store in request for next middleware/handler
    (req as any).userId = userId;
    (req as any).userPlan = {
      isPro: user.isPro,
      planType: user.planType
    };

    next();
  } catch (error: any) {
    console.error('Usage check error:', error);
    res.status(500).json({ error: 'Usage check failed' });
  }
};
