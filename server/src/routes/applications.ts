import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { getUsageLimits } from '../lib/paymentService.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all applications for logged-in user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create application
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      status,
      image,
      port,
      envVars,
      strategy,
      requests,
      healthCheck,
      activeVersion,
      deployments,
      assignedInstances
    } = req.body;

    // Use transaction to prevent race conditions
    try {
      const application = await prisma.$transaction(async (tx) => {
        // Fetch user within transaction
        const user = await tx.user.findUnique({
          where: { id: req.userId! }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Get plan status with defaults for backward compatibility
        const isPro = (user as any).isPro ?? false;
        const planExpiry = (user as any).planExpiry;

        // Check if plan expired and downgrade if needed
        let finalIsPro = isPro;
        if (isPro && planExpiry && new Date() > new Date(planExpiry)) {
          // Downgrade expired plan
          await tx.user.update({
            where: { id: req.userId! },
            data: { 
              isPro: false, 
              planType: 'free', 
              planExpiry: null 
            }
          });
          finalIsPro = false;
        }

        // Free users can only create 1 application
        const isFreeUser = !finalIsPro;
        if (isFreeUser) {
          const existingApplications = await tx.application.count({
            where: { userId: req.userId! }
          });

          if (existingApplications >= 1) {
            throw new Error('FREE_PLAN_LIMIT_EXCEEDED');
          }
        }

        // Create application within the same transaction
        const newApplication = await tx.application.create({
          data: {
            userId: req.userId!,
            name,
            type,
            status: status || 'running',
            image,
            port,
            envVars,
            strategy: strategy || 'Rolling',
            requests,
            healthCheck,
            activeVersion,
            deployments: deployments || [],
            assignedInstances: assignedInstances || []
          }
        });

        return newApplication;
      });

      res.status(201).json(application);
    } catch (txError: any) {
      if (txError.message === 'FREE_PLAN_LIMIT_EXCEEDED') {
        const limits = getUsageLimits(false);
        return res.status(403).json({
          error: 'Upgrade to Pro plan to create more applications',
          limit: limits.maxApplications,
          upgradeUrl: '/pricing',
          isPro: false
        });
      }
      if (txError.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw txError;
    }
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Get single application
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Update application
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const updateData: any = {};
    
    // Only include fields that are provided
    const allowedFields = [
      'name', 'type', 'status', 'image', 'port', 'envVars', 'strategy',
      'requests', 'healthCheck', 'activeVersion', 'deployments', 'assignedInstances'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const application = await prisma.application.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      data: updateData
    });

    if (application.count === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updated = await prisma.application.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.application.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
