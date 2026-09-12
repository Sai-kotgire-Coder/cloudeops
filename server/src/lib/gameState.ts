import prisma from './prisma.js';

// Default JSON blobs for GameState's required asg/hpa/vpa fields. Shared so
// nothing outside gameState.ts's own routes has to duplicate them when it
// needs to safely touch a user's GameState row that may not exist yet
// (e.g. the referral route incrementing score for a referrer).
export const DEFAULT_ASG = {
  enabled: false,
  minInstances: 1,
  maxInstances: 10,
  targetCpuUp: 70,
  targetCpuDown: 30,
  instanceType: 't3.micro'
};

export const DEFAULT_HPA = {
  enabled: false,
  minReplicas: 1,
  maxReplicas: 10,
  targetCpuPercent: 70,
  scaleUpCooldownTicks: 10,
  scaleDownCooldownTicks: 20,
  lastScaleTick: 0
};

export const DEFAULT_VPA = {
  enabled: false,
  mode: 'Off',
  minInstanceType: 't3.micro',
  maxInstanceType: 'c5.xlarge'
};

// Ensures a GameState row exists for a user, creating one with defaults if
// not. Safe to call before any operation (e.g. an `increment`) that
// requires the row to already exist.
export async function ensureGameState(userId: string) {
  return prisma.gameState.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      asg: DEFAULT_ASG,
      hpa: DEFAULT_HPA,
      vpa: DEFAULT_VPA
    }
  });
}
