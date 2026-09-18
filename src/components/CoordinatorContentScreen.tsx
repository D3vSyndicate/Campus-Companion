import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = { title: string; description: string; placeholder: string; initialItems: string[] };

export default function CoordinatorContentScreen({ title, description, placeholder, initialItems }: Props) {
  const { colors } = useTheme();
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const value = draft.trim();
    if (!value) return;
    setItems((current) => [...current, value]);
    setDraft('');
  };

  const removeItem = (item: string) => {
    Alert.alert('Remove item', `Remove "${item}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems((current) => current.filter((entry) => entry !== item)) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item}-${index}`}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
          <View style={styles.form}>
            <TextInput value={draft} onChangeText={setDraft} placeholder={placeholder} placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />
            <TouchableOpacity onPress={addItem} style={[styles.addButton, { backgroundColor: colors.accent }]}><Text style={styles.addText}>Add</Text></TouchableOpacity>
          </View>
        </View>}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Nothing has been added yet.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.itemText, { color: colors.text }]}>{item}</Text>
            <TouchableOpacity onPress={() => removeItem(item)}><Text style={[styles.removeText, { color: colors.danger }]}>Remove</Text></TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16, paddingBottom: 32 }, title: { fontSize: 22, fontWeight: '700', marginBottom: 6 }, description: { fontSize: 14, lineHeight: 20, marginBottom: 16 }, form: { flexDirection: 'row', gap: 8, marginBottom: 18 }, input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 15 }, addButton: { minWidth: 62, minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, addText: { color: '#071B2C', fontWeight: '700' }, item: { minHeight: 58, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, itemText: { flex: 1, fontSize: 15, lineHeight: 20 }, removeText: { fontSize: 13, fontWeight: '600' }, empty: { textAlign: 'center', marginTop: 20 },
});