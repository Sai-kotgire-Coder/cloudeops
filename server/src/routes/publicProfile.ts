import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// Mirrors progress.ts's MODULE_TARGETS -- kept as a separate read-only copy
// here rather than importing progress.ts's route module, since this route
// must stay a pure, side-effect-free read (no cert issuance, no
// UserProgress writes) unlike GET /api/progress/summary.
const MODULE_TARGETS: Record<string, number> = {
  terraform: 3,
  ansible: 3,
  vault: 5,
  gitops: 3,
  kubectl: 10,
  monitoring: 2
};

// GET /api/public-profile/:token -- deliberately unauthenticated. A viewer
// with the link sees only what's needed for a resume/LinkedIn-style card:
// display name, score, module progress, and certificates -- never email,
// plan, or anything else from the account.
router.get('/:token', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { shareToken: req.params.token },
      select: {
        email: true,
        createdAt: true,
        profile: { select: { fullName: true, institute: true, occupation: true } },
        gameState: { select: { score: true, kubectlCommandCount: true } },
        certificates: { select: { module: true, code: true, issuedAt: true }, orderBy: { issuedAt: 'asc' } },
        terraformWorkspace: { select: { appliedCount: true } },
        ansibleWorkspace: { select: { runCount: true } },
        vaultWorkspace: { select: { accessCount: true } },
        gitopsWorkspace: { select: { syncCount: true } },
        monitoringWorkspace: { select: { ruleCount: true, panelCount: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'This share link is invalid or was revoked' });

    const current: Record<string, number> = {
      terraform: user.terraformWorkspace?.appliedCount ?? 0,
      ansible: user.ansibleWorkspace?.runCount ?? 0,
      vault: user.vaultWorkspace?.accessCount ?? 0,
      gitops: user.gitopsWorkspace?.syncCount ?? 0,
      kubectl: user.gameState?.kubectlCommandCount ?? 0,
      monitoring: Math.min(user.monitoringWorkspace?.ruleCount ?? 0, user.monitoringWorkspace?.panelCount ?? 0),
    };

    const moduleProgress = Object.entries(MODULE_TARGETS).map(([module, target]) => ({
      module,
      current: current[module] ?? 0,
      target,
      completed: (current[module] ?? 0) >= target,
    }));

    res.json({
      displayName: user.profile?.fullName || user.email.split('@')[0],
      institute: user.profile?.institute ?? null,
      occupation: user.profile?.occupation ?? null,
      memberSince: user.createdAt,
      score: user.gameState?.score ?? 0,
      moduleProgress,
      certificates: user.certificates,
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

export default router;
