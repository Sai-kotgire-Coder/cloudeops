import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get the user's Monitoring workspace
router.get('/', async (req: AuthRequest, res) => {
  try {
    let workspace = await prisma.monitoringWorkspace.findUnique({
      where: { userId: req.userId! }
    });

    if (!workspace) {
      workspace = await prisma.monitoringWorkspace.create({
        data: {
          userId: req.userId!,
          panels: [],
          rules: [],
          history: []
        }
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Get monitoring workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring workspace' });
  }
});

// Update the user's Monitoring workspace
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const { panelCount, ruleCount, panels, rules, history } = req.body;

    const workspace = await prisma.monitoringWorkspace.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        panelCount: panelCount || 0,
        ruleCount: ruleCount || 0,
        panels: panels ?? [],
        rules: rules ?? [],
        history: history ?? []
      },
      update: {
        ...(panelCount !== undefined && { panelCount }),
        ...(ruleCount !== undefined && { ruleCount }),
        ...(panels !== undefined && { panels }),
        ...(rules !== undefined && { rules }),
        ...(history !== undefined && { history })
      }
    });

    res.json(workspace);
  } catch (error) {
    console.error('Update monitoring workspace error:', error);
    res.status(500).json({ error: 'Failed to update monitoring workspace' });
  }
});

export default router;
