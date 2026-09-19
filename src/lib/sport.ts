import builtIn from '../data/madibaz-sport.json';
import { fetchWithOfflineFallback } from './offlineData';

type Row = Record<string, unknown>;

// The Madibaz Sport information that ships inside the app. It has the same shape as a row of the
// sport_recreation table, so the screens read it exactly like database rows.
const BUILT_IN_ROWS: Row[] = (builtIn as Row[]).map((row) => ({
  ...row,
  item_id: `built-in:${String(row.kind)}:${String(row.name)}`,
  is_active: true,
}));

// Sport & gym rows: what the coordinators saved in the database if there is any, otherwise the
// information built into the app. Without this fallback the screen is empty whenever the table has
// not been set up yet, or has nothing in it, or cannot be reached and was never saved on this phone.
export async function fetchSportRows(): Promise<{ data: Row[]; fromCache: boolean; error: unknown }> {
  const result = await fetchWithOfflineFallback('sport_recreation');
  const rows = Array.isArray(result.data) ? (result.data as Row[]) : [];

  if (rows.length) return { data: rows, fromCache: Boolean(result.fromCache), error: result.error ?? null };

  // Built-in information is current as of the app version, not stale offline data, so it is not "from cache".
  return { data: BUILT_IN_ROWS, fromCache: false, error: result.error ?? null };
}
