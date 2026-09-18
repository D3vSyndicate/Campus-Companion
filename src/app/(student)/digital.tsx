import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useTheme } from '../../theme/ThemeContext';

export default function DigitalReadinessScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const guides = [
    {
      icon: 'calendar-clear-outline' as const,
      title: 'Plan your study week',
      desc: 'Break your workload into small, realistic study blocks and leave space for rest.',
      steps: ['Check your schedule first', 'Choose one priority topic per block', 'Review what you completed before bed.'],
    },
    {
      icon: 'timer-outline' as const,
      title: 'Focus timer',
      desc: 'Try a simple focus cycle to stay consistent without burning out.',
      steps: ['Study for 25 minutes', 'Take a 5-minute break', 'Repeat four times, then take a longer break.'],
    },
    {
      icon: 'school-outline' as const,
      title: 'Accessing Funda (LMS)',
      desc: 'Find lecture notes, assignments, announcements, and course resources in one place.',
      steps: ['Go to funda.mandela.ac.za', 'Log in using your Student Number', 'Check announcements before starting assignments.'],
      link: 'https://funda.mandela.ac.za'
    },
    {
      icon: 'cloud-upload-outline' as const,
      title: 'Store your work safely',
      desc: 'Keep assignments and notes backed up so you can access them from campus or home.',
      steps: ['Save important files to OneDrive', 'Use clear module and date names', 'Keep a second copy before submitting.'],
      link: 'https://www.office.com/onedrive',
      linkLabel: 'Open OneDrive'
    },
    {
      icon: 'people-outline' as const,
      title: 'Get academic support',
      desc: 'Asking early is part of studying well. Use your mentors, lecturers, and support contacts.',
      steps: ['Write down the exact part you do not understand', 'Ask one focused question', 'Use the Support tab when you need a contact.'],
    }
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <PageHeader
        eyebrow={t('common.getConnected')}
        title={t('common.digitalTitle')}
        subtitle={t('common.digitalSubtitle')}
      />
      <ShameResilientBanner 
        message={t('common.digitalBanner')}
        type="encouragement"
      />

      {guides.map((item, index) => {
        const isExpanded = expandedIndex === index;

        return (
        <View key={item.title} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            onPress={() => setExpandedIndex(isExpanded ? null : index)}
            style={styles.cardHeader}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
              <Ionicons name={item.icon} size={21} color={colors.accent} />
            </View>
            <View style={styles.headingCopy}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.steps.length} steps</Text>
            </View>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={19} color={colors.textSecondary} />
          </Pressable>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.desc}</Text>

              <View style={[styles.stepsContainer, { backgroundColor: colors.card }]}>
                {item.steps.map((step, idx) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.stepNumberText, { color: colors.text }]}>{idx + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                  </View>
                ))}
              </View>

              {item.link && (
                <Pressable
                  accessibilityRole="link"
                  style={[styles.button, { backgroundColor: colors.accent }]}
                  onPress={() => void Linking.openURL(item.link!)}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>{item.linkLabel ?? t('common.openFunda')}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.text} />
                </Pressable>
              )}
            </View>
          )}
        </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headingCopy: { flex: 1, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 11, marginTop: 4 },
  expandedContent: { marginTop: 14 },
  desc: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  stepsContainer: { padding: 12, borderRadius: 13 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  stepNumberText: { fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 12, lineHeight: 17 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12, borderRadius: 10, marginTop: 12 },
  buttonText: { fontWeight: '800', fontSize: 13 },
});