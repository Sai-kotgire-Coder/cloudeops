import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { MODULE_QUIZZES, PASSING_SCORE } from '../data/moduleQuizzes.js';

const router = Router();
router.use(authMiddleware);

// Completion thresholds per module, checked against counters each lab
// workspace already tracks for its own purposes. Tunable. Monitoring needs
// BOTH a rule and a panel authored, so its "current" is the smaller of the
// two counters against a target of 2 -- keeps the same single-number
// current/target shape as every other module without special-casing the
// response format.
const MODULE_TARGETS: Record<string, number> = {
  terraform: 3,
  ansible: 3,
  vault: 5,
  gitops: 3,
  kubectl: 10,
  monitoring: 2
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

    const [terraform, ansible, vault, gitops, gameState, monitoring, existingProgress, existingCerts] = await Promise.all([
      prisma.terraformWorkspace.findUnique({ where: { userId }, select: { appliedCount: true } }),
      prisma.ansibleWorkspace.findUnique({ where: { userId }, select: { runCount: true } }),
      prisma.vaultWorkspace.findUnique({ where: { userId }, select: { accessCount: true } }),
      prisma.gitOpsWorkspace.findUnique({ where: { userId }, select: { syncCount: true } }),
      prisma.gameState.findUnique({ where: { userId }, select: { kubectlCommandCount: true } }),
      prisma.monitoringWorkspace.findUnique({ where: { userId }, select: { ruleCount: true, panelCount: true } }),
      prisma.userProgress.findMany({ where: { userId } }),
      prisma.certificate.findMany({ where: { userId } })
    ]);

    const current: Record<string, number> = {
      terraform: terraform?.appliedCount ?? 0,
      ansible: ansible?.runCount ?? 0,
      vault: vault?.accessCount ?? 0,
      gitops: gitops?.syncCount ?? 0,
      kubectl: gameState?.kubectlCommandCount ?? 0,
      monitoring: Math.min(monitoring?.ruleCount ?? 0, monitoring?.panelCount ?? 0)
    };

    const previouslyCompleted = new Set(
      existingProgress.filter((p: { completed: boolean }) => p.completed).map((p: { module: string }) => p.module)
    );
    const existingCertModules = new Set(existingCerts.map((c: { module: string }) => c.module));

    const summary: { module: string; current: number; target: number; completed: boolean; certificateEarned: boolean }[] = [];
    const newlyCompleted: string[] = [];

    for (const module of Object.keys(MODULE_TARGETS)) {
      const target = MODULE_TARGETS[module];
      const value = current[module] ?? 0;
      const completed = value >= target;

      if (completed && !previouslyCompleted.has(module)) {
        newlyCompleted.push(module);
      }

      summary.push({ module, current: value, target, completed, certificateEarned: existingCertModules.has(module) });
    }

    // Reaching the threshold unlocks the module's quiz -- it no longer
    // auto-issues the certificate here. That only happens on a passing
    // POST /:module/quiz submission (see below), so "completed" (the
    // counter threshold) and "certified" (quiz passed) are now two
    // distinct, separately-tracked states.
    for (const module of newlyCompleted) {
      await prisma.userProgress.upsert({
        where: { userId_module: { userId, module } },
        update: { completed: true, progressJson: { current: current[module], target: MODULE_TARGETS[module] } },
        create: { userId, module, completed: true, progressJson: { current: current[module], target: MODULE_TARGETS[module] } }
      });

      if (!existingCertModules.has(module)) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Milestone reached',
            message: `🎯 You've reached the ${module.charAt(0).toUpperCase() + module.slice(1)} Lab milestone -- take the quick quiz to earn your certificate!`
          }
        });
      }
    }

    // "What to learn next": among the modules this user actually has
    // enabled, the one closest to completion but not yet done (a nudge to
    // finish what's in progress); if everything enabled is done, falls
    // back to any not-yet-completed module at all (a nudge to try
    // something new). Null only when every module tracked here is complete.
    const profile = await prisma.userProfile.findUnique({ where: { userId }, select: { selectedModules: true } });
    const selected = new Set(profile?.selectedModules ?? []);
    const enabledIncomplete = summary.filter((s) => !s.completed && (selected.size === 0 || selected.has(s.module)));
    const anyIncomplete = summary.filter((s) => !s.completed);
    const pool = enabledIncomplete.length > 0 ? enabledIncomplete : anyIncomplete;
    const recommendation = pool.length > 0
      ? (() => {
          const top = [...pool].sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];
          return { module: top.module, reason: top.current > 0 ? 'closest_to_completion' as const : 'not_started' as const };
        })()
      : null;

    res.json({ summary, recommendation });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// GET /api/progress/:module/quiz -- the module's quiz questions, sanitized
// (no correctIndex/explanation -- graded server-side on submit so the
// answer key never ships to the client). Requires the module's counter
// threshold to already be reached, matching the "milestone reached, quiz
// unlocked" framing surfaced above.
router.get('/:module/quiz', async (req: AuthRequest, res) => {
  try {
    const module = req.params.module;
    const questions = MODULE_QUIZZES[module];
    if (!questions) return res.status(404).json({ error: 'No quiz for this module' });

    const progress = await prisma.userProgress.findUnique({
      where: { userId_module: { userId: req.userId!, module } }
    });
    if (!progress?.completed) {
      return res.status(400).json({ error: 'Reach this module\'s milestone before taking its quiz' });
    }

    res.json({
      questions: questions.map((q) => ({ id: q.id, question: q.question, options: q.options })),
      passingScore: PASSING_SCORE
    });
  } catch (error) {
    console.error('Get module quiz error:', error);
    res.status(500).json({ error: 'Failed to load quiz' });
  }
});

const quizSubmitSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3))
});

// POST /api/progress/:module/quiz -- grade the submission server-side. A
// passing score issues the certificate (if not already earned) the exact
// same way the old auto-issue path used to, just moved here. Retakeable
// with no limit -- this is a learning tool, not a proctored exam.
router.post('/:module/quiz', async (req: AuthRequest, res) => {
  try {
    const module = req.params.module;
    const questions = MODULE_QUIZZES[module];
    if (!questions) return res.status(404).json({ error: 'No quiz for this module' });

    const { answers } = quizSubmitSchema.parse(req.body);
    if (answers.length !== questions.length) {
      return res.status(400).json({ error: `Expected ${questions.length} answers` });
    }

    const userId = req.userId!;
    const progress = await prisma.userProgress.findUnique({ where: { userId_module: { userId, module } } });
    if (!progress?.completed) {
      return res.status(400).json({ error: 'Reach this module\'s milestone before taking its quiz' });
    }

    const results = questions.map((q, i) => ({
      id: q.id,
      correct: answers[i] === q.correctIndex,
      correctIndex: q.correctIndex,
      explanation: q.explanation
    }));
    const score = results.filter((r) => r.correct).length;
    const passed = score >= PASSING_SCORE;

    let certificateAwarded = false;
    if (passed) {
      const existingCert = await prisma.certificate.findUnique({ where: { userId_module: { userId, module } } });
      if (!existingCert) {
        await prisma.certificate.create({ data: { userId, module, code: generateCertificateCode() } });
        await prisma.notification.create({
          data: {
            userId,
            title: 'Certificate earned',
            message: `🎓 You passed the ${module.charAt(0).toUpperCase() + module.slice(1)} Lab quiz and earned a certificate!`
          }
        });
        certificateAwarded = true;
      }
    }

    res.json({ passed, score, total: questions.length, certificateAwarded, results });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Submit module quiz error:', error);
    res.status(500).json({ error: 'Failed to grade quiz' });
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
