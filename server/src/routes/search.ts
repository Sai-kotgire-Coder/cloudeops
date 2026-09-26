import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// GET /api/search?q= -- the only piece of "global search" that actually
// needs a DB round-trip: approved community submissions. Static content
// (module catalog, docs catalog) is matched client-side against data the
// frontend already has in memory, then merged with this result -- no
// server endpoint needed for that half.
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) return res.json({ submissions: [] });

    const submissions = await prisma.communitySubmission.findMany({
      where: {
        status: 'approved',
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, type: true, summary: true },
      take: 10,
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
