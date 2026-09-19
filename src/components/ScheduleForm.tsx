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
import { useToast } from '../context/ToastContext';
import {
    SCHEDULE_CATEGORIES,
    ScheduleCategory,
    ScheduleItem,
    useSchedule,
} from '../context/ScheduleContext';
import { useTheme } from '../theme/ThemeContext';
import { ChipSelect } from './ChipSelect';
import { ScaledText as Text } from './ScaledText';

type Props = {
  existing?: ScheduleItem; // omit for "new item" mode
};

const CATEGORY_OPTIONS = SCHEDULE_CATEGORIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

export default function ScheduleForm({ existing }: Props) {
  const { addItem, updateItem, deleteItem, venues } = useSchedule();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? '');
  const [time, setTime] = useState(existing?.time ?? '');
  const [endTime, setEndTime] = useState(existing?.endTime ?? '');
  const [venueId, setVenueId] = useState(existing?.venueId ?? '');
  const [category, setCategory] = useState<ScheduleCategory>(existing?.category ?? 'academic');
  const [responsiblePerson, setResponsiblePerson] = useState(existing?.responsiblePerson ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!title.trim() || !date.trim()) {
      Alert.alert('Missing info', 'Title and date are required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('Check the date', 'Please write the date like 2027-02-04 (year-month-day).');
      return;
    }
    const timePattern = /^\d{1,2}:\d{2}$/;
    if ((time.trim() && !timePattern.test(time.trim())) || (endTime.trim() && !timePattern.test(endTime.trim()))) {
      Alert.alert('Check the time', 'Please write times like 09:00.');
      return;
    }

    const payload = {
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      endTime: endTime.trim(),
      venueId,
      category,
      responsiblePerson: responsiblePerson.trim(),
      description: description.trim(),
    };

    setSaving(true);
    const failure = existing ? await updateItem(existing.id, payload) : await addItem(payload);
    setSaving(false);

    if (failure) {
      showToast(failure, 'error');
      return;
    }
    showToast(existing ? 'Schedule item updated' : 'Schedule item added');
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
          void (async () => {
            const failure = await deleteItem(existing.id);
            if (failure) {
              showToast(failure, 'error');
              return;
            }
            showToast('Schedule item deleted');
            router.back();
          })();
        },
      },
    ]);
  };

  const venueOptions = venues.map((venue) => ({
    value: venue.id,
    label: [venue.name, venue.room].filter(Boolean).join(' · ') || 'Venue',
  }));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Title" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={title}
            onChangeText={setTitle}
            placeholder="Welcome to the School of IT"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Date (YYYY-MM-DD)" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={date}
            onChangeText={setDate}
            placeholder="2027-02-04"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Field label="Starts (HH:MM)" colors={colors}>
              <TextInput
                style={[styles.input, inputStyle(colors)]}
                value={time}
                onChangeText={setTime}
                placeholder="09:00"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
          </View>
          <View style={styles.timeField}>
            <Field label="Ends (HH:MM)" colors={colors}>
              <TextInput
                style={[styles.input, inputStyle(colors)]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="10:00"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
          </View>
        </View>

        <Field label="Category" colors={colors}>
          <ChipSelect
            wrap
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(value) => setCategory(value as ScheduleCategory)}
          />
        </Field>

        <Field label="Venue" colors={colors}>
          {venueOptions.length ? (
            <ChipSelect wrap clearable options={venueOptions} value={venueId} onChange={setVenueId} />
          ) : (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              No venues yet. Add one under Venue Information first.
            </Text>
          )}
        </Field>

        <Field label="Speaker or responsible person" colors={colors}>
          <TextInput
            style={[styles.input, inputStyle(colors)]}
            value={responsiblePerson}
            onChangeText={setResponsiblePerson}
            placeholder="Head of School"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Description" colors={colors}>
          <TextInput
            style={[styles.input, styles.multiline, inputStyle(colors)]}
            value={description}
            onChangeText={setDescription}
            placeholder="Details students should know..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </Field>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }, saving && styles.disabled]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : existing ? 'Save Changes' : 'Add Item'}</Text>
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
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  saveButton: { marginTop: 12, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#071B2C', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 },
});
