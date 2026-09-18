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

type SupportPathway = {
  id: string;
  studentNeed: string;
  recommendedContact: string;
  recommendedAction: string;
  relatedFaq: string;
};

export default function SupportScreen() {
  const { colors } = useTheme();

  const [supportPathways, setSupportPathways] = useState<SupportPathway[]>(
    [],
  );

  const [studentNeed, setStudentNeed] = useState('');
  const [recommendedContact, setRecommendedContact] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [relatedFaq, setRelatedFaq] = useState('');

  const [loading, setLoading] = useState(true);

  const loadSupportPathways = useCallback(async () => {
    const { data, error } = await supabase
      .from('Support_pathway')
      .select(
        'support_pathway_Id, student_need, recommended_contact, recommended_action, related_faq',
      )
      .order('student_need', { ascending: true });

    if (error) {
      console.error('Failed to load support pathways:', error);

      Alert.alert(
        'Error',
        `Could not load support information.\n\n${error.message}`,
      );

      return;
    }

    const mapped: SupportPathway[] = (data ?? []).map((row) => ({
      id: String(row.support_pathway_Id),
      studentNeed: String(row.student_need ?? ''),
      recommendedContact: String(row.recommended_contact ?? ''),
      recommendedAction: String(row.recommended_action ?? ''),
      relatedFaq: String(row.related_faq ?? ''),
    }));

    setSupportPathways(mapped);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadSupportPathways();
      setLoading(false);
    };

    load();
  }, [loadSupportPathways]);

  const addSupportPathway = async () => {
    if (
      !studentNeed.trim() ||
      !recommendedContact.trim() ||
      !recommendedAction.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Please enter the student need, recommended contact, and recommended action.',
      );

      return;
    }

    const { error } = await supabase
      .from('Support_pathway')
      .insert({
        student_need: studentNeed.trim(),
        recommended_contact: recommendedContact.trim(),
        recommended_action: recommendedAction.trim(),
        related_faq: relatedFaq.trim() || null,
      });

    if (error) {
      console.error('Failed to add support pathway:', error);

      Alert.alert(
        'Error',
        `Could not add support information.\n\n${error.message}`,
      );

      return;
    }

    setStudentNeed('');
    setRecommendedContact('');
    setRecommendedAction('');
    setRelatedFaq('');

    await loadSupportPathways();

    Alert.alert(
      'Success',
      'Support information added successfully.',
    );
  };

  const deleteSupportPathway = (pathway: SupportPathway) => {
    Alert.alert(
      'Delete support pathway',
      `Delete "${pathway.studentNeed}"?`,
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
              .from('Support_pathway')
              .delete()
              .eq('support_pathway_Id', pathway.id);

            if (error) {
              console.error(
                'Failed to delete support pathway:',
                error,
              );

              Alert.alert(
                'Error',
                `Could not delete support information.\n\n${error.message}`,
              );

              return;
            }

            await loadSupportPathways();
          },
        },
      ],
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <FlatList
        data={supportPathways}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={loadSupportPathways}
        ListHeaderComponent={
          <View>
            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              Support Information
            </Text>

            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
              ]}
            >
              Update student support services and recommended help pathways.
            </Text>

            <View style={styles.form}>
              <TextInput
                value={studentNeed}
                onChangeText={setStudentNeed}
                placeholder="Student need"
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

              <TextInput
                value={recommendedContact}
                onChangeText={setRecommendedContact}
                placeholder="Recommended contact"
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

              <TextInput
                value={recommendedAction}
                onChangeText={setRecommendedAction}
                placeholder="Recommended action"
                placeholderTextColor={colors.textSecondary}
                multiline
                style={[
                  styles.messageInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TextInput
                value={relatedFaq}
                onChangeText={setRelatedFaq}
                placeholder="Related FAQ (optional)"
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

              <TouchableOpacity
                onPress={addSupportPathway}
                style={[
                  styles.addButton,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Text style={styles.addText}>
                  Add Support Pathway
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text },
              ]}
            >
              Support Pathways
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              { color: colors.textSecondary },
            ]}
          >
            No support pathways yet.
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
                  styles.itemTitle,
                  { color: colors.text },
                ]}
              >
                {item.studentNeed}
              </Text>

              <Text
                style={[
                  styles.label,
                  { color: colors.textSecondary },
                ]}
              >
                Contact
              </Text>

              <Text
                style={[
                  styles.itemText,
                  { color: colors.text },
                ]}
              >
                {item.recommendedContact}
              </Text>

              <Text
                style={[
                  styles.label,
                  { color: colors.textSecondary },
                ]}
              >
                Recommended Action
              </Text>

              <Text
                style={[
                  styles.itemText,
                  { color: colors.text },
                ]}
              >
                {item.recommendedAction}
              </Text>

              {item.relatedFaq ? (
                <>
                  <Text
                    style={[
                      styles.label,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Related FAQ
                  </Text>

                  <Text
                    style={[
                      styles.itemText,
                      { color: colors.text },
                    ]}
                  >
                    {item.relatedFaq}
                  </Text>
                </>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => deleteSupportPathway(item)}
            >
              <Text
                style={[
                  styles.removeText,
                  { color: colors.danger },
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

  form: {
    marginBottom: 24,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 10,
  },

  messageInput: {
    minHeight: 100,
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

  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 2,
  },

  itemText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },

  removeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});