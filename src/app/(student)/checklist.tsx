import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useAuth } from '../../context/AuthContext';
import { readDone, setDone } from '../../lib/checklistProgress';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';
import { ChecklistItem } from '../../types';

const CHECKLIST_CACHE_KEY = '@checklist_cache';

type ChecklistTask = ChecklistItem & {
  databaseId: string;
  databaseKey: 'checklist_item_id' | 'id';
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

export default function ChecklistScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;

  const palette = {
    pageBg: colors.background,
    headerBox: colors.card,
    headerTitle: colors.text,
    headerSub: colors.textSecondary,
    cardBg: colors.surface,
    taskText: colors.text,
    taskMuted: colors.textSecondary,
    category: colors.textSecondary,
    progressTrack: colors.border,
    celebrationBg: colors.surface,
  };

  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchChecklist = async () => {
    // Ticks belong to the student, not to the shared task row.
    const done = userId ? await readDone(userId) : new Set<string>();
    const withProgress = (list: ChecklistTask[]) => list.map((task) => ({ ...task, completion_status: done.has(task.id) }));

    try {
      const cached = await AsyncStorage.getItem(CHECKLIST_CACHE_KEY);
      if (cached) {
        setTasks(withProgress(JSON.parse(cached) as ChecklistTask[]));
      }

      const { data, error } = await supabase
        .from('checklist_item')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setLoadError(false);

      const remoteTasks = (data ?? []).map((row, index) => {
        const item = row as Record<string, unknown>;
        const databaseKey: 'checklist_item_id' | 'id' = item.checklist_item_id != null ? 'checklist_item_id' : 'id';
        const databaseId = String(item[databaseKey] ?? `checklist-${index}`);

        return {
          id: databaseId,
          databaseId,
          databaseKey,
          created_at: new Date((item.created_at as string) ?? new Date().toISOString()),
          task_description: String(item.task_description ?? ''),
          category: String(item.category ?? item.support_category ?? 'General'),
          completion_status: normalizeBoolean(item.completion_status),
        };
      });

      setTasks(withProgress(remoteTasks));

      if (remoteTasks.length) {
        await AsyncStorage.setItem(CHECKLIST_CACHE_KEY, JSON.stringify(remoteTasks));
      }
    } catch (error) {
      console.error('Failed to load checklist from Supabase.', error);
      setLoadError(true);
      const cached = await AsyncStorage.getItem(CHECKLIST_CACHE_KEY);
      if (cached) {
        try {
          setTasks(withProgress(JSON.parse(cached) as ChecklistTask[]));
        } catch (cacheError) {
          console.error('Failed to parse cached checklist data.', cacheError);
        }
      } else {
        setTasks([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completion_status: nextStatus } : task
    );

    setTasks(updatedTasks);
    await AsyncStorage.setItem(CHECKLIST_CACHE_KEY, JSON.stringify(updatedTasks));

    if (userId) await setDone(userId, taskId, nextStatus);
  };

  const completedCount = tasks.filter((task) => task.completion_status).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount ? (completedCount / totalCount) * 100 : 0;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  return (
    <View style={[styles.container, { backgroundColor: palette.pageBg }]}>
      <PageHeader
        eyebrow={t('common.firstSteps')}
        title={t('common.checklistTitle')}
        subtitle={t('common.checklistSubtitle')}
      />

      {loadError && (
        <ShameResilientBanner
          message={t('common.tryAgain')}
          type="info"
        />
      )}

      <View style={[styles.headerBox, { backgroundColor: palette.headerBox, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: palette.headerTitle }]}>{t('common.progress')}</Text>
        <Text style={[styles.headerSub, { color: palette.headerSub }]}>
          {t('common.stepsCompleted', { completed: completedCount, total: totalCount })}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: palette.progressTrack }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: colors.accent,
              },
            ]}
          />
        </View>
      </View>

      {isAllComplete && (
        <View
          style={[
            styles.celebrationCard,
            {
              backgroundColor: palette.celebrationBg,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.celebrationText, { color: colors.text }]}>{t('checklist.allDone')}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : tasks.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: palette.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: palette.taskText }]}>{t('checklist.notAvailableTitle')}</Text>
          <Text style={[styles.emptyText, { color: palette.taskMuted }]}>{t('checklist.notAvailableText')}</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.taskCard, { backgroundColor: palette.cardBg }]}
              onPress={() => void toggleTask(item.id, item.completion_status)}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.border },
                  item.completion_status && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                {item.completion_status && <Text style={[styles.checkmark, { color: colors.text }]}>✓</Text>}
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.taskText,
                    { color: palette.taskText },
                    item.completion_status && styles.taskCompleted,
                  ]}
                >
                  {item.task_description}
                </Text>
                <Text style={[styles.category, { color: palette.category }]}>{item.category}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerBox: { padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSub: { fontSize: 13, marginTop: 4 },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', borderRadius: 999 },
  celebrationCard: { padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  celebrationText: { fontSize: 13, fontWeight: '700' },
  taskCard: { flexDirection: 'row', padding: 16, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkmark: { fontSize: 12, fontWeight: 'bold' },
  textContainer: { flex: 1 },
  taskText: { fontSize: 14 },
  taskCompleted: { textDecorationLine: 'line-through' },
  category: { fontSize: 11, marginTop: 2 },
  emptyState: { borderWidth: 1, borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
});
