import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';

export default function DigitalReadinessScreen() {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <View key={index} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.desc}</Text>
          
          <View style={styles.stepsContainer}>
            {item.steps.map((step, idx) => (
              <Text key={idx} style={styles.stepText}>• {step}</Text>
            ))}
          </View>

          {item.link && (
            <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(item.link!)}>
              <Text style={styles.buttonText}>Open Funda Portal</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  content: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  desc: { fontSize: 13, color: '#475569', marginBottom: 8 },
  stepsContainer: { backgroundColor: '#EEF3F9', padding: 10, borderRadius: 8, marginVertical: 6 },
  stepText: { fontSize: 12, color: '#334155', marginBottom: 4 },
  button: { backgroundColor: '#0B1F3A', padding: 10, borderRadius: 6, marginTop: 8, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
});