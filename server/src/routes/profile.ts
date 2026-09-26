import { Router } from 'express';
import crypto from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { ensureGameState } from '../lib/gameState.js';

const router = Router();
router.use(authMiddleware);

// POST /api/profile/share -- generate (once) and return this user's public
// "share my profile" link token. Idempotent: a user who already has one
// just gets it back, so re-clicking "Share" never invalidates an already
// shared link.
router.post('/share', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { shareToken: true } });
    const shareToken = user?.shareToken || crypto.randomBytes(8).toString('hex');

    if (!user?.shareToken) {
      await prisma.user.update({ where: { id: req.userId! }, data: { shareToken } });
    }

    res.json({ shareToken });
  } catch (error) {
    console.error('Create profile share link error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// DELETE /api/profile/share -- revoke the public link (e.g. shared it by
// mistake, or wants it gone). A later "Share" click issues a fresh token.
router.delete('/share', async (req: AuthRequest, res) => {
  try {
    await prisma.user.update({ where: { id: req.userId! }, data: { shareToken: null } });
    res.json({ message: 'Share link revoked' });
  } catch (error) {
    console.error('Revoke profile share link error:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

const REFERRAL_BONUS_POINTS = 50;

// Fires once, the first time a referred user completes onboarding -- not
// at bare signup, so an abandoned account can't be farmed for points.
// ReferralReward's unique constraint on refereeId is the actual guard
// against double-firing (e.g. a race between two PATCH calls); the
// !before?.onboardingComplete check above just avoids the extra queries
// on every subsequent profile save.
async function maybeAwardReferralBonus(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { referredById: true, email: true } });
    if (!user?.referredById) return;

    const existingReward = await prisma.referralReward.findUnique({ where: { refereeId: userId } });
    if (existingReward) return;

    await prisma.referralReward.create({
      data: { referrerId: user.referredById, refereeId: userId, pointsAwarded: REFERRAL_BONUS_POINTS }
    });

    await ensureGameState(user.referredById);
    await ensureGameState(userId);
    await Promise.all([
      prisma.gameState.update({ where: { userId: user.referredById }, data: { score: { increment: REFERRAL_BONUS_POINTS } } }),
      prisma.gameState.update({ where: { userId }, data: { score: { increment: REFERRAL_BONUS_POINTS } } })
    ]);

    await prisma.notification.createMany({
      data: [
        {
          userId: user.referredById,
          title: 'Referral bonus earned',
          message: `You earned ${REFERRAL_BONUS_POINTS} points for referring ${user.email}!`
        },
        {
          userId,
          title: 'Welcome bonus',
          message: `You earned ${REFERRAL_BONUS_POINTS} points for joining via a referral!`
        }
      ]
    });
  } catch (error) {
    // Non-fatal -- don't fail the onboarding-completion request itself
    // over a referral bonus issue.
    console.error('Referral bonus award error:', error);
  }
}

// Get the user's profile (auto-creates with schema defaults if missing --
// existing accounts created before this feature get "all modules visible,
// onboarding already complete" defaults; brand-new registrations instead
// get an explicit empty/incomplete row created in /auth/register, so this
// auto-create path is only ever hit by pre-existing accounts).
router.get('/', async (req: AuthRequest, res) => {
  try {
    let profile = await prisma.userProfile.findUnique({
      where: { userId: req.userId! }
    });

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: { userId: req.userId! }
      });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update the user's profile (personal info fields, selected modules, and/or
// marking onboarding complete). Every field is optional -- only provided
// keys are written, so partial saves (e.g. just toggling a module) work.
router.patch('/', async (req: AuthRequest, res) => {
  try {
    const {
      fullName,
      phone,
      linkedinUrl,
      instagramHandle,
      dateOfBirth,
      institute,
      occupation,
      selectedModules,
      onboardingComplete
    } = req.body;

    const data: Record<string, unknown> = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone;
    if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl;
    if (instagramHandle !== undefined) data.instagramHandle = instagramHandle;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (institute !== undefined) data.institute = institute;
    if (occupation !== undefined) data.occupation = occupation;
    if (selectedModules !== undefined) data.selectedModules = selectedModules;
    if (onboardingComplete !== undefined) data.onboardingComplete = onboardingComplete;

    const before = onboardingComplete === true
      ? await prisma.userProfile.findUnique({ where: { userId: req.userId! }, select: { onboardingComplete: true } })
      : null;

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.userId! },
      create: { userId: req.userId!, ...data },
      update: data
    });

    if (onboardingComplete === true && !before?.onboardingComplete) {
      await maybeAwardReferralBonus(req.userId!);
    }

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
