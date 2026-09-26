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

// Fixed event details for the one workshop currently running -- not worth
// generalizing into a multi-workshop system until there's a second one to
// actually need it for.
const WORKSHOP = {
  summary: 'The Other Side of Software',
  location: 'https://meet.google.com/zcs-vdnj-nqp',
  description:
    'A hands-on weekend into DevOps & SRE, and how to build a career in it -- hosted by CloudOps Simulator.',
  // Oct 3, 2026 4:00-6:00 PM IST == Oct 3, 2026 10:30-12:30 UTC (IST is UTC+5:30, no DST)
  startUtc: new Date('2026-10-03T10:30:00Z'),
  endUtc: new Date('2026-10-03T12:30:00Z'),
  dailyCount: 2 // Oct 3 + Oct 4
};

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional()
});

function buildConfirmationHtml(name: string, calendarLink: string): string {
  return wrapEmailHtml(`
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;">You're registered for <strong>${WORKSHOP.summary}</strong> 🎉</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:20px;">
          <p style="margin:0 0 8px; font-weight:700; color:#1d4ed8;">Oct 3 &amp; 4, 2026 &middot; 4:00-6:00 PM IST</p>
          <p style="margin:0 0 8px; color:#374151;">Google Meet: <a href="${WORKSHOP.location}">${WORKSHOP.location}</a></p>
          <p style="margin:0; color:#6b7280; font-size:13px;">A calendar invite is attached to this email -- accept it to add both sessions to your calendar automatically.</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;">
      <a href="${calendarLink}" style="color:#1d4ed8;">Or click here to add it to Google Calendar</a>
    </p>
    <p style="margin:0 0 8px;">What to expect:</p>
    <ul style="margin:0 0 16px; padding-left:20px; color:#374151;">
      <li>What DevOps &amp; SRE actually are, beyond the job-title buzzwords</li>
      <li>Hands-on time inside CloudOps Simulator, not slides</li>
      <li>Career guidance beyond SDE -- mapping paths into DevOps, SRE &amp; platform roles</li>
    </ul>
    <p style="margin:0; color:#6b7280; font-size:13px;">See you there!</p>
  `);
}

// POST /api/workshop/register -- deliberately public/unauthenticated, since
// registrants are landing here from the public marketing site and may
// never create a CloudOps account at all.
router.post('/register', emailLimiter, async (req, res) => {
  try {
    const { name, email, phone } = registerSchema.parse(req.body);

    const existing = await prisma.workshopRegistration.findUnique({ where: { email } });
    if (existing) {
      return res.status(200).json({ message: "You're already registered -- check your inbox for the calendar invite." });
    }

    const userId = await optionalUserId(req);

    const registration = await prisma.workshopRegistration.create({
      data: { name, email, phone: phone || null, userId }
    });

    const calendarLink = buildGoogleCalendarLink({
      summary: WORKSHOP.summary,
      description: WORKSHOP.description,
      location: WORKSHOP.location,
      startUtc: WORKSHOP.startUtc,
      endUtc: WORKSHOP.endUtc,
      dailyCount: WORKSHOP.dailyCount
    });

    const organizerEmail = process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || process.env.EMAIL_USER || '';

    const ics = buildRecurringInviteIcs({
      uid: `workshop-${registration.id}@cloudopssimulator`,
      organizerEmail,
      organizerName: 'CloudOps Simulator',
      attendeeEmail: email,
      attendeeName: name,
      summary: WORKSHOP.summary,
      description: WORKSHOP.description,
      location: WORKSHOP.location,
      startUtc: WORKSHOP.startUtc,
      endUtc: WORKSHOP.endUtc,
      dailyCount: WORKSHOP.dailyCount
    });

    try {
      await sendEmail(
        email,
        `You're registered: ${WORKSHOP.summary} 🎉`,
        buildConfirmationHtml(name, calendarLink),
        `You're registered for ${WORKSHOP.summary} on Oct 3 & 4, 2026, 4:00-6:00 PM IST. Google Meet: ${WORKSHOP.location}. Add to calendar: ${calendarLink}`,
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
// the userId on an anonymous registration that matches the caller's own
// account email -- covers the common case of someone registering from the
// public page before ever logging in, then later wanting to see the
// cohort leaderboard from inside the app. Best-effort/idempotent: a no-op
// if there's no matching row, or it's already linked.
router.post('/link', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { email: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const registration = await prisma.workshopRegistration.findUnique({ where: { email: user.email } });
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
// registered for the workshop AND have a CloudOps account (linked via
// /link above or at registration time if they were already logged in).
// Lets a workshop batch see how they're doing against each other, same
// score metric as the site-wide leaderboard.
router.get('/cohort', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const registrants = await prisma.workshopRegistration.findMany({
      where: { userId: { not: null } },
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
