import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/superbase';

export const SCHEDULE_CATEGORIES = ['academic', 'support', 'social', 'digital', 'admin'] as const;
export type ScheduleCategory = (typeof SCHEDULE_CATEGORIES)[number];

export type Venue = {
  id: string;
  name: string;
  building: string;
  room: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM start
  endTime: string; // HH:MM
  venueId: string; // '' when no venue is linked
  location: string; // venue name, resolved from venueId
  description: string;
  category: ScheduleCategory;
  responsiblePerson: string;
};

type ScheduleInput = Omit<ScheduleItem, 'id' | 'location'>;

const toHHMM = (value: unknown) => String(value ?? '').slice(0, 5);

function toDatabaseItem(item: ScheduleInput) {
  return {
    title: item.title,
    date: item.date,
    start_time: item.time || null,
    end_time: item.endTime || null,
    venue_id: item.venueId || null,
    description: item.description || null,
    category: item.category,
    responsible_person: item.responsiblePerson || null,
  };
}

function toVenue(row: Record<string, unknown>): Venue {
  return {
    id: String(row.venue_id ?? ''),
    name: String(row.venue_name ?? ''),
    building: String(row.building ?? ''),
    room: String(row.room_number ?? ''),
  };
}

function fromDatabaseItem(row: Record<string, unknown>, venues: Venue[]): ScheduleItem {
  const venueId = row.venue_id ? String(row.venue_id) : '';
  const category = String(row.category ?? 'academic') as ScheduleCategory;
  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    date: String(row.date ?? ''),
    time: toHHMM(row.start_time),
    endTime: toHHMM(row.end_time),
    venueId,
    location: venues.find((venue) => venue.id === venueId)?.name ?? '',
    description: String(row.description ?? ''),
    category: SCHEDULE_CATEGORIES.includes(category) ? category : 'academic',
    responsiblePerson: String(row.responsible_person ?? ''),
  };
}

type ScheduleContextValue = {
  items: ScheduleItem[];
  venues: Venue[];
  // Mutations resolve to null on success, or a readable error message.
  addItem: (item: ScheduleInput) => Promise<string | null>;
  updateItem: (id: string, updates: Partial<ScheduleInput>) => Promise<string | null>;
  deleteItem: (id: string) => Promise<string | null>;
  getItem: (id: string) => ScheduleItem | undefined;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    const load = async () => {
      const [scheduleResult, venueResult] = await Promise.all([
        supabase.from('schedule_items').select('*').order('date').order('start_time'),
        supabase.from('Venue').select('*'),
      ]);

      if (venueResult.error) {
        console.error('Error fetching venues:', venueResult.error.message);
      } else {
        setVenues((venueResult.data ?? []).map((row) => toVenue(row as Record<string, unknown>)));
      }

      if (scheduleResult.error) {
        console.error('Error fetching schedule items:', scheduleResult.error.message);
        return;
      }
      setRows((scheduleResult.data ?? []) as Record<string, unknown>[]);
    };

    void load();
  }, []);

  const items = useMemo(() => rows.map((row) => fromDatabaseItem(row, venues)), [rows, venues]);

  const addItem: ScheduleContextValue['addItem'] = useCallback(async (item) => {
    const { data, error } = await supabase
      .from('schedule_items')
      .insert(toDatabaseItem(item))
      .select()
      .single();
    if (error) {
      console.error('Error adding schedule item:', error.message);
      return error.message;
    }
    if (data) setRows((prev) => [...prev, data as Record<string, unknown>]);
    return null;
  }, []);

  const updateItem: ScheduleContextValue['updateItem'] = useCallback(
    async (id, updates) => {
      const current = items.find((item) => item.id === id);
      if (!current) return 'That schedule item could not be found.';

      const { data, error } = await supabase
        .from('schedule_items')
        .update(toDatabaseItem({ ...current, ...updates }))
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Error updating schedule item:', error.message);
        // PGRST116: no row came back, i.e. row-level security blocked the update.
        return error.code === 'PGRST116' ? 'You do not have permission to change this item.' : error.message;
      }
      setRows((prev) => prev.map((row) => (String(row.id) === id ? (data as Record<string, unknown>) : row)));
      return null;
    },
    [items],
  );

  const deleteItem: ScheduleContextValue['deleteItem'] = useCallback(async (id) => {
    const { data, error } = await supabase.from('schedule_items').delete().eq('id', id).select();
    if (error) {
      console.error('Error deleting schedule item:', error.message);
      return error.message;
    }
    if (!data?.length) return 'You do not have permission to delete this item.';
    setRows((prev) => prev.filter((row) => String(row.id) !== id));
    return null;
  }, []);

  const getItem: ScheduleContextValue['getItem'] = (id) => items.find((item) => item.id === id);

  return (
    <ScheduleContext.Provider value={{ items, venues, addItem, updateItem, deleteItem, getItem }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within a ScheduleProvider');
  return ctx;
}
