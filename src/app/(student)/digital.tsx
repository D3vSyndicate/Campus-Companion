import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';

interface DigitalGuide {
  id: string;
  title: string;
  desc: string;
  steps: string[];
  link?: string;
}

export default function DigitalReadinessScreen() {
  const { colors } = useTheme();
  const [guides, setGuides] = useState<DigitalGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGuides = async () => {
      const { data, error } = await fetchWithOfflineFallback('digital_guides');
      if (error) {
        console.error('Failed to load digital readiness guides from Supabase.', error);
      }

      setGuides(data.map((row, index) => {
        const item = row as Record<string, unknown>;
        const steps = Array.isArray(item.steps)
          ? item.steps.map(String)
          : String(item.steps ?? '').split('\n').filter(Boolean);

        return {
          id: String(item.id ?? item.guide_id ?? index + 1),
          title: String(item.title ?? item.name ?? ''),
          desc: String(item.description ?? item.desc ?? ''),
          steps,
          link: item.link ? String(item.link) : undefined,
        };
      }));
      setLoading(false);
    };

    void loadGuides();
  }, []);

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

      {loading ? <ActivityIndicator size="large" color={colors.accent} /> : guides.map(item => (
        <View key={item.id} style={[styles.card, { backgroundColor: colors.surface }]}>
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
      {!loading && guides.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No digital readiness guides are available yet.
        </Text>
      )}
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
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 20 },
});