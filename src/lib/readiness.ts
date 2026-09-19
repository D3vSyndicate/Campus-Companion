import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from './superbase';

export type ReadinessStep = {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  body: string;
  mediaType: 'none' | 'image' | 'video';
  mediaUrl: string;
  linkUrl: string;
  linkLabel: string;
};

export type ReadinessModule = {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  steps: ReadinessStep[];
};

const str = (value: unknown) => String(value ?? '').trim();

const INTRO_KEY = 'readiness:intro-seen';

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

// Loads the tutorial (modules + steps) and the signed-in student's completed steps.
export function useReadiness() {
  const { user } = useAuth();
  const [modules, setModules] = useState<ReadinessModule[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [moduleResult, stepResult, progressResult] = await Promise.all([
      supabase.from('readiness_modules').select('*').order('sort_order'),
      supabase.from('readiness_steps').select('*').order('sort_order'),
      user
        ? supabase.from('readiness_progress').select('step_id').eq('auth_id', user.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const failure = moduleResult.error ?? stepResult.error;
    if (failure) {
      console.error('Failed to load digital readiness.', failure);
      setError(failure.message);
      setLoading(false);
      return;
    }
    setError('');

    const steps: ReadinessStep[] = (stepResult.data ?? []).map((row) => {
      const item = row as Record<string, unknown>;
      const mediaType = str(item.media_type);
      return {
        id: str(item.step_id),
        moduleId: str(item.module_id),
        order: Number(item.sort_order ?? 0),
        title: str(item.title),
        body: str(item.body),
        mediaType: mediaType === 'image' || mediaType === 'video' ? mediaType : 'none',
        mediaUrl: str(item.media_url),
        linkUrl: str(item.link_url),
        linkLabel: str(item.link_label),
      };
    });

    setModules(
      (moduleResult.data ?? []).map((row) => {
        const item = row as Record<string, unknown>;
        const id = str(item.module_id);
        return {
          id,
          title: str(item.title),
          description: str(item.description),
          icon: str(item.icon) || 'laptop-outline',
          order: Number(item.sort_order ?? 0),
          steps: steps.filter((step) => step.moduleId === id).sort((a, b) => a.order - b.order),
        };
      }),
    );

    if (!progressResult.error) {
      setDone(new Set((progressResult.data ?? []).map((row) => str((row as Record<string, unknown>).step_id))));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  // Optimistic: tick straight away, roll back if the database says no.
  const setStepDone = useCallback(
    async (stepId: string, completed: boolean) => {
      if (!user) return;
      setDone((current) => {
        const next = new Set(current);
        if (completed) next.add(stepId);
        else next.delete(stepId);
        return next;
      });

      const { error: writeError } = completed
        ? await supabase.from('readiness_progress').upsert({ auth_id: user.id, step_id: stepId }, { onConflict: 'auth_id,step_id' })
        : await supabase.from('readiness_progress').delete().eq('auth_id', user.id).eq('step_id', stepId);

      if (writeError) {
        console.error('Failed to save readiness progress.', writeError);
        setDone((current) => {
          const next = new Set(current);
          if (completed) next.delete(stepId);
          else next.add(stepId);
          return next;
        });
      }
    },
    [user],
  );

  const totalSteps = modules.reduce((sum, module) => sum + module.steps.length, 0);
  const doneSteps = modules.reduce((sum, module) => sum + module.steps.filter((step) => done.has(step.id)).length, 0);

  return { modules, done, loading, error, totalSteps, doneSteps, setStepDone, reload: load };
}
