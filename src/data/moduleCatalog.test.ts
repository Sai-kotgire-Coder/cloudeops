import { describe, it, expect } from 'vitest';
import { MODULE_CATALOG, ALL_MODULE_IDS } from './moduleCatalog';

describe('MODULE_CATALOG', () => {
  it('has no duplicate module ids -- the sidebar and My Account both key off these', () => {
    const ids = MODULE_CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no duplicate routes', () => {
    const urls = MODULE_CATALOG.map((m) => m.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('gives every module a non-empty title and description', () => {
    MODULE_CATALOG.forEach((m) => {
      expect(m.title.trim().length).toBeGreaterThan(0);
      expect(m.description.trim().length).toBeGreaterThan(0);
    });
  });

  it('ALL_MODULE_IDS stays in sync with the catalog (same ids, same order)', () => {
    expect(ALL_MODULE_IDS).toEqual(MODULE_CATALOG.map((m) => m.id));
  });
});
