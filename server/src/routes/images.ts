import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Get all docker images
router.get('/', async (req: AuthRequest, res) => {
  try {
    const images = await prisma.dockerImage.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' }
    });
    res.json(images);
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Create docker image
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      baseImage,
      tag,
      port,
      size,
      status,
      buildProgress,
      dockerfile
    } = req.body;

    const image = await prisma.dockerImage.create({
      data: {
        userId: req.userId!,
        name,
        baseImage,
        tag: tag || 'latest',
        port: port ?? 80,
        size: size ?? 0,
        status: status || 'ready',
        buildProgress: buildProgress ?? 100,
        dockerfile
      }
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('Create image error:', error);
    res.status(500).json({ error: 'Failed to create image' });
  }
});

// Delete docker image
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await prisma.dockerImage.deleteMany({
      where: {
        id: req.params.id,
        userId: req.userId!
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;
