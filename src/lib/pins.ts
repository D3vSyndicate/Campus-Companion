import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../context/AuthContext';

// Campus events a student has pinned to their calendar. Like their own calendar entries, pins stay on
// the phone: nothing here is sent to staff. Pinning is a way to say "I am thinking of going", so it
// never schedules a reminder or nags anyone.

const KEY = 'calendar:pins';
const keyFor = (userId: string) => `${KEY}:${userId}`;

const EMPTY: ReadonlySet<string> = new Set();
const cache = new Map<string, Set<string>>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

async function load(userId: string): Promise<Set<string>> {
  const known = cache.get(userId);
  if (known) return known;
  let pins = new Set<string>();
  try {
    const saved = await AsyncStorage.getItem(keyFor(userId));
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (Array.isArray(parsed)) pins = new Set(parsed.map(String));
  } catch {
    // Losing pins is a small disappointment, never an error worth showing.
  }
  cache.set(userId, pins);
  return pins;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Every screen that shows pins uses this, so pinning on the events list shows up on the calendar at
// once, and the other way round. It reads the store through useSyncExternalStore on purpose: the store
// lives outside React, so this is the one way every screen is guaranteed to redraw when it changes.
export function usePinnedEvents() {
  const { user } = useAuth();
  const userId = user?.id ?? 'guest';

  const pinned = useSyncExternalStore(
    subscribe,
    () => cache.get(userId) ?? EMPTY,
    () => EMPTY,
  );

  useEffect(() => {
    void load(userId).then(notify);
  }, [userId]);

  // Returns true when the event is now pinned, false when it was unpinned.
  const toggle = useCallback(
    async (eventId: string) => {
      const next = new Set(await load(userId));
      const nowPinned = !next.has(eventId);
      if (nowPinned) next.add(eventId);
      else next.delete(eventId);
      cache.set(userId, next);
      notify();
      try {
        await AsyncStorage.setItem(keyFor(userId), JSON.stringify([...next]));
      } catch {
        // Stays pinned for this session; only the saved copy is lost.
      }
      return nowPinned;
    },
    [userId],
  );

  return { pinned, isPinned: (eventId: string) => pinned.has(eventId), toggle };
}
