// One-off promotion script: grants (or revokes) admin panel access for a
// real account by email. Deliberately not exposed via any HTTP route --
// only someone with direct database/server access should be able to mint
// a new admin.
//
// Usage:
//   npx tsx scripts/grant-admin.ts someone@example.com          (grant)
//   npx tsx scripts/grant-admin.ts someone@example.com --revoke  (revoke)

import prisma from '../src/lib/prisma.js';

const email = process.argv[2];
const revoke = process.argv.includes('--revoke');

if (!email) {
  console.error('Usage: npx tsx scripts/grant-admin.ts <email> [--revoke]');
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exitCode = 1;
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { isAdmin: !revoke },
  });

  console.log(`${updated.email} is now ${updated.isAdmin ? 'an admin' : 'no longer an admin'}.`);
}

main()
  .catch((err) => {
    console.error('Failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
