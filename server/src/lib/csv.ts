// Minimal CSV serialization -- no dependency needed for the handful of
// flat, admin-only exports this app has (users/workshop registrants/
// submissions). Only quotes a field when it actually needs it, so the
// common case (plain emails/dates) stays readable in the raw output.
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvField(row[c.key])).join(','));
  return [header, ...lines].join('\n');
}
