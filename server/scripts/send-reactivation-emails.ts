// Bulk-email campaign runner: finds existing, verified users who have gone
// quiet and sends them the re-engagement announcement in
// server/src/emails/reEngagementEmail.ts.
//
// "Inactive" is approximated from GameState.updatedAt (it updates whenever
// a user's simulation state is saved, which happens during normal use) --
// there's no dedicated "last seen" field on User. A user counts as
// inactive if their GameState hasn't updated in --days days, or they have
// no GameState at all and registered more than --days days ago (signed up,
// never really engaged).
//
// SAFE BY DEFAULT: running this script with no flags only PREVIEWS who
// would receive the email and shows the rendered content for the first
// recipient -- it sends nothing. Pass --send to actually dispatch emails.
//
// Usage:
//   npx tsx scripts/send-reactivation-emails.ts                  (dry run, default 14-day threshold)
//   npx tsx scripts/send-reactivation-emails.ts --days=30         (dry run, 30-day threshold)
//   npx tsx scripts/send-reactivation-emails.ts --send            (actually send, 14-day threshold)
//   npx tsx scripts/send-reactivation-emails.ts --send --days=30 --app-url=https://cloudeops-831l.vercel.app

import prisma from '../src/lib/prisma.js';
import { sendEmail } from '../src/lib/emailService.js';
import { buildReEngagementEmail } from '../src/emails/reEngagementEmail.js';

const args = process.argv.slice(2);
const shouldSend = args.includes('--send');
const daysArg = args.find((a) => a.startsWith('--days='));
const inactiveDays = daysArg ? parseInt(daysArg.split('=')[1], 10) : 14;
const appUrlArg = args.find((a) => a.startsWith('--app-url='));
const appUrl = appUrlArg ? appUrlArg.split('=')[1] : (process.env.APP_URL || 'https://cloudeops-831l.vercel.app');

const DELAY_BETWEEN_SENDS_MS = 1000; // spread sends out to stay well under Gmail's rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findInactiveUsers(cutoff: Date) {
  const candidates = await prisma.user.findMany({
    where: { isVerified: true },
    select: {
      id: true,
      email: true,
      createdAt: true,
      profile: { select: { fullName: true } },
      gameState: { select: { updatedAt: true } },
    },
  });

  return candidates.filter((u) => {
    if (u.gameState) return u.gameState.updatedAt < cutoff;
    return u.createdAt < cutoff; // never had any game state at all
  });
}

async function main() {
  const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
  const inactiveUsers = await findInactiveUsers(cutoff);

  console.log(`Inactivity threshold: ${inactiveDays} days (no activity since ${cutoff.toISOString()})`);
  console.log(`Found ${inactiveUsers.length} inactive, verified user(s).`);

  if (inactiveUsers.length === 0) {
    return;
  }

  if (!shouldSend) {
    console.log('\nDRY RUN -- no emails will be sent. Pass --send to actually dispatch them.\n');
    console.log('Recipients:');
    inactiveUsers.forEach((u) => console.log(`  - ${u.email}${u.profile?.fullName ? ` (${u.profile.fullName})` : ''}`));

    const preview = buildReEngagementEmail({
      email: inactiveUsers[0].email,
      fullName: inactiveUsers[0].profile?.fullName,
      appUrl,
    });
    console.log(`\n--- Preview of the email (as ${inactiveUsers[0].email} would see it) ---`);
    console.log(`Subject: ${preview.subject}\n`);
    console.log(preview.text);
    console.log('\n--- end preview ---');
    return;
  }

  console.log(`\nSending to ${inactiveUsers.length} recipient(s), ${DELAY_BETWEEN_SENDS_MS}ms apart...\n`);

  let sent = 0;
  let failed = 0;
  for (const user of inactiveUsers) {
    const { subject, html, text } = buildReEngagementEmail({
      email: user.email,
      fullName: user.profile?.fullName,
      appUrl,
    });
    try {
      await sendEmail(user.email, subject, html, text);
      console.log(`  sent -> ${user.email}`);
      sent++;
    } catch (error: any) {
      console.error(`  FAILED -> ${user.email}: ${error.message}`);
      failed++;
    }
    await sleep(DELAY_BETWEEN_SENDS_MS);
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}, Total: ${inactiveUsers.length}`);
}

main()
  .catch((err) => {
    console.error('Campaign script failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
