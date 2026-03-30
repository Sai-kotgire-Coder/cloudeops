import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get networking state for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    let networkingState = await prisma.networkingState.findUnique({
      where: { userId: req.userId! }
    });

    // Create default networking state if doesn't exist
    if (!networkingState) {
      networkingState = await prisma.networkingState.create({
        data: {
          userId: req.userId!,
          ingressCount: 0,
          serviceCount: 0,
          podCount: 0,
          traffic: 0,
          bandwidth: 0
        }
      });
    }

    res.json(networkingState);
  } catch (error) {
    console.error('Get networking state error:', error);
    res.status(500).json({ error: 'Failed to fetch networking state' });
  }
});

// Update networking state
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const { ingressCount, serviceCount, podCount, traffic, bandwidth, configurations } = req.body;

    const networkingState = await prisma.networkingState.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        ingressCount: ingressCount || 0,
        serviceCount: serviceCount || 0,
        podCount: podCount || 0,
        traffic: traffic || 0,
        bandwidth: bandwidth || 0,
        configurations: configurations || null
      },
      update: {
        ...(ingressCount !== undefined && { ingressCount }),
        ...(serviceCount !== undefined && { serviceCount }),
        ...(podCount !== undefined && { podCount }),
        ...(traffic !== undefined && { traffic }),
        ...(bandwidth !== undefined && { bandwidth }),
        ...(configurations !== undefined && { configurations })
      }
    });

    res.json(networkingState);
  } catch (error) {
    console.error('Update networking state error:', error);
    res.status(500).json({ error: 'Failed to update networking state' });
  }
});

export default router;
