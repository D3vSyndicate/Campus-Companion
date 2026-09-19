import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useHod } from '../../context/HodContext';
import { useTheme } from '../../theme/ThemeContext';

export default function HodAssignmentsScreen() {
  const { colors } = useTheme();
  const { assignments, addAssignment, removeAssignment } = useHod();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const save = async () => {
    if (!title.trim()) return Alert.alert('Missing information', 'Add an assignment title.');
    await addAssignment(title.trim(), description.trim(), dueDate.trim());
    setTitle(''); setDescription(''); setDueDate('');
  };
  return <FlatList data={assignments} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} style={{ backgroundColor: colors.background }} ListHeaderComponent={<View>
    <Text style={[styles.heading, { color: colors.text }]}>Assignments</Text>
    <Text style={[styles.description, { color: colors.textSecondary }]}>Keep students informed about departmental tasks and important dates.</Text>
    <TextInput value={title} onChangeText={setTitle} placeholder="Assignment title" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />
    <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={colors.textSecondary} multiline style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />
    <TextInput value={dueDate} onChangeText={setDueDate} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />
    <TouchableOpacity onPress={() => void save()} style={[styles.button, { backgroundColor: colors.accent }]}><Text style={styles.buttonText}>Add assignment</Text></TouchableOpacity>
  </View>} ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>No assignments have been added.</Text>} renderItem={({ item }) => <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text><Text style={[styles.itemText, { color: colors.textSecondary }]}>{item.description || 'No description provided.'}</Text><Text style={[styles.due, { color: colors.accent }]}>{item.dueDate ? `Due ${item.dueDate}` : 'No due date'}</Text><TouchableOpacity onPress={() => void removeAssignment(item.id)}><Text style={[styles.remove, { color: colors.danger }]}>Remove</Text></TouchableOpacity></View>} />;
}

const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 32 }, heading: { fontSize: 23, fontWeight: '800', marginBottom: 6 }, description: { fontSize: 14, lineHeight: 20, marginBottom: 14 }, input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 46, marginBottom: 10, fontSize: 15 }, textArea: { minHeight: 90, textAlignVertical: 'top' }, button: { minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, buttonText: { color: '#071B2C', fontWeight: '800' }, item: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 }, itemTitle: { fontSize: 16, fontWeight: '800' }, itemText: { fontSize: 14, lineHeight: 20, marginTop: 6 }, due: { fontSize: 13, fontWeight: '700', marginTop: 8 }, remove: { fontSize: 13, fontWeight: '700', marginTop: 10 }, empty: { textAlign: 'center', marginTop: 20 },
});
