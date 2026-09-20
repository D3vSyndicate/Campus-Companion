import builtIn from '../data/emergency-contacts.json';
import { fetchWithOfflineFallback } from './offlineData';

type Row = Record<string, unknown>;

export type EmergencyContact = {
  id: string;
  category: string;
  name: string;
  description: string;
  phone: string;
  available: string;
  sortOrder: number;
};

const str = (value: unknown) => String(value ?? '').trim();

// Only the digits (and a leading +), which is what a phone needs to dial.
export const dialable = (phone: string) => phone.replace(/[^\d+]/g, '');

// Digits only. Used as a stable name for a number, for example to look up its translation.
export const numberKey = (phone: string) => phone.replace(/\D/g, '');

// "Mental health" becomes "mental-health".
export const categorySlug = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function toContact(row: Row, index: number): EmergencyContact | null {
  const name = str(row.name);
  const phone = str(row.phone);
  if (!name || !phone || row.is_active === false) return null;
  return {
    id: str(row.id) || `built-in:${index}`,
    category: str(row.category) || 'Emergency services',
    name,
    description: str(row.description),
    phone,
    available: str(row.available),
    sortOrder: Number(row.sort_order) || 0,
  };
}

const sorted = (contacts: EmergencyContact[]) => contacts.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

// The numbers that ship inside the app.
export const BUILT_IN_CONTACTS: EmergencyContact[] = sorted(
  (builtIn as Row[]).map(toContact).filter((contact): contact is EmergencyContact => contact !== null),
);

// The built-in wording of each number, so an untouched entry can be shown in the student's own language.
export const BUILT_IN_BY_NUMBER = new Map(BUILT_IN_CONTACTS.map((contact) => [numberKey(contact.phone), contact]));

// What staff saved in the database if there is anything there, otherwise the numbers built into the app.
// Help must never be missing, so a table that is not set up yet, or is empty, or cannot be reached, still
// shows the national numbers.
export async function fetchEmergencyContacts(): Promise<EmergencyContact[]> {
  const { data } = await fetchWithOfflineFallback('emergency_contacts');
  const rows = Array.isArray(data) ? (data as Row[]) : [];
  const contacts = rows.map(toContact).filter((contact): contact is EmergencyContact => contact !== null);
  return contacts.length ? sorted(contacts) : BUILT_IN_CONTACTS;
}
