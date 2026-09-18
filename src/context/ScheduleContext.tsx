import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/superbase';

export type ScheduleItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  description: string;
};

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

      setItems((data ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title ?? ''),
        date: String(row.date ?? ''),
        time: String(row.time ?? row.start_time ?? ''),
        location: String(row.location ?? row.venue ?? ''),
        description: String(row.description ?? ''),
      })));
    };

    void loadItems();
  }, []);

  const addItem: ScheduleContextValue['addItem'] = (item) => {
    return (async () => {
      const { data, error } = await supabase.from('schedule_items').insert(item).select().single();
      if (error) {
        console.error('Error adding schedule item:', error.message);
        return;
      }
      if (data) setItems((prev) => [...prev, data as ScheduleItem]);
    })();
  };

  const updateItem: ScheduleContextValue['updateItem'] = (id, updates) => {
    return (async () => {
      const { error } = await supabase.from('schedule_items').update(updates).eq('id', id);
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
