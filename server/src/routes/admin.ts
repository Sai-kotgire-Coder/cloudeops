import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { adminMiddleware, requireAdminRole, AdminRequest } from '../middleware/adminAuth.js';
import prisma from '../lib/prisma.js';
import { sendEmail } from '../lib/emailService.js';
import { wrapEmailHtml, applyInlineMarkdownBold } from '../emails/emailShell.js';
import { isActive, ACTIVE_WINDOW_DAYS } from '../lib/activity.js';
import { toCsv } from '../lib/csv.js';

const router = Router();
router.use(authMiddleware, adminMiddleware);

// Full-admin-only gate (adminRole === null) -- used on every route that
// mutates users/plans/broadcasts or reads the audit trail. Scoped roles
// ('moderator', 'workshop_coordinator') only get the narrower gates below.
const fullAdminOnly = requireAdminRole();

// GET /api/admin/stats -- dashboard summary
router.get('/stats', async (_req, res) => {
  try {
    // Opportunistic: this is the page every admin lands on, so it's the
    // most reliable place to catch up on any scheduled broadcast whose
    // sendAt has passed, without needing a separate cron/worker process.
    await processDueScheduledBroadcasts();

    const [totalUsers, verifiedUsers, proUsers, users, payments, lastBroadcastLog] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isPro: true } }),
      prisma.user.findMany({ select: { createdAt: true, gameState: { select: { updatedAt: true } } } }),
      prisma.payment.aggregate({ where: { status: 'completed' }, _sum: { amount: true }, _count: true }),
      prisma.auditLog.findFirst({ where: { action: 'broadcast_email' }, orderBy: { createdAt: 'desc' } }),
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
      lastBroadcast: lastBroadcastLog ? {
        subject: (lastBroadcastLog.metadata as any)?.subject ?? null,
        target: (lastBroadcastLog.metadata as any)?.target ?? null,
        recipientCount: (lastBroadcastLog.metadata as any)?.recipientCount ?? 0,
        sent: (lastBroadcastLog.metadata as any)?.sent ?? 0,
        failed: (lastBroadcastLog.metadata as any)?.failed ?? 0,
        createdAt: lastBroadcastLog.createdAt,
      } : null,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

const ANALYTICS_WINDOW_DAYS = 30;

function dailyBuckets(days: number): Record<string, number> {
  const buckets: Record<string, number> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    buckets[day] = 0;
  }
  return buckets;
}

