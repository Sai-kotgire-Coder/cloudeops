import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

// GET /api/referral/me -- the caller's own referral code, link, and the
// users they've referred (with reward status). Rewards are only granted
// on the referred user's onboarding completion (see profile.ts), so a
// referredUser here may show rewarded:false if they haven't finished it yet.
router.get('/me', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { referralCode: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [referredUsers, rewards] = await Promise.all([
      prisma.user.findMany({
        where: { referredById: req.userId! },
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.referralReward.findMany({ where: { referrerId: req.userId! } })
    ]);

    const rewardedRefereeIds = new Set(rewards.map((r: { refereeId: string }) => r.refereeId));
    const totalPointsEarned = rewards.reduce((sum: number, r: { pointsAwarded: number }) => sum + r.pointsAwarded, 0);

    const frontendOrigin = req.get('origin') || process.env.FRONTEND_URL || '';
    const referralLink = frontendOrigin ? `${frontendOrigin}/register?ref=${user.referralCode}` : `?ref=${user.referralCode}`;

    res.json({
      referralCode: user.referralCode,
      referralLink,
      totalReferred: referredUsers.length,
      totalPointsEarned,
      referredUsers: referredUsers.map((r: { id: string; email: string; createdAt: Date }) => ({
        emailMasked: maskEmail(r.email),
        joinedAt: r.createdAt,
        rewarded: rewardedRefereeIds.has(r.id)
      }))
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({ error: 'Failed to fetch referral info' });
  }
});

export default router;
