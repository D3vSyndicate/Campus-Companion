import { useNavigation, useRouter } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FaqInput, FaqItem, useFaqs } from '../context/FaqsContext';
import { useTheme } from '../theme/ThemeContext';
import { Field, formStyles, inputStyle } from './FormField';
import { ScaledText as Text } from './ScaledText';

type Props = {
  existing?: FaqItem; // omit for "new FAQ" mode
};

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong. Try again.';

export default function FaqForm({ existing }: Props) {
  const { addItem, updateItem, deleteItem } = useFaqs();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  const [question, setQuestion] = useState(existing?.question ?? '');
  const [answer, setAnswer] = useState(existing?.answer ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [visible, setVisible] = useState(existing?.visible ?? true);
  const [saving, setSaving] = useState(false);

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Delete FAQ', `Delete "${existing.question}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(existing.id);
            router.back();
          } catch (e) {
            Alert.alert("Couldn't delete FAQ", errorMessage(e));
          }
        },
      },
    ]);
  };

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
    if (!question.trim()) {
      Alert.alert('Check the form', 'Add the question.');
      return;
    }

    const payload: FaqInput = { question, answer, category, visible };

    setSaving(true);
    try {
      if (existing) {
        await updateItem(existing.id, payload);
      } else {
        await addItem(payload);
      }
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save FAQ", errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[formStyles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={formStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Question" colors={colors}>
          <TextInput
            style={[formStyles.input, inputStyle(colors)]}
            value={question}
            onChangeText={setQuestion}
            placeholder="Where do I collect my student card?"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <Field label="Answer" colors={colors}>
          <TextInput
            style={[formStyles.input, formStyles.multiline, styles.answer, inputStyle(colors)]}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Write the answer students will see..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </Field>

        <Field label="Category" colors={colors}>
          <TextInput
            style={[formStyles.input, inputStyle(colors)]}
            value={category}
            onChangeText={setCategory}
            placeholder="Registration"
            placeholderTextColor={colors.textSecondary}
          />
        </Field>

        <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchText}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>Show to students</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Turn off to hide this FAQ without deleting it.
            </Text>
          </View>
          <Switch
            value={visible}
            onValueChange={setVisible}
            trackColor={{ true: colors.accent, false: colors.border }}
            accessibilityLabel="Show this FAQ to students"
          />
        </View>

        <TouchableOpacity
          style={[formStyles.saveButton, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={formStyles.saveButtonText}>
            {saving ? 'Saving...' : existing ? 'Save changes' : 'Add FAQ'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  answer: { minHeight: 140 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  switchText: { flex: 1 },
});
