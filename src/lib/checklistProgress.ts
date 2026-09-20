import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './superbase';

// Which checklist tasks a student has ticked. Kept per student, in the checklist_progress table, and
// mirrored on the phone so ticking works offline and before that table exists in an older database.
// (Before this, a tick lived on the shared task row, so one student's tick showed for everyone.)

const localKey = (userId: string) => `checklist:done:${userId}`;

async function readLocal(userId: string): Promise<Set<string>> {
  try {
    const saved = await AsyncStorage.getItem(localKey(userId));
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

async function writeLocal(userId: string, done: Set<string>) {
  try {
    await AsyncStorage.setItem(localKey(userId), JSON.stringify([...done]));
  } catch {
    // The tick still shows for this session; only the saved copy is lost.
  }
}

// The ids of the tasks this student has done. The database wins when it can be reached. Anything
// ticked on the phone that never made it there is sent up now, so a tick is not lost.
export async function readDone(userId: string): Promise<Set<string>> {
  const local = await readLocal(userId);
  try {
    const { data, error } = await supabase.from('checklist_progress').select('item_id, done').eq('user_id', userId);
    if (error) return local;
    const remote = new Set((data ?? []).filter((row) => row.done !== false).map((row) => String(row.item_id)));
    const unsent = [...local].filter((id) => !remote.has(id));
    if (unsent.length) {
      void supabase.from('checklist_progress').upsert(unsent.map((item_id) => ({ user_id: userId, item_id, done: true })), { onConflict: 'user_id,item_id' });
      unsent.forEach((id) => remote.add(id));
    }
    await writeLocal(userId, remote);
    return remote;
  } catch {
    return local;
  }
}

// Ticks or unticks one task. The phone is updated first, so the screen never waits on the network.
export async function setDone(userId: string, itemId: string, done: boolean): Promise<void> {
  const local = await readLocal(userId);
  if (done) local.add(itemId);
  else local.delete(itemId);
  await writeLocal(userId, local);
  try {
    const { error } = await supabase.from('checklist_progress').upsert({ user_id: userId, item_id: itemId, done }, { onConflict: 'user_id,item_id' });
    if (error) console.warn('Could not save checklist progress to the database.', error.message);
  } catch (error) {
    console.warn('Could not save checklist progress to the database.', error);
  }
}
