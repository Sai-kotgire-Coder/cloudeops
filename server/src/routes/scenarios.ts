import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get all scenarios for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const scenarios = await prisma.scenario.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });
    res.json(scenarios);
  } catch (error) {
    console.error('Get scenarios error:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// Create scenario
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, type } = req.body;

    const scenario = await prisma.scenario.create({
      data: {
        userId: req.userId!,
        name,
        type,
        status: 'not_started',
        progress: 0
      }
    });

    res.status(201).json(scenario);
  } catch (error) {
    console.error('Create scenario error:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// Update scenario
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { status, progress, score, startedAt, completedAt } = req.body;

    const result = await prisma.scenario.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      data: { 
        ...(status && { status }),
        ...(progress !== undefined && { progress }),
        ...(score !== undefined && { score }),
        ...(startedAt && { startedAt: new Date(startedAt) }),
        ...(completedAt && { completedAt: new Date(completedAt) })
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const updated = await prisma.scenario.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update scenario error:', error);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// Delete scenario
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.scenario.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({ message: 'Scenario deleted' });
  } catch (error) {
    console.error('Delete scenario error:', error);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

export default router;
