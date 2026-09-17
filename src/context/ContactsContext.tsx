import React, { createContext, useContext, useState, ReactNode } from 'react';

// Same shape as ScheduleContext — swap addItem/updateItem/deleteItem for
// Supabase calls (supabase.from('contacts').insert/update/delete) when ready.

export type Contact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
};

type ContactsContextValue = {
  items: Contact[];
  addItem: (item: Omit<Contact, 'id'>) => void;
  updateItem: (id: string, updates: Partial<Omit<Contact, 'id'>>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => Contact | undefined;
};

const ContactsContext = createContext<ContactsContextValue | null>(null);

const initialData: Contact[] = [
  {
    id: '1',
    name: 'Sipho Nkosi',
    role: 'Event Coordinator',
    phone: '+27 82 555 0101',
    email: 'sipho.nkosi@example.com',
  },
  {
    id: '2',
    name: 'Amara Diallo',
    role: 'Venue Manager',
    phone: '+27 82 555 0102',
    email: 'amara.diallo@example.com',
  },
];

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Contact[]>(initialData);

  const addItem: ContactsContextValue['addItem'] = (item) => {
    const newItem: Contact = { ...item, id: Date.now().toString() };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem: ContactsContextValue['updateItem'] = (id, updates) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem: ContactsContextValue['deleteItem'] = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getItem: ContactsContextValue['getItem'] = (id) => items.find((item) => item.id === id);

  return (
    <ContactsContext.Provider value={{ items, addItem, updateItem, deleteItem, getItem }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within a ContactsProvider');
  return ctx;
}
