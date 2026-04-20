import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { getUsageLimits } from '../lib/paymentService.js';

const router = Router();
router.use(authMiddleware);

// Get all pipelines
router.get('/', async (req: AuthRequest, res) => {
  try {
    const pipelines = await prisma.pipeline.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pipelines);
  } catch (error) {
    console.error('Get pipelines error:', error);
    res.status(500).json({ error: 'Failed to fetch pipelines' });
  }
});

// Create pipeline
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, branch, steps, version } = req.body;

    // Use transaction to prevent race conditions
    try {
      const pipeline = await prisma.$transaction(async (tx) => {
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

        // Free users can only create 2 pipelines
        const isFreeUser = !finalIsPro;
        if (isFreeUser) {
          const existingPipelines = await tx.pipeline.count({
            where: { userId: req.userId! }
          });

          if (existingPipelines >= 2) {
            throw new Error('FREE_PLAN_LIMIT_EXCEEDED');
          }
        }

        // Create pipeline within the same transaction
        const newPipeline = await tx.pipeline.create({
          data: {
            userId: req.userId!,
            name,
            branch: branch || 'main',
            status: 'pending',
            version: version || 'v1.0.0',
            steps: steps || []
          }
        });

        return newPipeline;
      });

      res.status(201).json(pipeline);
    } catch (txError: any) {
      if (txError.message === 'FREE_PLAN_LIMIT_EXCEEDED') {
        const limits = getUsageLimits(false);
        return res.status(403).json({
          error: 'Upgrade to Pro plan to create more pipelines',
          limit: limits.maxPipelines,
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
    console.error('Create pipeline error:', error);
    res.status(500).json({ error: 'Failed to create pipeline' });
  }
});

// Update pipeline
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { status, steps, logs } = req.body;

    const result = await prisma.pipeline.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      data: { status, steps, logs }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const updated = await prisma.pipeline.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update pipeline error:', error);
    res.status(500).json({ error: 'Failed to update pipeline' });
  }
});

// Delete pipeline
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.pipeline.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    res.json({ message: 'Pipeline deleted' });
  } catch (error) {
    console.error('Delete pipeline error:', error);
    res.status(500).json({ error: 'Failed to delete pipeline' });
  }
});

export default router;
