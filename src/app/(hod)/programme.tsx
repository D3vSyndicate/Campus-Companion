import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useHod } from '../../context/HodContext';
import { useTheme } from '../../theme/ThemeContext';

export default function HodProgrammeScreen() {
  const { colors } = useTheme();
  const { programme, addProgramme, removeProgramme } = useHod();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const save = async () => {
    if (!title.trim() || !content.trim()) return Alert.alert('Missing information', 'Add a title and programme information.');
    await addProgramme(title.trim(), content.trim());
    setTitle(''); setContent('');
  };
  return <FlatList data={programme} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} style={{ backgroundColor: colors.background }} ListHeaderComponent={<View>
    <Text style={[styles.heading, { color: colors.text }]}>Programme information</Text>
    <Text style={[styles.description, { color: colors.textSecondary }]}>Publish programme details, departmental expectations, and guidance students can rely on.</Text>
    <TextInput value={title} onChangeText={setTitle} placeholder="Section title" placeholderTextColor={colors.textSecondary} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />
    <TextInput value={content} onChangeText={setContent} placeholder="Information or expectation" placeholderTextColor={colors.textSecondary} multiline style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />
    <TouchableOpacity onPress={() => void save()} style={[styles.button, { backgroundColor: colors.accent }]}><Text style={styles.buttonText}>Publish information</Text></TouchableOpacity>
  </View>} ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>No programme information has been published.</Text>} renderItem={({ item }) => <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text><Text style={[styles.itemText, { color: colors.textSecondary }]}>{item.content}</Text><TouchableOpacity onPress={() => void removeProgramme(item.id)}><Text style={[styles.remove, { color: colors.danger }]}>Remove</Text></TouchableOpacity></View>} />;
}

const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 32 }, heading: { fontSize: 23, fontWeight: '800', marginBottom: 6 }, description: { fontSize: 14, lineHeight: 20, marginBottom: 14 }, input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 46, marginBottom: 10, fontSize: 15 }, textArea: { minHeight: 90, textAlignVertical: 'top' }, button: { minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, buttonText: { color: '#071B2C', fontWeight: '800' }, item: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 }, itemTitle: { fontSize: 16, fontWeight: '800' }, itemText: { fontSize: 14, lineHeight: 20, marginTop: 6 }, remove: { fontSize: 13, fontWeight: '700', marginTop: 10 }, empty: { textAlign: 'center', marginTop: 20 },
});
