import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useArcade } from '../../lib/arcade';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { GAMES } from './games';

// The arcade's front door: the game, and how full the vault is.
//
// There is one game. The screen says so by showing it as a single card rather than as the first
// row of a list that implies more are hiding below it.

export function ArcadeHub() {
  const { colors } = useTheme();
  const router = useRouter();
  const { ledger, unlockedRewards, totalRewards, loading } = useArcade();

  const collected = unlockedRewards.length;
  const progress = totalRewards > 0 ? (collected / totalRewards) * 100 : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow="Madibaz Arcade"
          title="Play. Unlock. Collect."
          subtitle="Win a round and unlock something worth knowing about Mandela University."
          showSearch={false}
          showBack
          backFallback="/(student)"
        />

        {GAMES.map((game) => {
          const stats = ledger.stats[game.id];
          return (
            <Pressable
              key={game.id}
              accessibilityRole="button"
              accessibilityLabel={`Play ${game.title}`}
              onPress={() => router.push(`/(student)/arcade-game?game=${game.id}`)}
              style={({ pressed }) => [
                styles.tile,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.tileIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={styles.tileEmoji}>{game.emoji}</Text>
              </View>
              <Text style={[styles.tileTitle, { color: colors.text }]}>{game.title}</Text>
              <Text style={[styles.tileTagline, { color: colors.textSecondary }]}>
                {game.tagline}
              </Text>
              {stats && stats.played > 0 ? (
                <Text style={[styles.tileStats, { color: colors.textSecondary }]}>
                  {stats.won} won of {stats.played}
                </Text>
              ) : null}
              <View style={[styles.playButton, { backgroundColor: colors.accent }]}>
                <Text style={styles.playLabel}>Play</Text>
                <Ionicons name="arrow-forward" size={15} color="#071B2C" />
              </View>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Fact Vault, ${collected} of ${totalRewards} unlocked`}
          onPress={() => router.push('/(student)/fact-vault')}
          style={({ pressed }) => [
            styles.vault,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={styles.vaultTop}>
            <Text style={styles.vaultEmoji}>🔓</Text>
            <View style={styles.vaultCopy}>
              <Text style={[styles.vaultTitle, { color: colors.text }]}>Fact Vault</Text>
              <Text style={[styles.vaultMeta, { color: colors.textSecondary }]}>
                {loading ? 'Opening…' : `${collected} of ${totalRewards} unlocked`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>

          <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
            <View
              style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.accent }]}
            />
          </View>
        </Pressable>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  vault: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  vaultTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vaultEmoji: { fontSize: 24 },
  vaultCopy: { flex: 1 },
  vaultTitle: { fontSize: 17, fontWeight: '800' },
  vaultMeta: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  // One game, so it gets a card of its own rather than a list row.
  tile: { alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 24, marginTop: 4 },
  tileIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 30 },
  tileTitle: { fontSize: 18, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  tileTagline: { fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  tileStats: { fontSize: 11, fontWeight: '700', marginTop: 10 },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 24,
    minHeight: 46,
    marginTop: 18,
  },
  playLabel: { color: '#071B2C', fontSize: 14, fontWeight: '800' },
});
