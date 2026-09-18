import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useTheme } from '../../theme/ThemeContext';

export default function DigitalReadinessScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const guides = [
    {
      title: 'Plan your study week',
      desc: 'Break your workload into small, realistic study blocks and leave space for rest.',
      steps: ['Check your schedule first', 'Choose one priority topic per block', 'Review what you completed before bed.'],
    },
    {
      title: 'Focus timer',
      desc: 'Try a simple focus cycle to stay consistent without burning out.',
      steps: ['Study for 25 minutes', 'Take a 5-minute break', 'Repeat four times, then take a longer break.'],
    },
    {
      title: 'Accessing Funda (LMS)',
      desc: 'Find lecture notes, assignments, announcements, and course resources in one place.',
      steps: ['Go to funda.mandela.ac.za', 'Log in using your Student Number', 'Check announcements before starting assignments.'],
      link: 'https://funda.mandela.ac.za'
    },
    {
      title: 'Store your work safely',
      desc: 'Keep assignments and notes backed up so you can access them from campus or home.',
      steps: ['Save important files to OneDrive', 'Use clear module and date names', 'Keep a second copy before submitting.'],
      link: 'https://www.office.com/onedrive',
      linkLabel: 'Open OneDrive'
    },
    {
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

      {guides.map((item, index) => (
        <View key={index} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.desc}</Text>
          
          <View style={[styles.stepsContainer, { backgroundColor: colors.card }]}>
            {item.steps.map((step, idx) => (
              <Text key={idx} style={[styles.stepText, { color: colors.textSecondary }]}>• {step}</Text>
            ))}
          </View>

          {item.link && (
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => Linking.openURL(item.link!)}>
              <Text style={[styles.buttonText, { color: colors.text }]}>{item.linkLabel ?? t('common.openFunda')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  desc: { fontSize: 13, marginBottom: 8 },
  stepsContainer: { padding: 10, borderRadius: 8, marginVertical: 6 },
  stepText: { fontSize: 12, marginBottom: 4 },
  button: { padding: 10, borderRadius: 6, marginTop: 8, alignItems: 'center' },
  buttonText: { fontWeight: '600', fontSize: 13 },
});