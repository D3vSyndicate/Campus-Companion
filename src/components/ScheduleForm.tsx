import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
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
import { ScheduleItem, useSchedule } from '../context/ScheduleContext';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Props = {
  existing?: ScheduleItem; // omit for "new item" mode
};

export default function ScheduleForm({ existing }: Props) {
  const { addItem, updateItem, deleteItem } = useSchedule();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? '');
  const [time, setTime] = useState(existing?.time ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, colors]);

  const handleSave = () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Missing info', 'Title and date are required.');
      return;
    }
    const payload = { title, date, time, location, description };
    if (existing) {
      updateItem(existing.id, payload);
    } else {
      addItem(payload);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Delete item', `Delete "${title}"? This can't be undone.`, [
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
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Field label="Title" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={title}
            onChangeText={setTitle}
            placeholder="Opening Ceremony"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Date (YYYY-MM-DD)" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={date}
            onChangeText={setDate}
            placeholder="2026-09-20"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Time (HH:MM)" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={time}
            onChangeText={setTime}
            placeholder="09:00"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Location" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={location}
            onChangeText={setLocation}
            placeholder="Main Hall"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Description" colors={colors}>
          <TextInput
            style={[styles.input, styles.multiline, inputStyle(colors)]}
            value={description}
            onChangeText={setDescription}
            placeholder="Details attendees should know..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </Field>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{existing ? 'Save Changes' : 'Add Item'}</Text>
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
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  saveButton: { marginTop: 12, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#071B2C', fontWeight: '700', fontSize: 15 },
});
