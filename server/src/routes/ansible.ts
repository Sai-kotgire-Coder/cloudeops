import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get the user's Ansible workspace
router.get('/', async (req: AuthRequest, res) => {
  try {
    let workspace = await prisma.ansibleWorkspace.findUnique({
      where: { userId: req.userId! }
    });

    if (!workspace) {
      workspace = await prisma.ansibleWorkspace.create({
        data: {
          userId: req.userId!,
          inventory: [],
          playbook: [],
          hostState: [],
          history: []
        }
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Get ansible workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch ansible workspace' });
  }
});

// Update the user's Ansible workspace
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const { taskCount, runCount, inventory, playbook, hostState, history } = req.body;

    const workspace = await prisma.ansibleWorkspace.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        taskCount: taskCount || 0,
        runCount: runCount || 0,
        inventory: inventory ?? [],
        playbook: playbook ?? [],
        hostState: hostState ?? [],
        history: history ?? []
      },
      update: {
        ...(taskCount !== undefined && { taskCount }),
        ...(runCount !== undefined && { runCount }),
        ...(inventory !== undefined && { inventory }),
        ...(playbook !== undefined && { playbook }),
        ...(hostState !== undefined && { hostState }),
        ...(history !== undefined && { history })
      }
    });

    res.json(workspace);
  } catch (error) {
    console.error('Update ansible workspace error:', error);
    res.status(500).json({ error: 'Failed to update ansible workspace' });
  }
});

export default router;
