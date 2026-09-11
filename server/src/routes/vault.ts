import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get the user's Vault workspace
router.get('/', async (req: AuthRequest, res) => {
  try {
    let workspace = await prisma.vaultWorkspace.findUnique({
      where: { userId: req.userId! }
    });

    if (!workspace) {
      workspace = await prisma.vaultWorkspace.create({
        data: {
          userId: req.userId!,
          engines: [],
          secrets: [],
          policies: [],
          tokens: [],
          history: []
        }
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Get vault workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch vault workspace' });
  }
});

// Update the user's Vault workspace
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const { secretCount, accessCount, engines, secrets, policies, tokens, history } = req.body;

    const workspace = await prisma.vaultWorkspace.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        secretCount: secretCount || 0,
        accessCount: accessCount || 0,
        engines: engines ?? [],
        secrets: secrets ?? [],
        policies: policies ?? [],
        tokens: tokens ?? [],
        history: history ?? []
      },
      update: {
        ...(secretCount !== undefined && { secretCount }),
        ...(accessCount !== undefined && { accessCount }),
        ...(engines !== undefined && { engines }),
        ...(secrets !== undefined && { secrets }),
        ...(policies !== undefined && { policies }),
        ...(tokens !== undefined && { tokens }),
        ...(history !== undefined && { history })
      }
    });

    res.json(workspace);
  } catch (error) {
    console.error('Update vault workspace error:', error);
    res.status(500).json({ error: 'Failed to update vault workspace' });
  }
});

export default router;