function bucketsToSeries(buckets: Record<string, number>): { date: string; count: number }[] {
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

// GET /api/admin/analytics -- 30-day trends + conversion/completion rates.
// Depends on the progress-tracking feature for module completion rates
// (UserProgress rows), and reuses the same signups-histogram shape as
// GET /stats but over a longer window.
router.get('/analytics', async (_req, res) => {
  try {
    const windowStart = new Date(Date.now() - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [totalUsers, users, gameStates, payments, completedProgress] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({ where: { createdAt: { gte: windowStart } }, select: { createdAt: true } }),
      prisma.gameState.findMany({ where: { updatedAt: { gte: windowStart } }, select: { updatedAt: true } }),
      prisma.payment.findMany({
        where: { status: 'completed', createdAt: { gte: windowStart } },
        select: { createdAt: true, amount: true }
      }),
      prisma.userProgress.groupBy({ by: ['module'], where: { completed: true }, _count: { _all: true } })
    ]);

    const signupBuckets = dailyBuckets(ANALYTICS_WINDOW_DAYS);
    users.forEach((u) => {
      const day = u.createdAt.toISOString().slice(0, 10);
      if (day in signupBuckets) signupBuckets[day]++;
    });

    // Approximates "last-active day" trend -- GameState has one row per
    // user (its updatedAt is overwritten on every save), not a historical
    // per-day activity log, so this reflects each user's most recent save,
    // not true cumulative daily-actives history.
    const dauBuckets = dailyBuckets(ANALYTICS_WINDOW_DAYS);
    gameStates.forEach((g) => {
      const day = g.updatedAt.toISOString().slice(0, 10);
      if (day in dauBuckets) dauBuckets[day]++;
    });

    const revenueBuckets = dailyBuckets(ANALYTICS_WINDOW_DAYS);
    payments.forEach((p) => {
      const day = p.createdAt.toISOString().slice(0, 10);
      if (day in revenueBuckets) revenueBuckets[day] += p.amount;
    });

    const moduleCompletionRates = completedProgress.map((row: { module: string; _count: { _all: number } }) => ({
      module: row.module,
      completedCount: row._count._all,
      completionRate: totalUsers > 0 ? row._count._all / totalUsers : 0
    }));

    const proUsers = await prisma.user.count({ where: { isPro: true } });

    res.json({
      windowDays: ANALYTICS_WINDOW_DAYS,
      signups: bucketsToSeries(signupBuckets),
      dailyActive: bucketsToSeries(dauBuckets),
      revenuePaise: bucketsToSeries(revenueBuckets),
      moduleCompletionRates,
      proConversionRate: totalUsers > 0 ? proUsers / totalUsers : 0,
      totalUsers,
      proUsers
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// GET /api/admin/users -- searchable/filterable user list
router.get('/users', fullAdminOnly, async (req, res) => {
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

// GET /api/admin/users/export -- CSV of every user matching the same
// search/plan/activity filters as the list view above. Registered before
// /users/:id so Express doesn't match "export" as an :id param.
router.get('/users/export', fullAdminOnly, async (req, res) => {
  try {
    const search = (req.query.search as string || '').trim().toLowerCase();
    const planFilter = req.query.plan as string | undefined;
    const activityFilter = req.query.activity as string | undefined;

    const where: any = {};
    if (planFilter === 'pro') where.isPro = true;
    if (planFilter === 'free') where.isPro = false;

    const users = await prisma.user.findMany({
      where,
      select: {
        email: true, isVerified: true, isPro: true, planType: true, createdAt: true,
        profile: { select: { fullName: true, institute: true, occupation: true } },
        gameState: { select: { updatedAt: true, score: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    let rows = users.map((u) => ({
      email: u.email,
      fullName: u.profile?.fullName ?? '',
      institute: u.profile?.institute ?? '',
      occupation: u.profile?.occupation ?? '',
      plan: u.planType,
      verified: u.isVerified,
      active: isActive(u.gameState?.updatedAt ?? null),
      score: u.gameState?.score ?? 0,
      joinedAt: u.createdAt,
    }));

    if (search) rows = rows.filter((r) => r.email.toLowerCase().includes(search) || r.fullName.toLowerCase().includes(search));
    if (activityFilter === 'active') rows = rows.filter((r) => r.active);
    if (activityFilter === 'inactive') rows = rows.filter((r) => !r.active);

    const csv = toCsv(rows, [
      { key: 'email', label: 'Email' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'institute', label: 'Institute' },
      { key: 'occupation', label: 'Occupation' },
      { key: 'plan', label: 'Plan' },
      { key: 'verified', label: 'Verified' },
      { key: 'active', label: 'Active' },
      { key: 'score', label: 'Score' },
      { key: 'joinedAt', label: 'Joined At' },
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Admin users export error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
});

// GET /api/admin/users/:id -- full detail for one user
router.get('/users/:id', fullAdminOnly, async (req, res) => {
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
router.patch('/users/:id/plan', fullAdminOnly, async (req: AuthRequest, res) => {
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

const updateRoleSchema = z.object({
  isAdmin: z.boolean(),
  // null/omitted = full admin access (once isAdmin is true). Only meaningful
  // when isAdmin is true; ignored (stored but inert) otherwise.
  adminRole: z.enum(['moderator', 'workshop_coordinator']).nullable().optional(),
});

// PATCH /api/admin/users/:id/role -- grant/revoke admin access and scope it
// to a narrower role. Full-admin-only, since letting a moderator hand out
// admin access (to themselves or anyone else) would be a privilege-escalation
// hole -- only the unrestricted (adminRole === null) tier can grant it.
router.patch('/users/:id/role', fullAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { isAdmin, adminRole } = updateRoleSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isAdmin, adminRole: isAdmin ? (adminRole ?? null) : null },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.userId!,
        action: isAdmin ? 'grant_admin' : 'revoke_admin',
        targetType: 'user',
        targetId: updated.id,
        metadata: { targetEmail: updated.email, adminRole: updated.adminRole },
      },
    });

    res.json({
      message: isAdmin
        ? `${updated.email} is now an admin${updated.adminRole ? ` (${updated.adminRole})` : ' (full access)'}`
        : `${updated.email} is no longer an admin`,
      isAdmin: updated.isAdmin,
      adminRole: updated.adminRole,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Admin role update error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

const broadcastTargetSchema = z.enum(['all', 'inactive', 'pro', 'free', 'recent', 'custom']);

const broadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(20000),
  target: broadcastTargetSchema,
  // Only used when target === 'recent' -- "joined within the last N days".
  recentDays: z.number().int().positive().max(365).optional(),
  // Only used when target === 'custom' -- a hand-picked list of user ids
  // from the admin's Users table.
  userIds: z.array(z.string()).min(1).max(5000).optional(),
  // If present and in the future, this queues a ScheduledBroadcast instead
  // of sending immediately -- everything else about the request is
  // identical, just replayed later through the same send path.
  sendAt: z.string().datetime().optional(),
});

function wrapBroadcastHtml(message: string): string {
  const paragraphs = message
    .split('\n\n')
    .map((p) => `<p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-line;">${applyInlineMarkdownBold(p)}</p>`)
    .join('\n');

  return wrapEmailHtml(paragraphs);
}

type BroadcastTarget = z.infer<typeof broadcastTargetSchema>;

async function resolveRecipients(target: BroadcastTarget, recentDays: number | null | undefined, userIds: string[] | null | undefined) {
  const users = await prisma.user.findMany({
    where: { isVerified: true },
    select: { id: true, email: true, isPro: true, createdAt: true, gameState: { select: { updatedAt: true } } },
  });

  let recipients = users;
  if (target === 'pro') recipients = users.filter((u) => u.isPro);
  if (target === 'free') recipients = users.filter((u) => !u.isPro);
  if (target === 'inactive') recipients = users.filter((u) => !isActive(u.gameState?.updatedAt ?? null));
  if (target === 'recent') {
    const windowMs = (recentDays ?? 7) * 24 * 60 * 60 * 1000;
    recipients = users.filter((u) => u.createdAt.getTime() > Date.now() - windowMs);
  }
  if (target === 'custom') {
    const idSet = new Set(userIds ?? []);
    recipients = users.filter((u) => idSet.has(u.id));
  }
  return recipients;
}

// Shared by the immediate-send route below and processDueScheduledBroadcasts
// -- same send-then-notify-then-audit sequence either way, just triggered
// at a different time. Sends are awaited in parallel (not sequential, not
// fire-and-forget) BEFORE returning -- a Vercel serverless function can
// freeze/tear down execution right after its response is flushed, so
// background work started after res.json() never reliably finishes.
async function executeBroadcast(params: {
  actorId: string;
  subject: string;
  message: string;
  target: BroadcastTarget;
  recentDays?: number;
  userIds?: string[];
}): Promise<{ recipientCount: number; sent: number; failed: number } | { error: string }> {
  const { actorId, subject, message, target, recentDays, userIds } = params;

  if (target === 'custom' && (!userIds || userIds.length === 0)) {
    return { error: 'Select at least one user for a custom send' };
  }

  const recipients = await resolveRecipients(target, recentDays, userIds);
  if (recipients.length === 0) {
    return { error: 'No matching recipients for that target' };
  }

  const html = wrapBroadcastHtml(message);
  const results = await Promise.allSettled(
    recipients.map((r) => sendEmail(r.email, subject, html, message))
  );
  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - sent;

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Broadcast email failed for ${recipients[i].email}:`, r.reason);
    }
  });

  console.log(`Broadcast complete: sent=${sent} failed=${failed} target=${target}`);

  await prisma.notification.createMany({
    data: recipients.map((r) => ({ userId: r.id, title: subject, message }))
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'broadcast_email',
      metadata: {
        subject, target, recipientCount: recipients.length, sent, failed,
        ...(target === 'recent' && { recentDays: recentDays ?? 7 }),
        ...(target === 'custom' && { requestedCount: userIds?.length ?? 0 })
      }
    }
  });

  return { recipientCount: recipients.length, sent, failed };
}

// Runs whenever GET /stats is loaded (see above) -- picks up any
// ScheduledBroadcast whose sendAt has passed and replays it through the
// same executeBroadcast() path as an immediate send, then marks it
// sent/failed so it's never processed twice.
async function processDueScheduledBroadcasts(): Promise<void> {
  const due = await prisma.scheduledBroadcast.findMany({
    where: { status: 'pending', sendAt: { lte: new Date() } },
  });

  for (const job of due) {
    try {
      const result = await executeBroadcast({
        actorId: job.createdById,
        subject: job.subject,
        message: job.message,
        target: job.target as BroadcastTarget,
        recentDays: job.recentDays ?? undefined,
        userIds: job.userIds.length ? job.userIds : undefined,
      });

      await prisma.scheduledBroadcast.update({
        where: { id: job.id },
        data: {
          status: 'error' in result ? 'failed' : 'sent',
          sentAt: new Date(),
          result: result as any,
        },
      });
    } catch (error) {
      console.error(`Scheduled broadcast ${job.id} failed:`, error);
      await prisma.scheduledBroadcast.update({
        where: { id: job.id },
        data: { status: 'failed', sentAt: new Date(), result: { error: 'Unexpected error' } },
      });
    }
  }
}

// POST /api/admin/broadcast-email -- compose + send to a filtered user set
// now, or queue it for a future sendAt (see ScheduledBroadcast).
router.post('/broadcast-email', fullAdminOnly, async (req: AuthRequest, res) => {
  try {
    const { subject, message, target, recentDays, userIds, sendAt } = broadcastSchema.parse(req.body);

    if (target === 'custom' && (!userIds || userIds.length === 0)) {
      return res.status(400).json({ error: 'Select at least one user for a custom send' });
    }

    if (sendAt) {
      const sendAtDate = new Date(sendAt);
      if (sendAtDate.getTime() > Date.now()) {
        const scheduled = await prisma.scheduledBroadcast.create({
          data: {
            createdById: req.userId!,
            subject, message, target,
            recentDays: recentDays ?? null,
            userIds: userIds ?? [],
            sendAt: sendAtDate,
          },
        });
        return res.status(201).json({
          message: `Scheduled for ${sendAtDate.toLocaleString()}`,
          scheduled: true,
          id: scheduled.id,
        });
      }
      // A sendAt in the past/now is treated the same as no sendAt -- send immediately.
    }

    const result = await executeBroadcast({ actorId: req.userId!, subject, message, target, recentDays, userIds });
    if ('error' in result) return res.status(400).json({ error: result.error });

    res.json({
      message: result.failed === 0
        ? `Sent to all ${result.sent} recipient(s)`
        : `Sent to ${result.sent} of ${result.recipientCount} recipient(s) -- ${result.failed} failed`,
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Admin broadcast error:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// GET /api/admin/scheduled-broadcasts -- pending + recently-processed queue.
router.get('/scheduled-broadcasts', fullAdminOnly, async (_req, res) => {
  try {
    await processDueScheduledBroadcasts();
    const jobs = await prisma.scheduledBroadcast.findMany({
      orderBy: { sendAt: 'desc' },
      take: 50,
    });
    res.json({ jobs });
  } catch (error) {
    console.error('Admin scheduled broadcasts list error:', error);
    res.status(500).json({ error: 'Failed to load scheduled broadcasts' });
  }
});

// DELETE /api/admin/scheduled-broadcasts/:id -- cancel a still-pending send.
router.delete('/scheduled-broadcasts/:id', fullAdminOnly, async (req, res) => {
  try {
    const job = await prisma.scheduledBroadcast.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Scheduled broadcast not found' });
    if (job.status !== 'pending') return res.status(400).json({ error: `Already ${job.status}, can't cancel` });

    await prisma.scheduledBroadcast.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    res.json({ message: 'Scheduled broadcast cancelled' });
  } catch (error) {
    console.error('Admin cancel scheduled broadcast error:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled broadcast' });
  }
});

// GET /api/admin/audit-log -- who did what, when. Covers admin-only
// mutating actions (grant/revoke Pro, broadcast sends); page in from the
// most recent.
router.get('/audit-log', fullAdminOnly, async (req, res) => {
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

const moderatorOnly = requireAdminRole('moderator');

// GET /api/admin/submissions -- moderation queue for user-submitted
// community content (documentation/research papers/blogs), default filter
// 'pending' since that's what actually needs admin attention.
router.get('/submissions', moderatorOnly, async (req, res) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const [submissions, total] = await Promise.all([
      prisma.communitySubmission.findMany({
        where: { status },
        include: { author: { select: { email: true } } },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.communitySubmission.count({ where: { status } })
    ]);

    res.json({
      submissions: submissions.map((s: any) => ({ ...s, authorEmail: s.author.email, author: undefined })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    console.error('Admin get submissions error:', error);
    res.status(500).json({ error: 'Failed to load submissions' });
  }
});

// GET /api/admin/submissions/export -- CSV of submissions, filterable by
// status (defaults to every status, not just pending, since this is for
// record-keeping rather than the moderation queue itself).
router.get('/submissions/export', moderatorOnly, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const submissions = await prisma.communitySubmission.findMany({
      where: status ? { status } : undefined,
      include: { author: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const csv = toCsv(
      submissions.map((s) => ({
        title: s.title,
        type: s.type,
        status: s.status,
        authorEmail: s.author.email,
        helpfulCount: s.helpfulCount,
        createdAt: s.createdAt,
        reviewedAt: s.reviewedAt,
      })),
      [
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'authorEmail', label: 'Author Email' },
        { key: 'helpfulCount', label: 'Helpful Votes' },
        { key: 'createdAt', label: 'Submitted At' },
        { key: 'reviewedAt', label: 'Reviewed At' },
      ]
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="submissions-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Admin submissions export error:', error);
    res.status(500).json({ error: 'Failed to export submissions' });
  }
});

const reviewSubmissionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNote: z.string().max(2000).optional()
});

// PATCH /api/admin/submissions/:id -- approve or reject a submission. On
// approval, broadcasts a Notification to every verified user -- the same
// bulk-notify shape as broadcast-email below -- and writes an AuditLog
// entry either way, matching every other admin mutating action in this file.
router.patch('/submissions/:id', moderatorOnly, async (req: AuthRequest, res) => {
  try {
    const { status, reviewNote } = reviewSubmissionSchema.parse(req.body);

    const submission = await prisma.communitySubmission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'pending') {
      return res.status(400).json({ error: `This submission was already ${submission.status}` });
    }

    const updated = await prisma.communitySubmission.update({
      where: { id: req.params.id },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedById: req.userId!,
        reviewedAt: new Date()
      }
    });

    if (status === 'approved') {
      const recipients = await prisma.user.findMany({ where: { isVerified: true }, select: { id: true } });
      await prisma.notification.createMany({
        data: recipients.map((r: { id: string }) => ({
          userId: r.id,
          title: 'New community submission published',
          message: `"${updated.title}" was just published to the community library.`
        }))
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: req.userId!,
        action: status === 'approved' ? 'approve_submission' : 'reject_submission',
        targetType: 'submission',
        targetId: updated.id,
        metadata: { title: updated.title, reviewNote: reviewNote || null }
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Admin review submission error:', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
});

const workshopCoordinatorOnly = requireAdminRole('workshop_coordinator');

const workshopSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  highlights: z.array(z.string().min(1).max(300)).max(10).default([]),
  location: z.string().min(1).max(500),
  isOnline: z.boolean().default(true),
  // Sent as ISO datetimes from a <input type="datetime-local"> -- the form
  // collects IST wall-clock time and converts to UTC client-side before
  // this ever reaches the server, same as the scheduled-broadcast form.
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  dailyCount: z.number().int().min(1).max(14),
  isPublished: z.boolean().default(false),
});

// GET /api/admin/workshops -- every workshop ever scheduled, newest first.
// This is the "Manage Workshops" list -- create/edit/publish happens here.
router.get('/workshops', workshopCoordinatorOnly, async (_req, res) => {
  try {
    const workshops = await prisma.workshop.findMany({
      orderBy: { startAt: 'desc' },
      include: { _count: { select: { registrations: true } } },
    });
    res.json({ workshops });
  } catch (error) {
    console.error('Admin list workshops error:', error);
    res.status(500).json({ error: 'Failed to load workshops' });
  }
});

// POST /api/admin/workshops -- schedule a new workshop. Starts unpublished
// unless the form explicitly checks "Publish" -- lets an admin draft one
// before it's visible on the public site.
router.post('/workshops', workshopCoordinatorOnly, async (req: AuthRequest, res) => {
  try {
    const data = workshopSchema.parse(req.body);

    const workshop = await prisma.workshop.create({
      data: {
        ...data,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        createdById: req.userId!,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.userId!,
        action: 'create_workshop',
        targetType: 'workshop',
        targetId: workshop.id,
        metadata: { title: workshop.title, isPublished: workshop.isPublished },
      },
    });

    res.status(201).json(workshop);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Admin create workshop error:', error);
    res.status(500).json({ error: 'Failed to create workshop' });
  }
});

// PATCH /api/admin/workshops/:id -- edit any field, including toggling
// isPublished (the only thing that controls whether it's live on the
// public site -- see GET /api/workshop/current).
router.patch('/workshops/:id', workshopCoordinatorOnly, async (req: AuthRequest, res) => {
  try {
    const data = workshopSchema.partial().parse(req.body);
    const existing = await prisma.workshop.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Workshop not found' });

    const workshop = await prisma.workshop.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.startAt && { startAt: new Date(data.startAt) }),
        ...(data.endAt && { endAt: new Date(data.endAt) }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.userId!,
        action: 'update_workshop',
        targetType: 'workshop',
        targetId: workshop.id,
        metadata: { title: workshop.title, isPublished: workshop.isPublished },
      },
    });

    res.json(workshop);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Admin update workshop error:', error);
    res.status(500).json({ error: 'Failed to update workshop' });
  }
});

// DELETE /api/admin/workshops/:id -- also drops its registrations (FK
// cascade). Meant for a draft created by mistake, not a live one with real
// registrants -- the confirm dialog on the frontend warns when there are any.
router.delete('/workshops/:id', workshopCoordinatorOnly, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.workshop.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Workshop not found' });

    await prisma.workshop.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        actorId: req.userId!,
        action: 'delete_workshop',
        targetType: 'workshop',
        targetId: req.params.id,
        metadata: { title: existing.title },
      },
    });

    res.json({ message: 'Workshop deleted' });
  } catch (error) {
    console.error('Admin delete workshop error:', error);
    res.status(500).json({ error: 'Failed to delete workshop' });
  }
});

// GET /api/admin/workshop-registrations -- who signed up, newest first.
// Optionally scoped to one workshop (?workshopId=) now that more than one
// can exist; omitted shows every registration across every workshop.
router.get('/workshop-registrations', workshopCoordinatorOnly, async (req, res) => {
  try {
    const workshopId = req.query.workshopId as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const where = workshopId ? { workshopId } : {};

    const [registrations, total, linkedCount] = await Promise.all([
      prisma.workshopRegistration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { workshop: { select: { title: true } } },
      }),
      prisma.workshopRegistration.count({ where }),
      prisma.workshopRegistration.count({ where: { ...where, userId: { not: null } } }),
    ]);

    res.json({
      registrations: registrations.map((r) => ({ ...r, workshopTitle: r.workshop.title, workshop: undefined })),
      total,
      linkedCount,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Admin workshop registrations error:', error);
    res.status(500).json({ error: 'Failed to load workshop registrations' });
  }
});

// GET /api/admin/workshop-registrations/export -- CSV of every registrant
// (optionally one workshop via ?workshopId=), for coordinating the actual
// workshop (invites, attendance, follow-up).
router.get('/workshop-registrations/export', workshopCoordinatorOnly, async (req, res) => {
  try {
    const workshopId = req.query.workshopId as string | undefined;
    const registrations = await prisma.workshopRegistration.findMany({
      where: workshopId ? { workshopId } : {},
      orderBy: { createdAt: 'desc' },
      include: { workshop: { select: { title: true } } },
    });

    const csv = toCsv(
      registrations.map((r) => ({
        workshop: r.workshop.title,
        name: r.name,
        email: r.email,
        phone: r.phone ?? '',
        hasAccount: !!r.userId,
        registeredAt: r.createdAt,
      })),
      [
        { key: 'workshop', label: 'Workshop' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'hasAccount', label: 'Has CloudOps Account' },
        { key: 'registeredAt', label: 'Registered At' },
      ]
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="workshop-registrations-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Admin workshop registrations export error:', error);
    res.status(500).json({ error: 'Failed to export workshop registrations' });
  }
});

export default router;
