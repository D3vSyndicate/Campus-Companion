import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/superbase';

export type ScheduleItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  description: string;
};

function toDatabaseItem(item: Omit<ScheduleItem, 'id'>) {
  return {
    title: item.title,
    date: item.date,
    start_time: item.time || null,
    venue: item.location || null,
    description: item.description || null,
  };
}

function fromDatabaseItem(row: Record<string, unknown>): ScheduleItem {
  return {
    id: String(row.id ?? row.schedule_id ?? ''),
    title: String(row.title ?? ''),
    date: String(row.date ?? ''),
    time: String(row.time ?? row.start_time ?? ''),
    location: String(row.location ?? row.venue ?? row.venue_name ?? ''),
    description: String(row.description ?? ''),
  };
}

type ScheduleContextValue = {
  items: ScheduleItem[];
  addItem: (item: Omit<ScheduleItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<ScheduleItem, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem: (id: string) => ScheduleItem | undefined;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const loadItems = async () => {
      const { data, error } = await supabase.from('schedule_items').select('*').order('date');
      if (error) {
        console.error('Error fetching schedule items:', error.message);
        return;
      }

      setItems((data ?? []).map((row) => fromDatabaseItem(row as Record<string, unknown>)));
    };

    void loadItems();
  }, []);

  const addItem: ScheduleContextValue['addItem'] = (item) => {
    return (async () => {
      const { data, error } = await supabase
        .from('schedule_items')
        .insert(toDatabaseItem(item))
        .select()
        .single();
      if (error) {
        console.error('Error adding schedule item:', error.message);
        return;
      }
      if (data) setItems((prev) => [...prev, fromDatabaseItem(data as Record<string, unknown>)]);
    })();
  };

  const updateItem: ScheduleContextValue['updateItem'] = (id, updates) => {
    return (async () => {
      const databaseUpdates = {
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.date !== undefined ? { date: updates.date } : {}),
        ...(updates.time !== undefined ? { start_time: updates.time || null } : {}),
        ...(updates.location !== undefined ? { venue: updates.location || null } : {}),
        ...(updates.description !== undefined ? { description: updates.description || null } : {}),
      };
      const { error } = await supabase
        .from('schedule_items')
        .update(databaseUpdates)
        .eq('id', id);
      if (error) {
        console.error('Error updating schedule item:', error.message);
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    })();
  };

  const deleteItem: ScheduleContextValue['deleteItem'] = (id) => {
    return (async () => {
      const { error } = await supabase.from('schedule_items').delete().eq('id', id);
      if (error) {
        console.error('Error deleting schedule item:', error.message);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    })();
  };

  const getItem: ScheduleContextValue['getItem'] = (id) =>
    items.find((item) => item.id === id);

  return (
    <ScheduleContext.Provider value={{ items, addItem, updateItem, deleteItem, getItem }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used within a ScheduleProvider');
  return ctx;
}
