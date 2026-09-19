import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { SupportPathways } from '../../components/SupportPathways';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

type SupportItem = {
  id: string;
  content: string;
};

export default function SupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<SupportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  // null until the "I need help with..." options have loaded.
  const [pathwayCount, setPathwayCount] = useState<number | null>(null);

  const loadSupport = useCallback(async () => {
    setError(false);
    const { data, error: queryError } = await supabase
      .from('coordinator_content')
      .select('id, content')
      .eq('module', 'support')
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error('Failed to load support information from Supabase.', queryError);
      setItems([]);
      setError(true);
    } else {
      setItems((data ?? []).map((row) => ({
        id: String(row.id),
        content: String(row.content ?? ''),
      })));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSupport();
  }, [loadSupport]);

  const refresh = async () => {
    setRefreshing(true);
    await loadSupport();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />}
    >
      <PageHeader
        eyebrow="STUDENT SUPPORT"
        title="Support pathways"
        subtitle="Find the right person or service when you need help on campus."
      />

      <SupportPathways onLoaded={setPathwayCount} />

      {items.length > 0 ? <Text style={[styles.sectionHeading, { color: colors.text }]}>More support information</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : error ? (
        <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>Support information unavailable</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>Please try again when your connection is available.</Text>
        </View>
      ) : items.length === 0 ? (
        // The help options above are the main content, so only say "nothing yet" when there are none of those either.
        pathwayCount === 0 ? (
          <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={28} color={colors.accent} />
            <Text style={[styles.stateTitle, { color: colors.text }]}>No support pathways published yet</Text>
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>Your coordinator will publish support services here.</Text>
          </View>
        ) : null
      ) : (
        items.map((item, index) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
              <Text style={[styles.index, { color: colors.accent }]}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <Text style={[styles.itemText, { color: colors.text }]}>{item.content}</Text>
          </View>
        ))
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Academic advice: see School of IT programmes"
        onPress={() => router.push('/(student)/it-programmes' as never)}
        style={({ pressed }) => [styles.advice, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
          <Ionicons name="school-outline" size={20} color={colors.accent} />
        </View>
        <View style={styles.adviceCopy}>
          <Text style={[styles.adviceTitle, { color: colors.text }]}>Need academic advice?</Text>
          <Text style={[styles.stateText, styles.adviceSub, { color: colors.textSecondary }]}>
            See your programme and who to speak to.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  index: { fontSize: 12, fontWeight: '800' },
  advice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 6 },
  adviceCopy: { flex: 1 },
  adviceTitle: { fontSize: 15, fontWeight: '800' },
  adviceSub: { textAlign: 'left', marginTop: 2 },
  itemText: { flex: 1, fontSize: 14, lineHeight: 20 },
  sectionHeading: { fontSize: 18, fontWeight: '800', marginTop: 8, marginBottom: 10 },
  stateCard: { alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 24 },
  stateTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  stateText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
});
