import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get all alerts for user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, severity } = req.query;
    
    const alerts = await prisma.alert.findMany({
      where: {
        userId: req.userId!,
        ...(status && { status: status as string }),
        ...(severity && { severity: severity as string })
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(alerts);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Create alert
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { type, severity, message, source, metadata } = req.body;

    const alert = await prisma.alert.create({
      data: {
        userId: req.userId!,
        type,
        severity,
        message,
        source,
        metadata,
        status: 'active'
      }
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update alert (acknowledge/resolve)
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;

    const updateData: any = { status };
    
    if (status === 'acknowledged' && !req.body.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
    }
    
    if (status === 'resolved' && !req.body.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const result = await prisma.alert.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      },
      data: updateData
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updated = await prisma.alert.findUnique({
      where: { id: req.params.id }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete alert
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.alert.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export default router;
