import { describe, it, expect } from 'vitest';
import { getUsageLimits } from './planLimits.js';

describe('getUsageLimits', () => {
  it('gives a Free plan finite, restrictive limits', () => {
    const limits = getUsageLimits(false);
    expect(limits.maxInstances).toBe(1);
    expect(limits.maxApplications).toBe(1);
    expect(limits.maxPipelines).toBe(2);
    expect(limits.maxContainers).toBe(3);
    expect(limits.maxScenarios).toBe(1);
    expect(limits.maxTickets).toBe(5);
    expect(limits.storageGB).toBe(5);
  });

  it('gives a Pro plan unlimited resource counts', () => {
    const limits = getUsageLimits(true);
    expect(limits.maxInstances).toBe(Infinity);
    expect(limits.maxApplications).toBe(Infinity);
    expect(limits.maxPipelines).toBe(Infinity);
    expect(limits.maxContainers).toBe(Infinity);
    expect(limits.maxScenarios).toBe(Infinity);
    expect(limits.maxTickets).toBe(Infinity);
  });

  it('still caps Pro storage rather than making it unlimited', () => {
    // Deliberate business rule -- Pro gets a large but finite storage
    // allowance (100GB), unlike the other resource counts which are
    // truly unlimited. A regression here would silently remove a real
    // plan differentiator.
    expect(getUsageLimits(true).storageGB).toBe(100);
  });
});
