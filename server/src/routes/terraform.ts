import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get the user's Terraform workspace
router.get('/', async (req: AuthRequest, res) => {
  try {
    let workspace = await prisma.terraformWorkspace.findUnique({
      where: { userId: req.userId! }
    });

    if (!workspace) {
      workspace = await prisma.terraformWorkspace.create({
        data: {
          userId: req.userId!,
          config: { dev: [], prod: [] },
          state: { dev: [], prod: [] },
          variables: {},
          history: []
        }
      });
    }

    res.json(workspace);
  } catch (error) {
    console.error('Get terraform workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch terraform workspace' });
  }
});

// Update the user's Terraform workspace
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const { resourceCount, appliedCount, config, state, variables, history } = req.body;

    const workspace = await prisma.terraformWorkspace.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        resourceCount: resourceCount || 0,
        appliedCount: appliedCount || 0,
        config: config ?? { dev: [], prod: [] },
        state: state ?? { dev: [], prod: [] },
        variables: variables ?? {},
        history: history ?? []
      },
      update: {
        ...(resourceCount !== undefined && { resourceCount }),
        ...(appliedCount !== undefined && { appliedCount }),
        ...(config !== undefined && { config }),
        ...(state !== undefined && { state }),
        ...(variables !== undefined && { variables }),
        ...(history !== undefined && { history })
      }
    });

    res.json(workspace);
  } catch (error) {
    console.error('Update terraform workspace error:', error);
    res.status(500).json({ error: 'Failed to update terraform workspace' });
  }
});

export default router;
