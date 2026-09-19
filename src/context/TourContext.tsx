import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppTour } from '../components/AppTour';
import { supabase } from '../lib/superbase';
import { useAuth } from './AuthContext';

// The first-time tour: shown once to each student, remembered on the phone and on the account.
//
// The phone remembers it straight away, even offline. The account remembers it as a note in the
// student's profile details, so signing in on another phone or after reinstalling does not ask again.

const localKey = (userId: string) => `tour:done:${userId}`;
const ACCOUNT_NOTE = 'app_tour_seen';

async function hasCompletedTour(user: User): Promise<boolean> {
  if (user.user_metadata?.[ACCOUNT_NOTE] === true) return true;
  try {
    return (await AsyncStorage.getItem(localKey(user.id))) === '1';
  } catch {
    return false;
  }
}

async function markTourDone(user: User) {
  try {
    await AsyncStorage.setItem(localKey(user.id), '1');
  } catch {
    // The account note below is a second chance.
  }

  // Replaying the tour later must not send the same note again.
  if (user.user_metadata?.[ACCOUNT_NOTE] === true) return;

  try {
    // The whole existing set of details is sent back with the new note, so nothing else is ever lost.
    await supabase.auth.updateUser({ data: { ...user.user_metadata, [ACCOUNT_NOTE]: true } });
  } catch {
    // Being offline only means this phone remembers it and the account will learn next time.
  }
}

type TourContextValue = { openTour: () => void };

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const userId = user?.id;

  // Ask once: the first time a student who has not seen it is signed in.
  useEffect(() => {
    if (loading || !user || role !== 'student') return;
    let active = true;

    void (async () => {
      if (await hasCompletedTour(user)) return;
      if (active) setVisible(true);
    })();

    return () => {
      active = false;
    };
    // Only re-check when a different student signs in, not every time their profile details change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userId, role]);

  const finish = useCallback(() => {
    setVisible(false);
    if (user) void markTourDone(user);
  }, [user]);

  const openTour = useCallback(() => setVisible(true), []);
  const value = useMemo(() => ({ openTour }), [openTour]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <AppTour visible={visible} onClose={finish} />
    </TourContext.Provider>
  );
}

// Null outside the student area, so shared screens can tell whether a tour is available.
export function useTour() {
  return useContext(TourContext);
}
