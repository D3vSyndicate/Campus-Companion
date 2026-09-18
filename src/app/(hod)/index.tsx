import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import { useTheme } from '../../theme/ThemeContext';

const SECTIONS = [
  { route: '/(hod)/programme', title: 'Programme information', description: 'Publish programme details and departmental expectations.' },
  { route: '/(hod)/assignments', title: 'Assignments', description: 'Track departmental assignments and deadlines.' },
  { route: '/(hod)/contacts', title: 'Department contacts', description: 'Keep academic and support contacts current.' },
];

export default function HodDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  return <View style={[styles.container, { backgroundColor: colors.background }]}>
    <Header title="HOD Dashboard" />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.welcome, { backgroundColor: colors.headerBackground }]}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>HEAD OF DEPARTMENT</Text>
        <Text style={[styles.title, { color: colors.headerText }]}>Support your department</Text>
        <Text style={[styles.description, { color: colors.headerText }]}>Give students one dependable place for programme guidance, expectations, assignments, and support.</Text>
      </View>
      {SECTIONS.map((section) => <TouchableOpacity key={section.route} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(section.route as any)}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{section.description}</Text>
      </TouchableOpacity>)}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 16, paddingBottom: 32 }, welcome: { borderRadius: 18, padding: 22, marginBottom: 18 }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }, title: { fontSize: 25, fontWeight: '800', marginBottom: 8 }, description: { fontSize: 14, lineHeight: 21, opacity: 0.88 }, card: { borderWidth: 1, borderRadius: 14, padding: 18, marginBottom: 12 }, cardTitle: { fontSize: 17, fontWeight: '700' }, cardDescription: { fontSize: 13, lineHeight: 19, marginTop: 5 },
});