import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/adminAuth.js';
import prisma from '../lib/prisma.js';
import { sendEmail } from '../lib/emailService.js';
import { wrapEmailHtml, applyInlineMarkdownBold } from '../emails/emailShell.js';
import { isActive, ACTIVE_WINDOW_DAYS } from '../lib/activity.js';

const router = Router();
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats -- dashboard summary
router.get('/stats', async (_req, res) => {
  try {
    const [totalUsers, verifiedUsers, proUsers, users, payments] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isPro: true } }),
      prisma.user.findMany({ select: { createdAt: true, gameState: { select: { updatedAt: true } } } }),
      prisma.payment.aggregate({ where: { status: 'completed' }, _sum: { amount: true }, _count: true }),
    ]);

    const activeUsers = users.filter((u) => isActive(u.gameState?.updatedAt ?? null)).length;

    // Signups per day for the last 14 days, for a simple trend chart
    const signupsByDay: Record<string, number> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const day = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      signupsByDay[day] = 0;
    }
    users.forEach((u) => {
      const day = u.createdAt.toISOString().slice(0, 10);
      if (day in signupsByDay) signupsByDay[day]++;
    });

    res.json({
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      proUsers,
      freeUsers: totalUsers - proUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      activeWindowDays: ACTIVE_WINDOW_DAYS,
      totalRevenuePaise: payments._sum.amount ?? 0,
      completedPaymentCount: payments._count,
      signups: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// GET /api/admin/users -- searchable/filterable user list
router.get('/users', async (req, res) => {
  try {
    const search = (req.query.search as string || '').trim().toLowerCase();
    const planFilter = req.query.plan as string | undefined; // 'pro' | 'free'
    const moduleFilter = req.query.module as string | undefined;
    const activityFilter = req.query.activity as string | undefined; // 'active' | 'inactive'
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));

    const where: any = {};
    if (planFilter === 'pro') where.isPro = true;
    if (planFilter === 'free') where.isPro = false;
    if (moduleFilter) where.profile = { selectedModules: { has: moduleFilter } };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        isVerified: true,
        isPro: true,
        planType: true,
        isAdmin: true,
        createdAt: true,
        profile: { select: { fullName: true, occupation: true, institute: true, selectedModules: true, onboardingComplete: true } },
        gameState: { select: { updatedAt: true, score: true } },
        _count: { select: { applications: true, instances: true, containers: true, pipelines: true, tickets: true } },
      },
    });

    let filtered = users.map((u) => {
      const lastActiveAt = u.gameState?.updatedAt ?? null;
      return {
        id: u.id,
        email: u.email,
        fullName: u.profile?.fullName ?? null,
        occupation: u.profile?.occupation ?? null,
        institute: u.profile?.institute ?? null,
        isVerified: u.isVerified,
        isPro: u.isPro,
        planType: u.planType,
        isAdmin: u.isAdmin,
        createdAt: u.createdAt,
        selectedModules: u.profile?.selectedModules ?? [],
        onboardingComplete: u.profile?.onboardingComplete ?? true,
        lastActiveAt,
        isActive: isActive(lastActiveAt),
        score: u.gameState?.score ?? 0,
        resourceCounts: u._count,
      };
    });

    if (search) {
      filtered = filtered.filter(
        (u) => u.email.toLowerCase().includes(search) || (u.fullName?.toLowerCase().includes(search) ?? false)
      );
    }
    if (activityFilter === 'active') filtered = filtered.filter((u) => u.isActive);
    if (activityFilter === 'inactive') filtered = filtered.filter((u) => !u.isActive);

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const start = (page - 1) * limit;
    const pageItems = filtered.slice(start, start + limit);

    res.json({ users: pageItems, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// GET /api/admin/users/:id -- full detail for one user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        isVerified: true,
        isPro: true,
        planType: true,
        planExpiry: true,
        isAdmin: true,
        createdAt: true,
        profile: true,
        gameState: { select: { updatedAt: true, score: true, tick: true, isRunning: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: {
          select: {
            applications: true, instances: true, containers: true, pipelines: true,
            tickets: true, images: true, scenarios: true,
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { passwordHash, otpCode, otpExpiry, resetPasswordOtp, resetPasswordOtpExpiry, tokenVersion, ...safe } = user as any;
    res.json(safe);
  } catch (error) {
    console.error('Admin user detail error:', error);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

const updatePlanSchema = z.object({
  isPro: z.boolean(),
});

// PATCH /api/admin/users/:id/plan -- manually grant/revoke Pro (support tool)
router.patch('/users/:id/plan', async (req: AuthRequest, res) => {
  try {
    const { isPro } = updatePlanSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: isPro
        ? { isPro: true, planType: 'pro', planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
        : { isPro: false, planType: 'free', planExpiry: null },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.userId!,
        action: isPro ? 'grant_pro' : 'revoke_pro',
        targetType: 'user',
        targetId: updated.id,
        metadata: { targetEmail: updated.email }
      }
    });

    res.json({ message: `${updated.email} is now on the ${updated.planType} plan`, isPro: updated.isPro, planType: updated.planType });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Admin plan update error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

const broadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(20000),
  target: z.enum(['all', 'inactive', 'pro', 'free']),
});

function wrapBroadcastHtml(message: string): string {
  const paragraphs = message
    .split('\n\n')
    .map((p) => `<p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-line;">${applyInlineMarkdownBold(p)}</p>`)
    .join('\n');

  return wrapEmailHtml(paragraphs);
}

// POST /api/admin/broadcast-email -- compose + send to a filtered user set.
// Sends are awaited (in parallel, not sequential) BEFORE responding. A
// prior version responded immediately and sent in a "fire and forget"
// background loop after res.json() -- that works on a long-running local
// server, but Vercel serverless functions can freeze/tear down execution
// right after the response is flushed, so that background code never
// reliably finished (often not at all). Sending in parallel keeps total
// wall-clock time low enough to stay within the function's execution
// limit at this app's scale (tens of users); a much larger user base
// would need a real background job queue instead.
router.post('/broadcast-email', async (req: AuthRequest, res) => {
  try {
    const { subject, message, target } = broadcastSchema.parse(req.body);

    const users = await prisma.user.findMany({
      where: { isVerified: true },
      select: { id: true, email: true, isPro: true, gameState: { select: { updatedAt: true } } },
    });

    let recipients = users;
    if (target === 'pro') recipients = users.filter((u) => u.isPro);
    if (target === 'free') recipients = users.filter((u) => !u.isPro);
    if (target === 'inactive') recipients = users.filter((u) => !isActive(u.gameState?.updatedAt ?? null));

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No matching recipients for that target' });
    }

    const html = wrapBroadcastHtml(message);
    const text = message;

    const results = await Promise.allSettled(
      recipients.map((r) => sendEmail(r.email, subject, html, text))
    );
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`Broadcast email failed for ${recipients[i].email}:`, r.reason);
      }
    });

    console.log(`Broadcast complete: sent=${sent} failed=${failed} target=${target}`);

    // In-app notification alongside the email, so it shows up in the bell
    // even if the email is slow, filtered to spam, or the address bounces.
    await prisma.notification.createMany({
      data: recipients.map((r) => ({ userId: r.id, title: subject, message }))
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.userId!,
        action: 'broadcast_email',
        metadata: { subject, target, recipientCount: recipients.length, sent, failed }
      }
    });

    res.json({
      message: failed === 0
        ? `Sent to all ${sent} recipient(s)`
        : `Sent to ${sent} of ${recipients.length} recipient(s) -- ${failed} failed`,
      recipientCount: recipients.length,
      sent,
      failed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Admin broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// GET /api/admin/audit-log -- who did what, when. Covers admin-only
// mutating actions (grant/revoke Pro, broadcast sends); page in from the
// most recent.
router.get('/audit-log', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { email: true } } }
      }),
      prisma.auditLog.count()
    ]);

    res.json({
      entries: entries.map((e) => ({
        id: e.id,
        actorEmail: e.actor.email,
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        metadata: e.metadata,
        createdAt: e.createdAt
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    console.error('Admin audit log error:', error);
    res.status(500).json({ error: 'Failed to load audit log' });
  }
});

export default router;
