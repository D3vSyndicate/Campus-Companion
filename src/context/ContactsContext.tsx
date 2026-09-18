import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/superbase';

export type Contact = {
  id: string;
  name: string;
  surname: string;
  role: string;
  email: string;
  supportCategory: string;
};

type ContactsContextValue = {
  items: Contact[];
  loading: boolean;
  addItem: (item: Omit<Contact, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<Contact, 'id'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem: (id: string) => Contact | undefined;
};

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contacts').select('*');
    if (error) {
      console.error('Error fetching contacts:', error.message);
    } else if (data) {
      setItems(data as Contact[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const addItem: ContactsContextValue['addItem'] = async (item) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert([item])
      .select();

    if (error) {
      console.error('Error adding contact:', error.message);
      return;
    }
    if (data) setItems((prev) => [...prev, data[0] as Contact]);
  };

  const updateItem: ContactsContextValue['updateItem'] = async (id, updates) => {
    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating contact:', error.message);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteItem: ContactsContextValue['deleteItem'] = async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);

    if (error) {
      console.error('Error deleting contact:', error.message);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getItem: ContactsContextValue['getItem'] = (id) =>
    items.find((item) => item.id === id);

  return (
    <ContactsContext.Provider
      value={{ items, loading, addItem, updateItem, deleteItem, getItem }}
    >
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within a ContactsProvider');
  return ctx;
}