import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useHod } from '../../context/HodContext';
import { useTheme } from '../../theme/ThemeContext';

export default function HodContactsScreen() {
  const { colors } = useTheme();
  const { contacts, addContact, removeContact } = useHod();
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' });
  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return Alert.alert('Missing information', 'Add a name and email address.');
    await addContact({ name: form.name.trim(), role: form.role.trim(), email: form.email.trim(), phone: form.phone.trim() });
    setForm({ name: '', role: '', email: '', phone: '' });
  };
  return <FlatList data={contacts} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} style={{ backgroundColor: colors.background }} ListHeaderComponent={<View>
    <Text style={[styles.heading, { color: colors.text }]}>Department contacts</Text>
    <Text style={[styles.description, { color: colors.textSecondary }]}>Maintain the people students can contact for academic and support help.</Text>
    {(['name', 'role', 'email', 'phone'] as const).map((key) => <TextInput key={key} value={form[key]} onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))} placeholder={key === 'name' ? 'Name' : key === 'role' ? 'Role' : key === 'email' ? 'Email' : 'Phone'} placeholderTextColor={colors.textSecondary} keyboardType={key === 'email' ? 'email-address' : key === 'phone' ? 'phone-pad' : 'default'} style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} />)}
    <TouchableOpacity onPress={() => void save()} style={[styles.button, { backgroundColor: colors.accent }]}><Text style={styles.buttonText}>Add contact</Text></TouchableOpacity>
  </View>} ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>No department contacts have been added.</Text>} renderItem={({ item }) => <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text><Text style={[styles.itemText, { color: colors.textSecondary }]}>{item.role || 'Department support'}{`\n`}{item.email}{item.phone ? `\n${item.phone}` : ''}</Text><TouchableOpacity onPress={() => void removeContact(item.id)}><Text style={[styles.remove, { color: colors.danger }]}>Remove</Text></TouchableOpacity></View>} />;
}

const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 32 }, heading: { fontSize: 23, fontWeight: '800', marginBottom: 6 }, description: { fontSize: 14, lineHeight: 20, marginBottom: 14 }, input: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 46, marginBottom: 10, fontSize: 15 }, button: { minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, buttonText: { color: '#071B2C', fontWeight: '800' }, item: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 }, itemTitle: { fontSize: 16, fontWeight: '800' }, itemText: { fontSize: 14, lineHeight: 20, marginTop: 6 }, remove: { fontSize: 13, fontWeight: '700', marginTop: 10 }, empty: { textAlign: 'center', marginTop: 20 },
});
