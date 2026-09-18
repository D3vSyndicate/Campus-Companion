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

type DigitalReadiness = {
  id: string;
  name: string;
  description: string;
};

export default function DigitalScreen() {
  const { colors } = useTheme();

  const [items, setItems] = useState<DigitalReadiness[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDigitalReadiness = useCallback(async () => {
    const { data, error } = await supabase
      .from('digital_readiness')
      .select('id, name, description')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to load digital readiness:', error);

      Alert.alert(
        'Error',
        `Could not load digital readiness.\n\n${error.message}`,
      );

      return;
    }

    const mapped: DigitalReadiness[] = (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ''),
      description: String(row.description ?? ''),
    }));

    setItems(mapped);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadDigitalReadiness();
      setLoading(false);
    };

    load();
  }, [loadDigitalReadiness]);

  const addDigitalReadiness = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter both a name and a description.',
      );

      return;
    }

    const { error } = await supabase
      .from('digital_readiness')
      .insert({
        name: name.trim(),
        description: description.trim(),
      });

    if (error) {
      console.error('Failed to add digital readiness:', error);

      Alert.alert(
        'Error',
        `Could not add digital readiness.\n\n${error.message}`,
      );

      return;
    }

    setName('');
    setDescription('');

    await loadDigitalReadiness();

    Alert.alert(
      'Success',
      'Digital readiness item added successfully.',
    );
  };

  const deleteDigitalReadiness = (item: DigitalReadiness) => {
    Alert.alert(
      'Delete item',
      `Delete "${item.name}"?`,
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
              .from('digital_readiness')
              .delete()
              .eq('id', item.id);

            if (error) {
              console.error(
                'Failed to delete digital readiness:',
                error,
              );

              Alert.alert(
                'Error',
                `Could not delete item.\n\n${error.message}`,
              );

              return;
            }

            await loadDigitalReadiness();
          },
        },
      ],
    );
  };

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
        onRefresh={loadDigitalReadiness}
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
              Digital Readiness
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Provide students with digital skills, tools, and
              technology guidance.
            </Text>

            <View style={styles.form}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Digital readiness title"
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
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the digital readiness information"
                placeholderTextColor={colors.textSecondary}
                multiline
                style={[
                  styles.messageInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TouchableOpacity
                onPress={addDigitalReadiness}
                style={[
                  styles.addButton,
                  {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <Text style={styles.addText}>
                  Add Digital Readiness
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Digital Readiness Items
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
            No digital readiness items yet.
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
                {item.name}
              </Text>

              <Text
                style={[
                  styles.itemDescription,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {item.description}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteDigitalReadiness(item)}
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

  messageInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
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
    minHeight: 80,
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
    marginBottom: 5,
  },

  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
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