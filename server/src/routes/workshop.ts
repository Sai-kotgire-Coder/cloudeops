import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { sendEmail } from '../lib/emailService.js';
import { wrapEmailHtml } from '../emails/emailShell.js';
import { buildRecurringInviteIcs, buildGoogleCalendarLink } from '../lib/calendarInvite.js';
import { emailLimiter } from '../middleware/rateLimit.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Best-effort: if the registrant happens to be logged in (an existing
// CloudOps user filling out the public form), attach their userId so the
// workshop-cohort leaderboard can find them later. Never blocks
// registration if the token is missing/expired/invalid -- this route stays
// public either way.
async function optionalUserId(req: import('express').Request): Promise<string | undefined> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ') || !process.env.JWT_SECRET) return undefined;
  try {
    const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return undefined;
  }
}

// The one workshop the public site (landing page + /workshop) promotes at
// any given time: the soonest published workshop whose last day hasn't
// finished yet. "Last day" = startAt's calendar day + (dailyCount - 1)
// days, compared against endAt's time-of-day, so a still-running final
// session doesn't disappear partway through.
async function getCurrentWorkshop() {
  const candidates = await prisma.workshop.findMany({
    where: { isPublished: true },
    orderBy: { startAt: 'asc' },
  });

  const now = Date.now();
  return candidates.find((w) => {
    const lastDayEnd = new Date(w.endAt);
    lastDayEnd.setUTCDate(lastDayEnd.getUTCDate() + (w.dailyCount - 1));
    return lastDayEnd.getTime() > now;
  }) ?? null;
}

function serializeWorkshop(w: NonNullable<Awaited<ReturnType<typeof getCurrentWorkshop>>>) {
  return {
    id: w.id,
    title: w.title,
    summary: w.summary,
    highlights: w.highlights,
    location: w.location,
    isOnline: w.isOnline,
    startAt: w.startAt,
    endAt: w.endAt,
    dailyCount: w.dailyCount,
  };
}

// GET /api/workshop/current -- public. The landing page promo card and the
// /workshop registration page both render whatever this resolves to (or
// hide themselves if it's null, i.e. nothing is currently published/upcoming).
router.get('/current', async (_req, res) => {
  try {
    const workshop = await getCurrentWorkshop();
    res.json({ workshop: workshop ? serializeWorkshop(workshop) : null });
  } catch (error) {
    console.error('Get current workshop error:', error);
    res.status(500).json({ error: 'Failed to load workshop' });
  }
});

const registerSchema = z.object({
  workshopId: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional()
});

function formatDateRange(startAt: Date, dailyCount: number): string {
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' };
  const first = startAt.toLocaleDateString('en-US', opts);
  if (dailyCount <= 1) return first;
  const last = new Date(startAt);
  last.setUTCDate(last.getUTCDate() + (dailyCount - 1));
  return `${first} - ${last.toLocaleDateString('en-US', opts)}`;
}

function formatTimeRange(startAt: Date, endAt: Date): string {
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true };
  return `${startAt.toLocaleTimeString('en-US', opts)} - ${endAt.toLocaleTimeString('en-US', opts)} IST`;
}

