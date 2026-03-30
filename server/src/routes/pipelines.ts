import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

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

    const pipeline = await prisma.pipeline.create({
      data: {
        userId: req.userId!,
        name,
        branch: branch || 'main',
        status: 'pending',
        version: version || 'v1.0.0',
        steps: steps || []
      }
    });

    res.status(201).json(pipeline);
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
