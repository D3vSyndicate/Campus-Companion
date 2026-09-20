import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { normaliseTime } from '../../lib/personalEntries';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';
import { useTranslation } from 'react-i18next';

// Lets a student put their own things on the calendar — a res event, a study group, a shift.
// Deliberately plain: a title and a day are enough, and times are optional.

interface AddEntryFormProps {
  visible: boolean;
  // The day the student had open when they tapped Add.
  date: string;
  dateLabel: string;
  onCancel: () => void;
  onSave: (entry: { title: string; date: string; start: string; end: string; venue: string }) => void;
}

export function AddEntryForm({ visible, date, dateLabel, onCancel, onSave }: AddEntryFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [venue, setVenue] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setStart('');
    setEnd('');
    setVenue('');
    setError('');
  };

  const save = () => {
    if (!title.trim()) {
      setError(t('cal.form.needName'));
      return;
    }
    // An unreadable time would sort wrongly and show as nonsense, so it is caught here rather than
    // saved. Leaving both blank is fine — it becomes an all-day note.
    const startTime = start.trim() ? normaliseTime(start) : '';
    if (start.trim() && !startTime) {
      setError(t('cal.form.startFormat'));
      return;
    }
    const endTime = end.trim() ? normaliseTime(end) : '';
    if (end.trim() && !endTime) {
      setError(t('cal.form.endFormat'));
      return;
    }
    if (startTime && endTime && endTime < startTime) {
      setError(t('cal.form.endBefore'));
      return;
    }

    onSave({ title: title.trim(), date, start: startTime, end: endTime, venue: venue.trim() });
    reset();
  };

  const field = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.text,
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: colors.text }]}>{t('cal.form.title')}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{dateLabel}</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cal.form.what')}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('cal.form.whatEg')}
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, field]}
              accessibilityLabel={t('cal.form.entryName')}
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cal.form.starts')}</Text>
                <TextInput
                  value={start}
                  onChangeText={setStart}
                  placeholder="18:30"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  style={[styles.input, field]}
                  accessibilityLabel={t('cal.form.startTime')}
                />
              </View>
              <View style={styles.half}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cal.form.ends')}</Text>
                <TextInput
                  value={end}
                  onChangeText={setEnd}
                  placeholder="20:00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numbers-and-punctuation"
                  style={[styles.input, field]}
                  accessibilityLabel={t('cal.form.endTime')}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('cal.form.where')}</Text>
            <TextInput
              value={venue}
              onChangeText={setVenue}
              placeholder={t('cal.form.whereEg')}
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, field]}
              accessibilityLabel={t('cal.form.place')}
            />

            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={save}
              style={({ pressed }) => [
                styles.primary,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.primaryLabel}>{t('cal.form.save')}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                reset();
                onCancel();
              }}
              style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
            </Pressable>

            {/* Said plainly, because a student may reasonably expect it to sync. */}
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              {t('cal.form.note')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(7,27,44,0.62)' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, maxHeight: '88%' },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  error: { fontSize: 13, fontWeight: '600', marginTop: 14 },
  primary: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  primaryLabel: { color: '#071B2C', fontSize: 15, fontWeight: '800' },
  cancel: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelLabel: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
});