function buildConfirmationHtml(name: string, workshop: { title: string; location: string; isOnline: boolean; startAt: Date; endAt: Date; dailyCount: number; highlights: string[] }, calendarLink: string): string {
  return wrapEmailHtml(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;">You're registered for <strong>${workshop.title}</strong> 🎉</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:20px;">
          <p style="margin:0 0 8px; font-weight:700; color:#1d4ed8;">${formatDateRange(workshop.startAt, workshop.dailyCount)} &middot; ${formatTimeRange(workshop.startAt, workshop.endAt)}</p>
          <p style="margin:0 0 8px; color:#374151;">${workshop.isOnline ? 'Online' : 'Location'}: <a href="${workshop.location}">${workshop.location}</a></p>
          <p style="margin:0; color:#6b7280; font-size:13px;">A calendar invite is attached to this email -- accept it to add ${workshop.dailyCount > 1 ? 'every session' : 'it'} to your calendar automatically.</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;">
      <a href="${calendarLink}" style="color:#1d4ed8;">Or click here to add it to Google Calendar</a>
    </p>
    ${workshop.highlights.length > 0 ? `
    <p style="margin:0 0 8px;">What to expect:</p>
    <ul style="margin:0 0 16px; padding-left:20px; color:#374151;">
      ${workshop.highlights.map((h) => `<li>${h}</li>`).join('\n      ')}
    </ul>` : ''}
    <p style="margin:0; color:#6b7280; font-size:13px;">See you there!</p>
  `);
}

// POST /api/workshop/register -- deliberately public/unauthenticated, since
// registrants are landing here from the public marketing site and may
// never create a CloudOps account at all. Idempotent per [workshopId,
// email] -- re-submitting the same workshop's form doesn't error.
router.post('/register', emailLimiter, async (req, res) => {
  try {
    const { workshopId, name, email, phone } = registerSchema.parse(req.body);

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop || !workshop.isPublished) {
      return res.status(404).json({ error: 'This workshop is no longer accepting registrations.' });
    }

    const existing = await prisma.workshopRegistration.findUnique({
      where: { workshopId_email: { workshopId, email } }
    });
    if (existing) {
      return res.status(200).json({ message: "You're already registered -- check your inbox for the calendar invite." });
    }

    const userId = await optionalUserId(req);

    const registration = await prisma.workshopRegistration.create({
      data: { workshopId, name, email, phone: phone || null, userId }
    });

    const calendarLink = buildGoogleCalendarLink({
      summary: workshop.title,
      description: workshop.summary,
      location: workshop.location,
      startUtc: workshop.startAt,
      endUtc: workshop.endAt,
      dailyCount: workshop.dailyCount
    });

    const organizerEmail = process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || process.env.EMAIL_USER || '';

    const ics = buildRecurringInviteIcs({
      uid: `workshop-${registration.id}@cloudopssimulator`,
      organizerEmail,
      organizerName: 'CloudOps Simulator',
      attendeeEmail: email,
      attendeeName: name,
      summary: workshop.title,
      description: workshop.summary,
      location: workshop.location,
      startUtc: workshop.startAt,
      endUtc: workshop.endAt,
      dailyCount: workshop.dailyCount
    });

    try {
      await sendEmail(
        email,
        `You're registered: ${workshop.title} 🎉`,
        buildConfirmationHtml(name, workshop, calendarLink),
        `You're registered for ${workshop.title} on ${formatDateRange(workshop.startAt, workshop.dailyCount)}, ${formatTimeRange(workshop.startAt, workshop.endAt)}. ${workshop.isOnline ? 'Online' : 'Location'}: ${workshop.location}. Add to calendar: ${calendarLink}`,
        [{ filename: 'workshop-invite.ics', content: ics, contentType: 'text/calendar; method=REQUEST' }]
      );
    } catch (emailError) {
      // Registration itself already succeeded and is in the DB -- don't
      // fail the whole request over a flaky email send, since the person
      // running the workshop can still see who registered.
      console.error('Failed to send workshop confirmation email:', emailError);
    }

    res.status(201).json({ message: "You're registered! Check your email for the calendar invite." });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid input', details: error.errors });
    console.error('Workshop registration error:', error);
    res.status(500).json({ error: 'Failed to register. Please try again.' });
  }
});

function displayNameFor(email: string, fullName: string | null | undefined): string {
  return fullName?.trim() || email.split('@')[0];
}

// POST /api/workshop/link -- called once from the cohort page. Backfills
// the userId on an anonymous registration (for the CURRENT workshop) that
// matches the caller's own account email -- covers the common case of
// someone registering from the public page before ever logging in, then
// later wanting to see the cohort leaderboard from inside the app.
// Best-effort/idempotent: a no-op if there's no matching row, or it's
// already linked.
router.post('/link', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const workshop = await getCurrentWorkshop();
    if (!workshop) return res.json({ linked: false, registered: false });

    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { email: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const registration = await prisma.workshopRegistration.findUnique({
      where: { workshopId_email: { workshopId: workshop.id, email: user.email } }
    });
    if (!registration) return res.json({ linked: false, registered: false });
    if (registration.userId) return res.json({ linked: true, registered: true });

    await prisma.workshopRegistration.update({ where: { id: registration.id }, data: { userId: req.userId! } });
    res.json({ linked: true, registered: true });
  } catch (error) {
    console.error('Workshop link error:', error);
    res.status(500).json({ error: 'Failed to link your registration' });
  }
});

// GET /api/workshop/cohort -- a leaderboard scoped to just the people who
// registered for the CURRENT workshop AND have a CloudOps account (linked
// via /link above or at registration time if they were already logged
// in). Lets a workshop batch see how they're doing against each other,
// same score metric as the site-wide leaderboard.
router.get('/cohort', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const workshop = await getCurrentWorkshop();
    if (!workshop) return res.json({ cohort: [], yourRank: null, totalLinked: 0 });

    const registrants = await prisma.workshopRegistration.findMany({
      where: { workshopId: workshop.id, userId: { not: null } },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
            gameState: { select: { score: true } },
          },
        },
      },
    });

    const ranked = registrants
      .filter((r) => r.user)
      .map((r) => ({
        userId: r.user!.id,
        displayName: displayNameFor(r.user!.email, r.user!.profile?.fullName),
        score: r.user!.gameState?.score ?? 0,
        isYou: r.user!.id === req.userId,
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ rank: i + 1, ...r }));

    const yourEntry = ranked.find((r) => r.isYou) ?? null;

    res.json({ cohort: ranked, yourRank: yourEntry, totalLinked: ranked.length });
  } catch (error) {
    console.error('Workshop cohort error:', error);
    res.status(500).json({ error: 'Failed to load workshop cohort' });
  }
});

export default router;
