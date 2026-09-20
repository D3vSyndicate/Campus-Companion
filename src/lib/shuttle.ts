import schedule from '../data/shuttle-schedule.json';
import { fetchWithOfflineFallback } from './offlineData';

type Row = Record<string, unknown>;

// The published shuttle schedule that ships inside the app. Its rows have the same shape as rows of the
// shuttle_times table, so the screens read them exactly like database rows.
const BUILT_IN_ROWS: Row[] = (schedule.rows as Row[]).map((row, index) => ({
  ...row,
  shuttle_id: `built-in:${index}`,
  is_active: true,
}));

export const SHUTTLE_RULES = schedule.rules as { title: string; text: string }[];
// The English wording, for screens that are not translated yet. Translated screens use shuttle.caption.
export const SHUTTLE_LABEL = `${schedule.campus} campus · ${schedule.year} schedule`;
export const SHUTTLE_CAMPUS = schedule.campus;
export const SHUTTLE_YEAR = schedule.year;

// "Code of conduct" becomes "code-of-conduct", which names the rule's translation in the language files.
export const ruleKey = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// The starter times the old setup script added are placeholders, not a timetable. Never show them.
const isPlaceholder = (row: Row) => /^sample time/i.test(String(row.notes ?? ''));

// Shuttle rows: what staff saved in the database if there is a real timetable there, otherwise the
// published schedule built into the app. Without this the shuttle card disappears whenever the table is
// missing, empty, or holds only placeholders.
export async function fetchShuttleRows(): Promise<{ data: Row[]; fromCache: boolean; error: unknown }> {
  const result = await fetchWithOfflineFallback('shuttle_times');
  const rows = (Array.isArray(result.data) ? (result.data as Row[]) : []).filter((row) => !isPlaceholder(row));

  if (rows.length) return { data: rows, fromCache: Boolean(result.fromCache), error: result.error ?? null };

  return { data: BUILT_IN_ROWS, fromCache: false, error: result.error ?? null };
}
