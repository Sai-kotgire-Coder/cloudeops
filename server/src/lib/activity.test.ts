import { describe, it, expect } from 'vitest';
import { isActive, ACTIVE_WINDOW_DAYS } from './activity.js';

describe('isActive', () => {
  it('returns false for null (never active)', () => {
    expect(isActive(null)).toBe(false);
  });

  it('returns true for a timestamp within the active window', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(isActive(oneHourAgo)).toBe(true);
  });

  it('returns true right at the edge of the window (just inside it)', () => {
    const justInside = new Date(Date.now() - (ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000 - 1000));
    expect(isActive(justInside)).toBe(true);
  });

  it('returns false for a timestamp older than the active window', () => {
    const wayBack = new Date(Date.now() - (ACTIVE_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(isActive(wayBack)).toBe(false);
  });
});
