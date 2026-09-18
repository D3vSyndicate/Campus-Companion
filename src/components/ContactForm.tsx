import { useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Contact, useContacts } from '../context/ContactsContext';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Props = {
  existing?: Contact;
};

export default function ContactForm({ existing }: Props) {
  const { addItem, updateItem, deleteItem } = useContacts();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const [name, setName] = useState(existing?.name ?? '');
  const [surname, setSurname] = useState(existing?.surname ?? '');
  const [role, setRole] = useState(existing?.role ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [supportCategory, setSupportCategory] = useState(existing?.supportCategory ?? '');

  const handleDelete = useCallback(() => {
    if (!existing) return;
    Alert.alert('Delete contact', `Delete "${name} ${surname}".trim()? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteItem(existing.id);
          router.back();
        },
      },
    ]);
  }, [existing, name, surname, deleteItem, router]);

  useLayoutEffect(() => {
    if (existing) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [existing, colors.danger, navigation, handleDelete]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Name is required.');
      return;
    }
    const payload = { name, surname, role, email, supportCategory };
    if (existing) {
      updateItem(existing.id, payload);
    } else {
      addItem(payload);
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Field label="Name" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={name}
            onChangeText={setName}
            placeholder="Sipho"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Surname" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={surname}
            onChangeText={setSurname}
            placeholder="Nkosi"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Role" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={role}
            onChangeText={setRole}
            placeholder="Event Coordinator"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="E-mail" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label="Support Category" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={supportCategory}
            onChangeText={setSupportCategory}
            placeholder="Technical Support"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>
            {existing ? 'Save Changes' : 'Add Contact'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, colors, children }: { label: string; colors: any; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

function inputStyle(colors: any) {
  return { backgroundColor: colors.card, borderColor: colors.border, color: colors.text };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  saveButton: { marginTop: 12, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { fontWeight: '700', fontSize: 15 },
});