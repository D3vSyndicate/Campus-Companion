import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { useAppearance } from '../../context/AppearanceContext';
import { MOCK_CHECKLIST } from '../../mockData';
import { ChecklistItem } from '../../types';
import { supabase } from '../lib/superbase';

const CHECKLIST_CACHE_KEY = '@checklist_cache';

export default function ChecklistScreen() {
  const { darkMode } = useAppearance();
  const palette = darkMode
    ? {
        pageBg: '#0B1220',
        headerBox: '#1B2437',
        headerTitle: '#F1F7FF',
        headerSub: '#C4D3EA',
        cardBg: '#111B2E',
        taskText: '#EFF7FF',
        taskMuted: '#A8B9D1',
        category: '#A8B9D1',
      }
    : {
        pageBg: '#F4F6F9',
        headerBox: '#FFF8D9',
        headerTitle: '#0B1F3A',
        headerSub: '#5F501C',
        cardBg: '#FFFFFF',
        taskText: '#1E293B',
        taskMuted: '#94A3B8',
        category: '#64748B',
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
        eyebrow="YOUR FIRST STEPS"
        title="New student checklist"
        subtitle="Small steps add up. Keep track of what is done and what is next."
      />
      <View style={[styles.headerBox, { backgroundColor: palette.headerBox }]}>
        <Text style={[styles.headerTitle, { color: palette.headerTitle }]}>You are making progress</Text>
        <Text style={[styles.headerSub, { color: palette.headerSub }]}>
          {completedCount} of {tasks.length} steps completed. Take one step at a time.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0B1F3A" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.taskCard, { backgroundColor: palette.cardBg }]}
              onPress={() => void toggleTask(item.id, item.task, item.completed)}>
              <View style={[styles.checkbox, item.completed && styles.checked]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
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
  container: { flex: 1, backgroundColor: '#F4F6F9', padding: 16 },
  headerBox: { backgroundColor: '#FFF8D9', padding: 16, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#F4C542' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B1F3A' },
  headerSub: { fontSize: 13, color: '#5F501C', marginTop: 4 },
  taskCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, marginBottom: 8, alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#94A3B8', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  textContainer: { flex: 1 },
  taskText: { fontSize: 14, color: '#1E293B' },
  taskCompleted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  category: { fontSize: 11, color: '#64748B', marginTop: 2 },
});
