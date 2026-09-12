import { describe, it, expect } from 'vitest';
import { applyInlineMarkdownBold, wrapEmailHtml } from './emailShell.js';

describe('applyInlineMarkdownBold', () => {
  it('converts **bold** markdown to <strong> tags', () => {
    expect(applyInlineMarkdownBold('This is **important** text')).toBe(
      'This is <strong>important</strong> text'
    );
  });

  it('handles multiple bold spans in one string', () => {
    expect(applyInlineMarkdownBold('**one** and **two**')).toBe(
      '<strong>one</strong> and <strong>two</strong>'
    );
  });

  it('leaves plain text with no markdown untouched', () => {
    expect(applyInlineMarkdownBold('nothing special here')).toBe('nothing special here');
  });

  it('does not touch a lone unmatched double-asterisk', () => {
    expect(applyInlineMarkdownBold('just ** one pair')).toBe('just ** one pair');
  });
});

describe('wrapEmailHtml', () => {
  it('embeds the provided body content inside the shared shell', () => {
    const html = wrapEmailHtml('<p>hello world</p>');
    expect(html).toContain('<p>hello world</p>');
  });

  it('includes the CloudOps Simulator branding', () => {
    const html = wrapEmailHtml('<p>body</p>');
    expect(html).toContain('CloudOps Simulator');
  });
});
