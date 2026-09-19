import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useArcade, type Unlock } from '../../lib/arcade';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { gameById } from './games';
import { UnlockReveal } from './UnlockReveal';
import type { RoundOutcome } from './types';

// Wraps whichever game the student opened. This is the only place that knows a win turns into a
// reward, which is what keeps the games themselves replaceable.

export function GameHost({ gameId }: { gameId: string }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { ledger, playRound } = useArcade();
  const [unlock, setUnlock] = useState<Unlock | null>(null);
  // Remounting the game on "play again" resets it without every game needing its own reset path.
  const [round, setRound] = useState(0);

  const game = gameById(gameId);

  if (!game) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <PageHeader
          eyebrow="Madibaz Arcade"
          title="Game not found"
          subtitle="That game is not in the arcade. Head back and pick another."
          showSearch={false}
          showBack
          backFallback="/(student)/arcade"
        />
      </View>
    );
  }

  const Game = game.component;
  const stats = ledger.stats[game.id];

  const handleRoundEnd = async (outcome: RoundOutcome) => {
    const result = await playRound(game.id, outcome);
    // A loss keeps the student in the game rather than interrupting them with a modal.
    if (result.unlock) setUnlock(result.unlock);
  };

  const playAgain = () => {
    setUnlock(null);
    setRound((value) => value + 1);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow="Madibaz Arcade"
          title={game.title}
          subtitle={game.howTo}
          showSearch={false}
          showBack
          backFallback="/(student)/arcade"
        />

        <Game key={round} onRoundEnd={handleRoundEnd} paused={unlock !== null} />

        {stats && stats.played > 0 ? (
          <View style={[styles.stats, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Stat label="Played" value={String(stats.played)} />
            <Stat label="Won" value={String(stats.won)} />
            {stats.bestMs !== undefined ? (
              <Stat label="Best" value={`${stats.bestMs}ms`} />
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <UnlockReveal
        unlock={unlock}
        onClose={() => setUnlock(null)}
        onPlayAgain={playAgain}
        onOpenVault={() => {
          setUnlock(null);
          router.push('/(student)/fact-vault');
        }}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  stats: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});
