import React, { createContext, useContext, useState, ReactNode } from 'react';

// Swap the bodies of addItem/updateItem/deleteItem for Supabase calls
// (supabase.from('schedule_items').insert/update/delete) once you're ready —
// the function signatures below are what the screens rely on, so screens
// won't need to change.

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
  addItem: (item: Omit<ScheduleItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<Omit<ScheduleItem, 'id'>>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => ScheduleItem | undefined;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

const initialData: ScheduleItem[] = [
  {
    id: '1',
    title: 'Opening Ceremony',
    date: '2026-09-20',
    time: '09:00',
    location: 'Main Hall',
    description: 'Kickoff event for all attendees.',
  },
  {
    id: '2',
    title: 'Workshop: Intro to RN',
    date: '2026-09-21',
    time: '11:00',
    location: 'Room B',
    description: 'Hands-on workshop for beginners.',
  },
];

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ScheduleItem[]>(initialData);

  const addItem: ScheduleContextValue['addItem'] = (item) => {
    const newItem: ScheduleItem = { ...item, id: Date.now().toString() };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem: ScheduleContextValue['updateItem'] = (id, updates) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem: ScheduleContextValue['deleteItem'] = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
