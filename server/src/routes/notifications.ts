import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// GET /api/notifications -- the current user's own notifications, most
// recent first. Any authenticated user (unlike /api/admin/* routes).
router.get('/', async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId!, isRead: false }
    });
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.userId) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

router.patch('/read-all', async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
