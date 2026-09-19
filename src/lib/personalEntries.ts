import AsyncStorage from '@react-native-async-storage/async-storage';

// The student's own calendar entries — res events, study groups, a shift at work. These are private
// to the phone: they are not sent to Supabase, so nothing a student writes here is visible to
// staff. Same shape as the arcade ledger, and the same reasoning: losing them is a disappointment,
// never an error worth blocking on.

const KEY = 'calendar:personal';

export interface PersonalEntry {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM, or '' for an all-day note
  end: string;
  venue: string;
}

const keyFor = (userId: string) => `${KEY}:${userId}`;

const isEntry = (value: unknown): value is PersonalEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<PersonalEntry>;
  return typeof entry.id === 'string' && typeof entry.title === 'string' && typeof entry.date === 'string';
};

export async function readPersonalEntries(userId: string): Promise<PersonalEntry[]> {
  try {
    const saved = await AsyncStorage.getItem(keyFor(userId));
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

async function write(userId: string, entries: PersonalEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(entries));
  } catch {
    // The entry stays on screen for this session; only the saved copy is lost.
  }
}

export async function addPersonalEntry(
  userId: string,
  entry: Omit<PersonalEntry, 'id'>,
): Promise<PersonalEntry[]> {
  const entries = await readPersonalEntries(userId);
  const next = [...entries, { ...entry, id: `personal-${Date.now()}-${entries.length}` }];
  await write(userId, next);
  return next;
}

export async function removePersonalEntry(userId: string, id: string): Promise<PersonalEntry[]> {
  const entries = await readPersonalEntries(userId);
  const next = entries.filter((entry) => entry.id !== id);
  await write(userId, next);
  return next;
}

// "14:30" or "1430" or "2:30" -> "14:30". Returns '' for anything that is not a time, so the form
// can tell the student rather than saving something the calendar cannot sort.
export function normaliseTime(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^(\d{1,2})[:h.]?(\d{2})$/);
  if (!match) return '';
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
