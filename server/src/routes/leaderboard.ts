import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

function displayNameFor(email: string, fullName: string | null | undefined): string {
  // Never show a bare full email to other users -- a set display name, or
  // just the local-part of their email as a fallback (still lets people
  // recognize themselves/each other without exposing the full address).
  return fullName?.trim() || email.split('@')[0];
}

// GET /api/leaderboard -- top users by their GameState.score (a running
// lifetime total from simulator gameplay, not a per-session high score).
// Any authenticated user can view it; also reports the caller's own rank
// even when they're outside the top list.
router.get('/', async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const users = await prisma.user.findMany({
      where: { gameState: { isNot: null } },
      select: {
        id: true,
        email: true,
        profile: { select: { fullName: true } },
        gameState: { select: { score: true } }
      },
      orderBy: { gameState: { score: 'desc' } }
    });

    const ranked = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      displayName: displayNameFor(u.email, u.profile?.fullName),
      score: u.gameState?.score ?? 0,
      isYou: u.id === req.userId
    }));

    const yourEntry = ranked.find((r) => r.isYou) ?? null;

    res.json({
      leaderboard: ranked.slice(0, limit),
      yourRank: yourEntry
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
