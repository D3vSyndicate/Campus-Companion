import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/superbase';

export type Contact = {
  id: string;
  name: string;
  surname: string;
  role: string;
  email: string;
  support_category: string;
};

// The Contact table's primary key is contact_id; the app works with `id`.
function fromRow(row: Record<string, unknown>): Contact {
  return {
    id: String(row.contact_id ?? row.id ?? ''),
    name: String(row.name ?? ''),
    surname: String(row.surname ?? ''),
    role: String(row.role ?? ''),
    email: String(row.email ?? ''),
    support_category: String(row.support_category ?? ''),
  };
}

type ContactsContextValue = {
  items: Contact[];
  loading: boolean;
  addItem: (item: Omit<Contact, 'id'>) => Promise<string | null>;
  updateItem: (id: string, updates: Partial<Omit<Contact, 'id'>>) => Promise<string | null>;
  deleteItem: (id: string) => Promise<string | null>;
  getItem: (id: string) => Contact | undefined;
};

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('Contact').select('*');
    if (error) {
      console.error('Error fetching contacts:', error.message);
    } else if (data) {
      setItems(data.map((row) => fromRow(row as Record<string, unknown>)));
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchContacts();
  }, []);

  // Each mutation resolves to null on success or a readable error message, so screens can tell
  // the user when a save did not go through (for example when they do not have permission).
  const addItem: ContactsContextValue['addItem'] = async (item) => {
    const { data, error } = await supabase.from('Contact').insert([item]).select();

    if (error) {
      console.error('Error adding contact:', error.message);
      return error.message;
    }
    if (data?.[0]) setItems((prev) => [...prev, fromRow(data[0] as Record<string, unknown>)]);
    return null;
  };

  const updateItem: ContactsContextValue['updateItem'] = async (id, updates) => {
    const { data, error } = await supabase
      .from('Contact')
      .update(updates)
      .eq('contact_id', id)
      .select();

    if (error) {
      console.error('Error updating contact:', error.message);
      return error.message;
    }
    // Row-level security filters out rows you may not change instead of raising an error.
    if (!data?.length) return 'You do not have permission to change this contact.';

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    return null;
  };

  const deleteItem: ContactsContextValue['deleteItem'] = async (id) => {
    const { data, error } = await supabase.from('Contact').delete().eq('contact_id', id).select();

    if (error) {
      console.error('Error deleting contact:', error.message);
      return error.message;
    }
    if (!data?.length) return 'You do not have permission to delete this contact.';

    setItems((prev) => prev.filter((item) => item.id !== id));
    return null;
  };

  const getItem: ContactsContextValue['getItem'] = (id) => items.find((item) => item.id === id);

  return (
    <ContactsContext.Provider value={{ items, loading, addItem, updateItem, deleteItem, getItem }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error('useContacts must be used within a ContactsProvider');
  return ctx;
}
