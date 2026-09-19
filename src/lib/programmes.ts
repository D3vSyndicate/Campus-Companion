import { fetchWithOfflineFallback } from './offlineData';

export type Programme = {
  id: string;
  name: string;
  description: string;
  yearStructure: string;
  keyModules: string[];
  careers: string[];
  expectations: string;
  advisorName: string;
  advisorContact: string;
  advisorAvailability: string;
  order: number;
};

const str = (value: unknown) => String(value ?? '').trim();

// A text[] column arrives as an array. A cached or hand-entered value may be a plain string, so accept both.
const toList = (value: unknown): string[] => {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\r?\n/) : [];
  return items.map((item) => str(item).replace(/^\s*[-*•]\s*/, '')).filter(Boolean);
};

export function mapProgramme(row: Record<string, unknown>, index = 0): Programme | null {
  const name = str(row.programme_name);
  if (!name) return null;
  return {
    id: str(row.id) || `${name}-${index}`,
    name,
    description: str(row.description),
    yearStructure: str(row.year_structure),
    keyModules: toList(row.key_modules),
    careers: toList(row.career_possibilities),
    expectations: str(row.academic_expectations),
    advisorName: str(row.advisor_name),
    advisorContact: str(row.advisor_contact),
    advisorAvailability: str(row.advisor_availability),
    order: Number(row.display_order) || 0,
  };
}

export async function loadProgrammes(): Promise<{ programmes: Programme[]; fromCache: boolean; failed: boolean }> {
  const { data, fromCache, error } = await fetchWithOfflineFallback('it_programmes');
  if (error) console.error('Failed to load programmes.', error);

  const programmes = (Array.isArray(data) ? (data as Record<string, unknown>[]) : [])
    .map((row, index) => mapProgramme(row, index))
    .filter((programme): programme is Programme => programme !== null)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return { programmes, fromCache: Boolean(fromCache), failed: Boolean(error) };
}
