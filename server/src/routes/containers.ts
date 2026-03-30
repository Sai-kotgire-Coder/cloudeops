import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get all containers
router.get('/', async (req: AuthRequest, res) => {
  try {
    const containers = await prisma.container.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });
    res.json(containers);
  } catch (error) {
    console.error('Get containers error:', error);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

// Create container
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      imageId,
      imageName,
      image,
      status,
      port,
      cpuUsage,
      memoryUsage,
      currentRps,
      capacity,
      uptime,
      restarts,
      position
    } = req.body;

    const container = await prisma.container.create({
      data: {
        userId: req.userId!,
        name,
        imageId,
        imageName,
        image,
        port,
        status: status || 'running',
        cpuUsage: cpuUsage ?? 0,
        memoryUsage: memoryUsage ?? 0,
        currentRps: currentRps ?? 0,
        capacity: capacity ?? 100,
        uptime: uptime ?? 0,
        restarts: restarts ?? 0,
        position
      }
    });

    res.status(201).json(container);
  } catch (error) {
    console.error('Create container error:', error);
    res.status(500).json({ error: 'Failed to create container' });
  }
});

// Update container
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const updateData: any = {};
    
    // Only include fields that are provided
    const allowedFields = [
      'name', 'status', 'cpuUsage', 'memoryUsage', 'currentRps',
      'capacity', 'uptime', 'restarts', 'position', 'imageId', 'imageName'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const result = await prisma.container.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      data: updateData
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const updated = await prisma.container.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update container error:', error);
    res.status(500).json({ error: 'Failed to update container' });
  }
});

// Delete container
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.container.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Container not found' });
    }

    res.json({ message: 'Container deleted' });
  } catch (error) {
    console.error('Delete container error:', error);
    res.status(500).json({ error: 'Failed to delete container' });
  }
});

export default router;
