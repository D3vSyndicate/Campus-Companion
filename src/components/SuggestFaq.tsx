import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/superbase';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';
import { useTranslation } from 'react-i18next';

type Props = {
  // Start with what the buddy just searched for, so a missing answer is one tap away.
  initialQuestion?: string;
  onDone: () => void;
};

// A buddy tells the coordinators about a question students keep asking. No student details involved.
export function SuggestFaq({ initialQuestion = '', onDone }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [question, setQuestion] = useState(initialQuestion);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      showToast(t('suggest.writeFirst'), 'info');
      return;
    }

    setSending(true);
    const { error } = await supabase
      .from('faq_suggestions')
      .insert({ question: trimmed, note: note.trim() || null });
    setSending(false);

    if (error) {
      console.error('Failed to send FAQ suggestion.', error);
      const notSetUp = error.code === '42P01' || error.code === 'PGRST205';
      showToast(
        notSetUp
          ? t('suggest.notSetUp')
          : t('suggest.notSent'),
        'error',
      );
      return;
    }

    showToast(t('suggest.thanks'));
    onDone();
  };

  const inputStyle = { backgroundColor: colors.card, borderColor: colors.border, color: colors.text };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('suggest.title')}</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t('suggest.intro')}
      </Text>

      <TextInput
        style={[styles.input, styles.multiline, inputStyle]}
        value={question}
        onChangeText={setQuestion}
        placeholder={t('suggest.whatAsk')}
        placeholderTextColor={colors.textSecondary}
        multiline
      />
      <TextInput
        style={[styles.input, styles.multiline, inputStyle]}
        value={note}
        onChangeText={setNote}
        placeholder={t('suggest.helpAnswer')}
        placeholderTextColor={colors.textSecondary}
        multiline
      />

      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => void send()}
          disabled={sending}
          style={[styles.primary, { backgroundColor: colors.accent }, sending && styles.disabled]}
        >
          <Text style={styles.primaryText}>{sending ? t('common.sending') : t('suggest.send')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={onDone} disabled={sending} style={styles.secondary}>
          <Text style={[styles.secondaryText, { color: colors.text }]}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800' },
  hint: { fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primary: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  primaryText: { color: '#071B2C', fontSize: 14, fontWeight: '800' },
  secondary: { paddingHorizontal: 12, paddingVertical: 11 },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
