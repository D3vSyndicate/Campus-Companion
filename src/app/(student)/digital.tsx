import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useTheme } from '../../theme/ThemeContext';

export default function DigitalReadinessScreen() {
  const { colors } = useTheme();
  const guides = [
    {
      title: 'Accessing Funda (LMS)',
      desc: 'Funda may be new to you. This platform is where lecturers post notes, assignments, and announcements.',
      steps: ['Go to funda.mandela.ac.za', 'Log in using your Student Number', 'Use your standard university password.'],
      link: 'https://funda.mandela.ac.za'
    },
    {
      title: 'Connecting to Campus Wi-Fi (eduroam)',
      desc: 'Stay connected across all Nelson Mandela University campuses seamlessly.',
      steps: ['Select eduroam from Wi-Fi settings', 'Username: sXXXXX@mandela.ac.za', 'Password: Your password.'],
    },
    {
      title: 'Lab Computer Access',
      desc: 'School of IT labs give you access to development tools and software needed for your modules.',
      steps: ['Find an open machine in Lab 1 or 2', 'Log in with your student number and password', 'Always save files to your OneDrive.'],
    }
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <PageHeader
        eyebrow="GET CONNECTED"
        title="Digital readiness"
        subtitle="Set up the tools you will use for learning, communication, and campus life."
      />
      <ShameResilientBanner 
        message="Everyone starts as a beginner with university tech. Don't worry if it takes a few tries to get logged in!"
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
              <Text style={[styles.buttonText, { color: colors.text }]}>Open Funda Portal</Text>
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