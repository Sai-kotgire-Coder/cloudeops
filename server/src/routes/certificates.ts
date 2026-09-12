import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// GET /api/certificates -- the caller's own earned certificates, newest first.
// Certificates are only ever created by GET /api/progress/summary when a
// module's completion threshold is first crossed.
router.get('/', async (req: AuthRequest, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.userId! },
      orderBy: { issuedAt: 'desc' }
    });
    res.json({ certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// GET /api/certificates/:code -- owner-only detail lookup for the
// view/print page. Not a public verification endpoint (see plan scope cut).
router.get('/:code', async (req: AuthRequest, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { code: req.params.code },
      include: { user: { select: { email: true, profile: { select: { fullName: true } } } } }
    });

    if (!certificate || certificate.userId !== req.userId) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

export default router;
