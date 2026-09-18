import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

type ChecklistItem = {
  id: string;
  taskDescription: string;
  category: string;
  completionStatus: string;
};

export default function ChecklistScreen() {
  const { colors } = useTheme();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [taskDescription, setTaskDescription] = useState('');
  const [category, setCategory] = useState('Orientation');
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Load checklist items
  // ---------------------------------------------------------------------------

  const loadChecklistItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('checklist_item')
      .select(
        'checklist_item_id, created_at, task_description, category, completion_status',
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load checklist items:', error);

      Alert.alert(
        'Error',
        `Could not load checklist items.\n\n${error.message}`,
      );

      return;
    }

    const mapped: ChecklistItem[] = (data ?? []).map((row) => ({
      id: String(row.checklist_item_id),
      taskDescription: String(row.task_description ?? ''),
      category: String(row.category ?? 'Orientation'),
      completionStatus: String(row.completion_status ?? 'false'),
    }));

    setItems(mapped);
  }, []);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      await loadChecklistItems();

      setLoading(false);
    };

    load();
  }, [loadChecklistItems]);

  // ---------------------------------------------------------------------------
  // Add checklist item
  // ---------------------------------------------------------------------------

  const addChecklistItem = async () => {
    if (!taskDescription.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter a checklist task.',
      );

      return;
    }

    const { error } = await supabase
      .from('checklist_item')
      .insert({
        task_description: taskDescription.trim(),
        category: category.trim() || 'Orientation',
        completion_status: 'false',
      });

    if (error) {
      console.error('Failed to add checklist item:', error);

      Alert.alert(
        'Error',
        `Could not add checklist item.\n\n${error.message}`,
      );

      return;
    }

    setTaskDescription('');
    setCategory('Orientation');

    await loadChecklistItems();

    Alert.alert(
      'Success',
      'Checklist item added successfully.',
    );
  };

  // ---------------------------------------------------------------------------
  // Delete checklist item
  // ---------------------------------------------------------------------------

  const deleteChecklistItem = (item: ChecklistItem) => {
    Alert.alert(
      'Delete checklist item',
      `Delete "${item.taskDescription}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('checklist_item')
              .delete()
              .eq('checklist_item_id', item.id);

            if (error) {
              console.error(
                'Failed to delete checklist item:',
                error,
              );

              Alert.alert(
                'Error',
                `Could not delete checklist item.\n\n${error.message}`,
              );

              return;
            }

            await loadChecklistItems();
          },
        },
      ],
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={loadChecklistItems}
        ListHeaderComponent={
          <View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Checklist
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Organise tasks students need to complete during
              orientation.
            </Text>

            {/* ------------------------------------------------------------- */}
            {/* FORM */}
            {/* ------------------------------------------------------------- */}

            <View style={styles.form}>
              <TextInput
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Add a checklist task"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Category"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TouchableOpacity
                onPress={addChecklistItem}
                style={[
                  styles.addButton,
                  {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <Text style={styles.addText}>
                  Add Checklist Item
                </Text>
              </TouchableOpacity>
            </View>

            {/* ------------------------------------------------------------- */}
            {/* LIST TITLE */}
            {/* ------------------------------------------------------------- */}

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Published Checklist
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No checklist items yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {item.taskDescription}
              </Text>

              <Text
                style={[
                  styles.category,
                  {
                    color: colors.accent,
                  },
                ]}
              >
                Category: {item.category}
              </Text>

              <Text
                style={[
                  styles.status,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Status: Not completed
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteChecklistItem(item)}
            >
              <Text
                style={[
                  styles.removeText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  form: {
    marginBottom: 24,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 10,
  },

  addButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  addText: {
    color: '#071B2C',
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  item: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  itemContent: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  category: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },

  status: {
    fontSize: 12,
  },

  removeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});