import { PrismaClient } from '@prisma/client';

// A serverless deployment can scale out to several concurrent function
// instances, each creating its own PrismaClient with its own connection
// pool (Prisma defaults to roughly cpus*2+1 connections per instance). A
// small managed Postgres plan's max_connections can be exhausted by just a
// couple of concurrent instances -- capping the pool to 1 per instance
// keeps total usage bounded regardless of how many instances Vercel spins
// up. Respects an explicit connection_limit already present in the URL.
function withConnectionLimit(url: string | undefined): string | undefined {
  if (!url || url.includes('connection_limit=')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}connection_limit=1`;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: { db: { url: withConnectionLimit(process.env.DATABASE_URL) } }
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Cache on globalThis in every environment: within a single warm process
// (dev hot-reloads locally, or a warm serverless instance in production)
// this guarantees only one PrismaClient/connection-pool ever gets created,
// rather than depending on module-cache behavior that can vary by bundler.
globalThis.prisma = prisma;

export default prisma;
