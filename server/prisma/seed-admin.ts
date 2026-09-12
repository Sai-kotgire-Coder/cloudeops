import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.js';

const EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@cloudops.test';
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      passwordHash,
      isVerified: true,
      planType: 'pro',
      isPro: true,
      isAdmin: true,
    },
    create: {
      email: EMAIL,
      passwordHash,
      isVerified: true,
      planType: 'pro',
      isPro: true,
      isAdmin: true,
    },
  });

  console.log('Seeded admin user:');
  console.log('  email:   ', user.email);
  console.log('  password:', PASSWORD);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
