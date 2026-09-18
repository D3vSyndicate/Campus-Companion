import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { supabase } from '../../lib/superbase';
import { MOCK_CHECKLIST } from '../../mockData';
import { useTheme } from '../../theme/ThemeContext';
import { ChecklistItem } from '../../types';

const CHECKLIST_CACHE_KEY = '@checklist_cache';

export default function ChecklistScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const palette = {
    pageBg: colors.background,
    headerBox: colors.card,
    headerTitle: colors.text,
    headerSub: colors.textSecondary,
    cardBg: colors.surface,
    taskText: colors.text,
    taskMuted: colors.textSecondary,
    category: colors.textSecondary,
  };

  const [tasks, setTasks] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      const cached = await AsyncStorage.getItem(CHECKLIST_CACHE_KEY);
      if (cached) {
        setTasks(JSON.parse(cached) as ChecklistItem[]);
      }

      const { data, error } = await supabase
        .from('checklist_item')
        .select('*')
        .order('id');

      if (error) {
        throw error;
      }

      if (data?.length) {
        const remoteTasks = data.map((row, index) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? item.item_id ?? index + 1),
            task: String(item.task ?? item.title ?? item.name ?? ''),
            category: String(item.category ?? 'General'),
            completed: Boolean(item.completed ?? item.is_completed),
          };
        });
        setTasks(remoteTasks);
        await AsyncStorage.setItem(CHECKLIST_CACHE_KEY, JSON.stringify(remoteTasks));
      } else if (!cached) {
        setTasks(MOCK_CHECKLIST);
      }
    } catch {
      const cached = await AsyncStorage.getItem(CHECKLIST_CACHE_KEY);
      if (!cached) {
        setTasks(MOCK_CHECKLIST);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, task: string, currentStatus: boolean) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !currentStatus } : task,
    );

    setTasks(updatedTasks);
    await AsyncStorage.setItem(CHECKLIST_CACHE_KEY, JSON.stringify(updatedTasks));

    try {
      await supabase
        .from('checklist_item')
        .update({ completed: !currentStatus })
        .eq('task', task);
    } catch {
      // Keep the local cache when the remote sync is unavailable.
    }
  };

  const completedCount = tasks.filter(task => task.completed).length;

  return (
    <View style={[styles.container, { backgroundColor: palette.pageBg }]}>
      <PageHeader
        eyebrow={t('common.firstSteps')}
        title={t('common.checklistTitle')}
        subtitle={t('common.checklistSubtitle')}
      />
      <View style={[styles.headerBox, { backgroundColor: palette.headerBox, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: palette.headerTitle }]}>{t('common.progress')}</Text>
        <Text style={[styles.headerSub, { color: palette.headerSub }]}>
          {t('common.stepsCompleted', { completed: completedCount, total: tasks.length })}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.taskCard, { backgroundColor: palette.cardBg }]}
              onPress={() => void toggleTask(item.id, item.task, item.completed)}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.border },
                  item.completed && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                {item.completed && <Text style={[styles.checkmark, { color: colors.text }]}>✓</Text>}
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.taskText, { color: palette.taskText }, item.completed && styles.taskCompleted]}>
                  {item.task}
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
  headerBox: { padding: 16, borderRadius: 10, marginBottom: 16, borderWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  headerSub: { fontSize: 13, marginTop: 4 },
  taskCard: { flexDirection: 'row', padding: 16, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkmark: { fontSize: 12, fontWeight: 'bold' },
  textContainer: { flex: 1 },
  taskText: { fontSize: 14 },
  taskCompleted: { textDecorationLine: 'line-through' },
  category: { fontSize: 11, marginTop: 2 },
});
