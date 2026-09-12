import { describe, it, expect } from 'vitest';
import { EMAIL_TEMPLATES, CUSTOM_TEMPLATE_ID } from './emailTemplates';

describe('EMAIL_TEMPLATES', () => {
  it('has at least 10 templates, as designed for the admin broadcast composer', () => {
    expect(EMAIL_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it('has no duplicate template ids', () => {
    const ids = EMAIL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never reuses the reserved "custom" id for a real template', () => {
    expect(EMAIL_TEMPLATES.some((t) => t.id === CUSTOM_TEMPLATE_ID)).toBe(false);
  });

  it('gives every template a non-empty subject and message', () => {
    EMAIL_TEMPLATES.forEach((t) => {
      expect(t.subject.trim().length).toBeGreaterThan(0);
      expect(t.message.trim().length).toBeGreaterThan(0);
    });
  });
});
