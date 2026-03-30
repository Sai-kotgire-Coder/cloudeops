import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get all instances
router.get('/', async (req: AuthRequest, res) => {
  try {
    const instances = await prisma.instance.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });
    res.json(instances);
  } catch (error) {
    console.error('Get instances error:', error);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
});

// Create instance
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      status,
      cpu,
      memory,
      currentRps,
      provisionTimer,
      memoryLeakFactor,
      scaledBy,
      roleId,
      assignedAppId,
      pods,
      region
    } = req.body;

    const instance = await prisma.instance.create({
      data: {
        userId: req.userId!,
        name,
        type,
        status: status || 'running',
        cpu: cpu ?? 5,
        memory: memory ?? 20,
        currentRps: currentRps ?? 0,
        provisionTimer: provisionTimer ?? 0,
        memoryLeakFactor: memoryLeakFactor ?? 0,
        scaledBy: scaledBy || 'manual',
        roleId,
        assignedAppId,
        pods: pods || [],
        region: region || 'us-east-1'
      }
    });

    res.status(201).json(instance);
  } catch (error) {
    console.error('Create instance error:', error);
    res.status(500).json({ error: 'Failed to create instance' });
  }
});

// Update instance
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const updateData: any = {};
    
    // Only include fields that are provided
    const allowedFields = [
      'name', 'status', 'cpu', 'memory', 'currentRps', 'provisionTimer',
      'memoryLeakFactor', 'scaledBy', 'roleId', 'assignedAppId', 'pods', 'type'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const result = await prisma.instance.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      data: updateData
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    const updated = await prisma.instance.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update instance error:', error);
    res.status(500).json({ error: 'Failed to update instance' });
  }
});

// Delete instance
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.instance.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    res.json({ message: 'Instance deleted' });
  } catch (error) {
    console.error('Delete instance error:', error);
    res.status(500).json({ error: 'Failed to delete instance' });
  }
});

export default router;
