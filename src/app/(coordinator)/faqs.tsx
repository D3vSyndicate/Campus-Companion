import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

export default function FAQScreen() {
  const { colors } = useTheme();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // Load FAQs from Supabase
  // ------------------------------------------------------------

  const loadFAQs = useCallback(async () => {
    const { data, error } = await supabase
      .from('FAQ')
      .select('faq_id, question, answer, category');

    if (error) {
      console.error('Failed to load FAQs:', error);

      Alert.alert(
        'Error',
        `Could not load FAQs.\n\n${error.message}`,
      );

      return;
    }

    const mapped: FAQ[] = (data ?? []).map((row) => ({
      id: String(row.faq_id),
      question: String(row.question ?? ''),
      answer: String(row.answer ?? ''),
      category: String(row.category ?? ''),
    }));

    setFaqs(mapped);
  }, []);

  // ------------------------------------------------------------
  // Initial load
  // ------------------------------------------------------------

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      await loadFAQs();

      setLoading(false);
    };

    load();
  }, [loadFAQs]);

  // ------------------------------------------------------------
  // Add FAQ
  // ------------------------------------------------------------

  const addFAQ = async () => {
    if (!question.trim() || !answer.trim() || !category.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter a question, answer, and category.',
      );

      return;
    }

    const { error } = await supabase
      .from('FAQ')
      .insert({
        question: question.trim(),
        answer: answer.trim(),
        category: category.trim(),
      });

    if (error) {
      console.error('Failed to add FAQ:', error);

      Alert.alert(
        'Error',
        `Could not add FAQ.\n\n${error.message}`,
      );

      return;
    }

    setQuestion('');
    setAnswer('');
    setCategory('');

    await loadFAQs();

    Alert.alert(
      'Success',
      'FAQ added successfully.',
    );
  };

  // ------------------------------------------------------------
  // Delete FAQ
  // ------------------------------------------------------------

  const deleteFAQ = (faq: FAQ) => {
    Alert.alert(
      'Delete FAQ',
      `Delete "${faq.question}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            const { error } = await supabase
              .from('FAQ')
              .delete()
              .eq('faq_id', faq.id);

            if (error) {
              console.error(
                'Failed to delete FAQ:',
                error,
              );

              Alert.alert(
                'Error',
                `Could not delete FAQ.\n\n${error.message}`,
              );

              return;
            }

            await loadFAQs();
          },
        },
      ],
    );
  };

  // ------------------------------------------------------------
  // Screen
  // ------------------------------------------------------------

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <FlatList
        data={faqs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={loadFAQs}

        ListHeaderComponent={
          <View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              FAQs
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Create and manage frequently asked questions
              for first-year students.
            </Text>

            {/* Question */}

            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Enter a question"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            />

            {/* Answer */}

            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Enter the answer"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[
                styles.answerInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            />

            {/* Category */}

            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Category e.g. Wi-fi, Registration, Funda"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
            />

            {/* Add button */}

            <TouchableOpacity
              onPress={addFAQ}
              style={[
                styles.addButton,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            >
              <Text style={styles.addText}>
                Add FAQ
              </Text>
            </TouchableOpacity>

            {/* Existing FAQs */}

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Published FAQs
            </Text>
          </View>
        }

        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No FAQs yet.
          </Text>
        }

        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.question,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {item.question}
              </Text>

              <Text
                style={[
                  styles.answer,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {item.answer}
              </Text>

              <Text
                style={[
                  styles.category,
                  {
                    color: colors.accent,
                  },
                ]}
              >
                Category: {item.category}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteFAQ(item)}
            >
              <Text
                style={[
                  styles.deleteText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 10,
  },

  answerInput: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  addButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  addText: {
    color: '#071B2C',
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  item: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  itemContent: {
    flex: 1,
  },

  question: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },

  answer: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 7,
  },

  category: {
    fontSize: 12,
    fontWeight: '600',
  },

  deleteText: {
    fontSize: 13,
    fontWeight: '600',
  },

  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});