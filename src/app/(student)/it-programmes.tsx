import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { loadProgrammes, type Programme } from '../../lib/programmes';
import { useTheme } from '../../theme/ThemeContext';

export default function ProgrammesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const result = await loadProgrammes();
    setProgrammes(result.programmes);
    setOffline(result.fromCache && result.failed);
    setFailed(result.failed && result.programmes.length === 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = (programme: Programme) =>
    router.push({ pathname: '/(student)/it-programme-detail', params: { id: programme.id } } as never);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />}
    >
      <PageHeader
        eyebrow="SCHOOL OF IT"
        title="Programmes"
        subtitle="Find out what each programme covers, where it can take you, and who to ask for academic advice."
        showBack
        backFallback="/(student)"
      />

      {offline ? <ShameResilientBanner message="You are offline, so this may be out of date. It will refresh when you are back online." type="info" /> : null}

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : programmes.length === 0 ? (
        <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={failed ? 'cloud-offline-outline' : 'school-outline'} size={28} color={colors.accent} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            {failed ? 'Programmes could not be loaded' : 'No programmes published yet'}
          </Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>
            {failed
              ? 'Please try again when your connection is available.'
              : 'The School of IT will publish programme information here. In the meantime, ask your buddy or a coordinator.'}
          </Text>
        </View>
      ) : (
        programmes.map((programme) => (
          <Pressable
            key={programme.id}
            accessibilityRole="button"
            accessibilityLabel={`${programme.name}. Open programme details`}
            onPress={() => open(programme)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
              <Ionicons name="school-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.text }]}>{programme.name}</Text>
              {programme.description ? (
                <Text style={[styles.summary, { color: colors.textSecondary }]} numberOfLines={2}>
                  {programme.description}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 32 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10, minHeight: 76 },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, lineHeight: 21, fontWeight: '800' },
  summary: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  stateCard: { alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 24 },
  stateTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  stateText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
});
