import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// How long an announcement counts as new. Older ones never show the tag, even if nobody opened them.
export const NEW_WINDOW_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;
const SEEN_LIMIT = 200;

// When an announcement went out. The Announcement table keeps that time in posted_by.
export function postedAtOf(row: Record<string, unknown>): Date | null {
  const raw = row.posted_by ?? row.posted_at ?? row.created_at ?? row['Posted at'];
  if (!raw) return null;
  const date = new Date(String(raw));
  return Number.isNaN(date.getTime()) ? null : date;
}

// Posted within the last week. A few minutes into the future are allowed, because a phone's clock can
// be slightly ahead of the server's.
export function isRecent(postedAt: Date | null, now: Date = new Date(), days: number = NEW_WINDOW_DAYS) {
  if (!postedAt) return false;
  const age = now.getTime() - postedAt.getTime();
  return age >= -5 * 60 * 1000 && age <= days * DAY;
}

// Newest first. An announcement with no date goes last.
export function newestFirst<T extends { postedAt: Date | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.postedAt?.getTime() ?? -Infinity) - (a.postedAt?.getTime() ?? -Infinity));
}

// "Just now", "3 h ago", "Yesterday", "4 days ago", or the date for anything older than a week.
export function postedLabel(postedAt: Date | null, now: Date = new Date()): string {
  if (!postedAt) return '';
  const minutes = Math.floor((now.getTime() - postedAt.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(postedAt)) / DAY);

  if (days <= 0) return `${Math.floor(minutes / 60)} h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return postedAt.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(postedAt.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}

// Which announcements this person has already opened, remembered on this phone. A new one stops
// showing the tag once it has been read.
export function useSeenAnnouncements(userId?: string) {
  const key = `announcements:seen:${userId ?? 'guest'}`;
  const [seen, setSeen] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        const list: unknown = raw ? JSON.parse(raw) : [];
        if (active && Array.isArray(list)) setSeen(new Set(list.map(String)));
      } catch {
        // Not remembering only means the tag shows again next time.
      }
    })();
    return () => {
      active = false;
    };
  }, [key]);

  const markSeen = useCallback(
    (ids: string | string[]) => {
      const wanted = (Array.isArray(ids) ? ids : [ids]).filter((id) => !seen.has(id));
      if (!wanted.length) return;

      const next = new Set(seen);
      wanted.forEach((id) => next.add(id));
      setSeen(next);
      void AsyncStorage.setItem(key, JSON.stringify([...next].slice(-SEEN_LIMIT))).catch(() => undefined);
    },
    [key, seen],
  );

  return { seen, markSeen };
}
