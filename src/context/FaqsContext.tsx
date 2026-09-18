import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/superbase';

// Table: "FAQ" (faq_id, question, answer, category, is_visible)
export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  visible: boolean; // shown to students
};

export type FaqInput = Omit<FaqItem, 'id'>;

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const orNull = (value: string) => value.trim() || null;

function toDatabase(input: Partial<FaqInput>) {
  const row: Record<string, unknown> = {};
  if (input.question !== undefined) row.question = input.question.trim();
  if (input.answer !== undefined) row.answer = orNull(input.answer);
  if (input.category !== undefined) row.category = orNull(input.category);
  if (input.visible !== undefined) row.is_visible = input.visible;
  return row;
}

function fromDatabase(row: Record<string, unknown>): FaqItem {
  return {
    id: String(row.faq_id),
    question: text(row.question),
    answer: text(row.answer),
    category: text(row.category),
    visible: row.is_visible !== false,
  };
}

const byCategory = (a: FaqItem, b: FaqItem) =>
  a.category.localeCompare(b.category) || a.question.localeCompare(b.question);

const NOT_ALLOWED =
  "Nothing was changed. The FAQ may no longer exist, or your account doesn't have admin permission.";

type FaqsContextValue = {
  items: FaqItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // These throw an Error with a readable message on failure
  addItem: (item: FaqInput) => Promise<void>;
  updateItem: (id: string, updates: Partial<FaqInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  // Flips the switch immediately, then reverts and throws if the save fails
  setVisible: (id: string, visible: boolean) => Promise<void>;
  getItem: (id: string) => FaqItem | undefined;
};

const FaqsContext = createContext<FaqsContextValue | null>(null);

export function FaqsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: dbError } = await supabase.from('FAQ').select('*');

    if (dbError) {
      console.error('Error loading FAQs:', dbError.message);
      setError(dbError.message);
    } else {
      setItems((data ?? []).map((row) => fromDatabase(row as Record<string, unknown>)).sort(byCategory));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem: FaqsContextValue['addItem'] = async (input) => {
    const { data, error: dbError } = await supabase
      .from('FAQ')
      .insert(toDatabase(input))
      .select()
      .single();
    if (dbError) throw new Error(dbError.message);
    setItems((prev) => [...prev, fromDatabase(data as Record<string, unknown>)].sort(byCategory));
  };

  const updateItem: FaqsContextValue['updateItem'] = async (id, updates) => {
    // RLS doesn't return an error when it blocks an update, it just matches 0 rows,
    // so we ask for the row back and check.
    const { data, error: dbError } = await supabase
      .from('FAQ')
      .update(toDatabase(updates))
      .eq('faq_id', id)
      .select()
      .maybeSingle();
    if (dbError) throw new Error(dbError.message);
    if (!data) throw new Error(NOT_ALLOWED);
    const updated = fromDatabase(data as Record<string, unknown>);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)).sort(byCategory));
  };

  const deleteItem: FaqsContextValue['deleteItem'] = async (id) => {
    const { data, error: dbError } = await supabase
      .from('FAQ')
      .delete()
      .eq('faq_id', id)
      .select('faq_id');
    if (dbError) throw new Error(dbError.message);
    if (!data || data.length === 0) throw new Error(NOT_ALLOWED);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const setVisible: FaqsContextValue['setVisible'] = async (id, visible) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, visible } : item)));

    const { data, error: dbError } = await supabase
      .from('FAQ')
      .update({ is_visible: visible })
      .eq('faq_id', id)
      .select('faq_id');

    if (dbError || !data || data.length === 0) {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, visible: !visible } : item)));
      throw new Error(dbError?.message ?? NOT_ALLOWED);
    }
  };

  const getItem: FaqsContextValue['getItem'] = (id) => items.find((item) => item.id === id);

  return (
    <FaqsContext.Provider
      value={{ items, loading, error, refresh, addItem, updateItem, deleteItem, setVisible, getItem }}
    >
      {children}
    </FaqsContext.Provider>
  );
}

export function useFaqs() {
  const ctx = useContext(FaqsContext);
  if (!ctx) throw new Error('useFaqs must be used within a FaqsProvider');
  return ctx;
}
