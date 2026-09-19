import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithOfflineFallback } from './offlineData';

// The digital readiness tutorial is the list of guides on the Digital screen (the digital_readiness
// table). The Home screen uses these helpers to show how many guides a student has opened.

const INTRO_KEY = 'readiness:intro-seen';
const OPENED_KEY = 'readiness:opened';

export async function hasSeenReadinessIntro(userId: string) {
  try {
    return (await AsyncStorage.getItem(`${INTRO_KEY}:${userId}`)) === '1';
  } catch {
    return false;
  }
}

export async function markReadinessIntroSeen(userId: string) {
  try {
    await AsyncStorage.setItem(`${INTRO_KEY}:${userId}`, '1');
  } catch {
    // Not being able to remember this only means the student sees the welcome again.
  }
}

async function readOpened(userId: string): Promise<string[]> {
  try {
    const saved = await AsyncStorage.getItem(`${OPENED_KEY}:${userId}`);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// Remembers, on this phone, that the student has opened a guide.
export async function markGuideOpened(userId: string, guideId: string) {
  try {
    const opened = await readOpened(userId);
    if (opened.includes(guideId)) return;
    await AsyncStorage.setItem(`${OPENED_KEY}:${userId}`, JSON.stringify([...opened, guideId]));
  } catch {
    // Progress is a convenience. Losing it never blocks a guide.
  }
}

// A guide row is worth counting once it has something to read.
const hasContent = (row: Record<string, unknown>) =>
  String(row.name ?? '').trim().length > 0 && (String(row.description ?? '').trim().length > 0 || (Array.isArray(row.steps) && row.steps.length > 0));

// How many guides exist and how many this student has opened.
export function useReadiness() {
  const { user } = useAuth();
  const userId = user?.id;
  const [guideIds, setGuideIds] = useState<string[]>([]);
  const [opened, setOpened] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload whenever the Home screen comes back into view, so guides opened since then are counted.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        // A missing or unreachable table just means there is nothing to count. It is not an error worth alarming anyone about.
        const { data } = await fetchWithOfflineFallback('digital_readiness');
        const ids = (Array.isArray(data) ? (data as Record<string, unknown>[]) : [])
          .filter(hasContent)
          .map((row) => String(row.id ?? row.digital_readiness_id ?? ''))
          .filter(Boolean);
        const seen = userId ? await readOpened(userId) : [];
        if (!active) return;
        setGuideIds(ids);
        setOpened(seen);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [userId]),
  );

  return {
    loading,
    totalSteps: guideIds.length,
    doneSteps: guideIds.filter((id) => opened.includes(id)).length,
  };
}
