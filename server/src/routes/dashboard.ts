import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get dashboard state for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    let dashboardState = await prisma.dashboardState.findUnique({
      where: { userId: req.userId! }
    });

    // Create default dashboard state if doesn't exist
    if (!dashboardState) {
      dashboardState = await prisma.dashboardState.create({
        data: {
          userId: req.userId!,
          traffic: 0,
          cost: 0,
          healthScore: 100,
          activeAlerts: 0,
          uptimePercent: 100
        }
      });
    }

    res.json(dashboardState);
  } catch (error) {
    console.error('Get dashboard state error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard state' });
  }
});

// Update dashboard state
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const { traffic, cost, healthScore, activeAlerts, uptimePercent, metricsData } = req.body;

    const dashboardState = await prisma.dashboardState.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        traffic: traffic || 0,
        cost: cost || 0,
        healthScore: healthScore || 100,
        activeAlerts: activeAlerts || 0,
        uptimePercent: uptimePercent || 100,
        metricsData: metricsData || null
      },
      update: {
        ...(traffic !== undefined && { traffic }),
        ...(cost !== undefined && { cost }),
        ...(healthScore !== undefined && { healthScore }),
        ...(activeAlerts !== undefined && { activeAlerts }),
        ...(uptimePercent !== undefined && { uptimePercent }),
        ...(metricsData !== undefined && { metricsData })
      }
    });

    res.json(dashboardState);
  } catch (error) {
    console.error('Update dashboard state error:', error);
    res.status(500).json({ error: 'Failed to update dashboard state' });
  }
});

export default router;
