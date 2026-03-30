import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get user progress for a specific module
router.get('/:module', async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_module: {
          userId: req.userId!,
          module: req.params.module
        }
      }
    });

    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get all progress
router.get('/', async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId: req.userId! }
    });
    res.json(progress);
  } catch (error) {
    console.error('Get all progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update user progress
router.put('/:module', async (req: AuthRequest, res) => {
  try {
    const { progressJson, completed } = req.body;

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_module: {
          userId: req.userId!,
          module: req.params.module
        }
      },
      update: {
        progressJson,
        completed: completed || false
      },
      create: {
        userId: req.userId!,
        module: req.params.module,
        progressJson,
        completed: completed || false
      }
    });

    res.json(progress);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
