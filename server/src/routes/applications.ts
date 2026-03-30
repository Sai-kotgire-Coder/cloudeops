import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all applications for logged-in user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create application
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      type,
      status,
      image,
      port,
      envVars,
      strategy,
      requests,
      healthCheck,
      activeVersion,
      deployments,
      assignedInstances
    } = req.body;

    const application = await prisma.application.create({
      data: {
        userId: req.userId!,
        name,
        type,
        status: status || 'running',
        image,
        port,
        envVars,
        strategy: strategy || 'Rolling',
        requests,
        healthCheck,
        activeVersion,
        deployments: deployments || [],
        assignedInstances: assignedInstances || []
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Get single application
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Update application
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const updateData: any = {};
    
    // Only include fields that are provided
    const allowedFields = [
      'name', 'type', 'status', 'image', 'port', 'envVars', 'strategy',
      'requests', 'healthCheck', 'activeVersion', 'deployments', 'assignedInstances'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const application = await prisma.application.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      data: updateData
    });

    if (application.count === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updated = await prisma.application.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.application.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
