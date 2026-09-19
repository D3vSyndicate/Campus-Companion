import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/superbase';

export type ProgrammeItem = { id: string; title: string; content: string };
export type Assignment = { id: string; title: string; description: string; dueDate: string; status: string };
export type HodContact = { id: string; name: string; role: string; email: string; phone: string };

type HodContextValue = {
  programme: ProgrammeItem[];
  assignments: Assignment[];
  contacts: HodContact[];
  addProgramme: (title: string, content: string) => Promise<void>;
  removeProgramme: (id: string) => Promise<void>;
  addAssignment: (title: string, description: string, dueDate: string) => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  addContact: (contact: Omit<HodContact, 'id'>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
};

const HodContext = createContext<HodContextValue | null>(null);

export function HodProvider({ children }: { children: ReactNode }) {
  const [programme, setProgramme] = useState<ProgrammeItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contacts, setContacts] = useState<HodContact[]>([]);

  useEffect(() => {
    const load = async () => {
      const [programmeResult, assignmentResult, contactResult] = await Promise.all([
        supabase.from('hod_programme_content').select('*').order('created_at', { ascending: true }),
        supabase.from('hod_assignments').select('*').order('due_date', { ascending: true }),
        supabase.from('hod_contacts').select('*').order('name', { ascending: true }),
      ]);

      if (!programmeResult.error) setProgramme((programmeResult.data ?? []) as ProgrammeItem[]);
      if (!assignmentResult.error) {
        setAssignments((assignmentResult.data ?? []).map((row) => ({
          id: String(row.id), title: String(row.title), description: String(row.description ?? ''),
          dueDate: String(row.due_date ?? ''), status: String(row.status ?? 'Open'),
        })));
      }
      if (!contactResult.error) setContacts((contactResult.data ?? []) as HodContact[]);
    };
    void load();
  }, []);

  const addProgramme = async (title: string, content: string) => {
    const { data } = await supabase.from('hod_programme_content').insert({ title, content }).select().single();
    if (data) setProgramme((current) => [...current, data as ProgrammeItem]);
  };
  const removeProgramme = async (id: string) => {
    const { error } = await supabase.from('hod_programme_content').delete().eq('id', id);
    if (!error) setProgramme((current) => current.filter((item) => item.id !== id));
  };
  const addAssignment = async (title: string, description: string, dueDate: string) => {
    const { data } = await supabase.from('hod_assignments').insert({ title, description, due_date: dueDate || null }).select().single();
    if (data) setAssignments((current) => [...current, { id: String(data.id), title: String(data.title), description: String(data.description ?? ''), dueDate: String(data.due_date ?? ''), status: String(data.status ?? 'Open') }]);
  };
  const removeAssignment = async (id: string) => {
    const { error } = await supabase.from('hod_assignments').delete().eq('id', id);
    if (!error) setAssignments((current) => current.filter((item) => item.id !== id));
  };
  const addContact = async (contact: Omit<HodContact, 'id'>) => {
    const { data } = await supabase.from('hod_contacts').insert(contact).select().single();
    if (data) setContacts((current) => [...current, data as HodContact]);
  };
  const removeContact = async (id: string) => {
    const { error } = await supabase.from('hod_contacts').delete().eq('id', id);
    if (!error) setContacts((current) => current.filter((item) => item.id !== id));
  };

  return <HodContext.Provider value={{ programme, assignments, contacts, addProgramme, removeProgramme, addAssignment, removeAssignment, addContact, removeContact }}>{children}</HodContext.Provider>;
}

export function useHod() {
  const context = useContext(HodContext);
  if (!context) throw new Error('useHod must be used within a HodProvider');
  return context;
}