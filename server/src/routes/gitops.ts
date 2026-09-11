import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get the user's GitOps workspace
router.get('/', async (req: AuthRequest, res) => {
  try {
    let workspace = await prisma.gitOpsWorkspace.findUnique({
      where: { userId: req.userId! }
    });

    if (!workspace) {
      workspace = await prisma.gitOpsWorkspace.create({
        data: {
          userId: req.userId!,
          apps: [],
          commits: [],
          history: []
        }
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Get gitops workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch gitops workspace' });
  }
});

// Update the user's GitOps workspace
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const { commitCount, syncCount, apps, commits, history } = req.body;

    const workspace = await prisma.gitOpsWorkspace.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        commitCount: commitCount || 0,
        syncCount: syncCount || 0,
        apps: apps ?? [],
        commits: commits ?? [],
        history: history ?? []
      },
      update: {
        ...(commitCount !== undefined && { commitCount }),
        ...(syncCount !== undefined && { syncCount }),
        ...(apps !== undefined && { apps }),
        ...(commits !== undefined && { commits }),
        ...(history !== undefined && { history })
      }
    });

    res.json(workspace);
  } catch (error) {
    console.error('Update gitops workspace error:', error);
    res.status(500).json({ error: 'Failed to update gitops workspace' });
  }
});

export default router;
