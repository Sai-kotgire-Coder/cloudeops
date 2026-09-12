import { Router } from 'express';
import crypto from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();
router.use(authMiddleware);

// Completion thresholds per module, checked against counters each lab
// workspace already tracks for its own purposes. Tunable.
const MODULE_TARGETS: Record<string, number> = {
  terraform: 3,
  ansible: 3,
  vault: 5,
  gitops: 3,
  kubectl: 10
};

function generateCertificateCode(): string {
  return crypto.randomBytes(5).toString('hex'); // 10 hex chars
}

// GET /api/progress/summary -- computed, idempotent view of every module's
// completion progress. Registered before the /:module route below since
// that route would otherwise swallow this path (Express matches "/summary"
// against ":module" = "summary" first).
router.get('/summary', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [terraform, ansible, vault, gitops, gameState, existingProgress, existingCerts] = await Promise.all([
      prisma.terraformWorkspace.findUnique({ where: { userId }, select: { appliedCount: true } }),
      prisma.ansibleWorkspace.findUnique({ where: { userId }, select: { runCount: true } }),
      prisma.vaultWorkspace.findUnique({ where: { userId }, select: { accessCount: true } }),
      prisma.gitOpsWorkspace.findUnique({ where: { userId }, select: { syncCount: true } }),
      prisma.gameState.findUnique({ where: { userId }, select: { kubectlCommandCount: true } }),
      prisma.userProgress.findMany({ where: { userId } }),
      prisma.certificate.findMany({ where: { userId } })
    ]);

    const current: Record<string, number> = {
      terraform: terraform?.appliedCount ?? 0,
      ansible: ansible?.runCount ?? 0,
      vault: vault?.accessCount ?? 0,
      gitops: gitops?.syncCount ?? 0,
      kubectl: gameState?.kubectlCommandCount ?? 0
    };

    const previouslyCompleted = new Set(
      existingProgress.filter((p: { completed: boolean }) => p.completed).map((p: { module: string }) => p.module)
    );
    const existingCertModules = new Set(existingCerts.map((c: { module: string }) => c.module));

    const summary: { module: string; current: number; target: number; completed: boolean }[] = [];
    const newlyCompleted: string[] = [];

    for (const module of Object.keys(MODULE_TARGETS)) {
      const target = MODULE_TARGETS[module];
      const value = current[module] ?? 0;
      const completed = value >= target;

      if (completed && !previouslyCompleted.has(module)) {
        newlyCompleted.push(module);
      }

      summary.push({ module, current: value, target, completed });
    }

    for (const module of newlyCompleted) {
      await prisma.userProgress.upsert({
        where: { userId_module: { userId, module } },
        update: { completed: true, progressJson: { current: current[module], target: MODULE_TARGETS[module] } },
        create: { userId, module, completed: true, progressJson: { current: current[module], target: MODULE_TARGETS[module] } }
      });

      if (!existingCertModules.has(module)) {
        await prisma.certificate.create({
          data: { userId, module, code: generateCertificateCode() }
        });
        await prisma.notification.create({
          data: {
            userId,
            title: 'Certificate earned',
            message: `🎓 You completed the ${module.charAt(0).toUpperCase() + module.slice(1)} Lab and earned a certificate!`
          }
        });
      }
    }

    res.json({ summary });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// Get user progress for a specific module
router.get('/:module', async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_module: {
          userId: req.userId!,
          module: req.params.module
        }
      }
    });

    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get all progress
router.get('/', async (req: AuthRequest, res) => {
  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId: req.userId! }
    });
    res.json(progress);
  } catch (error) {
    console.error('Get all progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update user progress
router.put('/:module', async (req: AuthRequest, res) => {
  try {
    const { progressJson, completed } = req.body;

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_module: {
          userId: req.userId!,
          module: req.params.module
        }
      },
      update: {
        progressJson,
        completed: completed || false
      },
      create: {
        userId: req.userId!,
        module: req.params.module,
        progressJson,
        completed: completed || false
      }
    });

    res.json(progress);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
