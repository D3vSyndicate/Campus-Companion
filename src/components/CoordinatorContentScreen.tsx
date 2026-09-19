import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/superbase';
import { useTheme } from '../theme/ThemeContext';
import { PageHeader } from './PageHeader';

type Props = { title: string; description: string; placeholder: string; storageKey: string };

type ContentItem = { id: string; content: string };

export default function CoordinatorContentScreen({ title, description, placeholder, storageKey }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadItems = async () => {
      try {
        const { data, error } = await supabase
          .from('coordinator_content')
          .select('id, content')
          .eq('module', storageKey)
          .order('created_at', { ascending: true });

        if (error) {
          if (active) setSyncMessage('Unable to load this module from the database. Apply the coordinator_content migration and check your access policy.');
          return;
        }

        if (active) {
          const remoteItems = data.map((row) => ({
            id: String(row.id),
            content: String(row.content ?? ''),
          }));
          setItems(remoteItems);
        }
      } catch (error) {
        console.error(`Failed to load coordinator ${storageKey} content.`, error);
        if (active) setSyncMessage('Unable to load this module from the database.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadItems();
    return () => {
      active = false;
    };
  }, [storageKey]);

  const addItem = async () => {
    const value = draft.trim();
    if (!value) return;

    setSyncMessage('');
    const { data, error } = await supabase
      .from('coordinator_content')
      .insert({ module: storageKey, content: value })
      .select('id, content')
      .single();

    if (error || !data) {
      setSyncMessage('This item could not be saved to the database.');
    } else {
      setItems((current) => [...current, { id: String(data.id), content: String(data.content) }]);
    }

    setDraft('');
  };

  const removeItem = (item: ContentItem) => {
    Alert.alert('Remove item', `Remove "${item.content}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const { error } = await supabase.from('coordinator_content').delete().eq('id', item.id);
            if (error) {
              setSyncMessage('This item could not be removed from the database.');
              return;
            }
            setItems((current) => current.filter((entry) => entry.id !== item.id));
          })();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<View>
          <PageHeader eyebrow="Manage" title={title} subtitle={description} showSearch={false} showBack backFallback="/(coordinator)" />
          {syncMessage ? <Text style={[styles.syncMessage, { color: colors.danger }]}>{syncMessage}</Text> : null}
          <View style={styles.form}>
            <TextInput value={draft} onChangeText={setDraft} placeholder={placeholder} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} editable={!loading} />
            <TouchableOpacity onPress={() => void addItem()} style={[styles.addButton, { backgroundColor: colors.accent }, loading && styles.disabled]} disabled={loading}><Text style={styles.addText}>Add</Text></TouchableOpacity>
          </View>
        </View>}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nothing has been added yet.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.itemText, { color: colors.text }]}>{item.content}</Text>
            <TouchableOpacity onPress={() => removeItem(item)}><Text style={[styles.removeText, { color: colors.danger }]}>Remove</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16, paddingBottom: 32 }, title: { fontSize: 22, fontWeight: '700', marginBottom: 6 }, description: { fontSize: 14, lineHeight: 20, marginBottom: 8 }, syncMessage: { fontSize: 12, lineHeight: 18, marginBottom: 10 }, form: { flexDirection: 'row', gap: 8, marginBottom: 18 }, input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 15 }, addButton: { minWidth: 62, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, addText: { color: '#071B2C', fontWeight: '700' }, item: { minHeight: 58, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, itemText: { flex: 1, fontSize: 15, lineHeight: 20 }, removeText: { fontSize: 13, fontWeight: '600' }, empty: { textAlign: 'center', marginTop: 20 }, disabled: { opacity: 0.5 },
});