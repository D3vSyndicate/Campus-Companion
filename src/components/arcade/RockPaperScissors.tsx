import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';
import type { GameProps } from './types';

const THROWS = ['rock', 'paper', 'scissors'] as const;
type Throw = (typeof THROWS)[number];

const EMOJI: Record<Throw, string> = { rock: '✊', paper: '✋', scissors: '✌️' };
const BEATS: Record<Throw, Throw> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

type Phase = 'choosing' | 'counting' | 'result';
type Result = 'win' | 'lose' | 'draw';

// How long the ✊✊✊ count-down runs before both hands are shown.
const COUNT_STEPS = 3;
const COUNT_INTERVAL_MS = 300;

export function RockPaperScissors({ onRoundEnd, paused }: GameProps) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState<Phase>('choosing');
  const [playerThrow, setPlayerThrow] = useState<Throw | null>(null);
  const [houseThrow, setHouseThrow] = useState<Throw | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [count, setCount] = useState(0);
  const shake = useRef(new Animated.Value(0)).current;

  // Timers are cleared on unmount so a student who leaves mid-count does not get a result — and a
  // reward — fired at a screen that is gone.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const play = (choice: Throw) => {
    if (phase !== 'choosing' || paused) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPlayerThrow(choice);
    setPhase('counting');
    setCount(0);

    for (let step = 1; step <= COUNT_STEPS; step += 1) {
      timers.current.push(
        setTimeout(() => {
          setCount(step);
          Animated.sequence([
            Animated.timing(shake, { toValue: -1, duration: 90, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 90, easing: Easing.linear, useNativeDriver: true }),
          ]).start();
        }, step * COUNT_INTERVAL_MS),
      );
    }

    timers.current.push(
      setTimeout(
        () => {
          const house = THROWS[Math.floor(Math.random() * THROWS.length)];
          const outcome: Result =
            house === choice ? 'draw' : BEATS[choice] === house ? 'win' : 'lose';

          setHouseThrow(house);
          setResult(outcome);
          setPhase('result');

          // A draw decides nothing, so it is not reported: it would otherwise land in the student's
          // record as a loss. They just throw again.
          if (outcome !== 'draw') onRoundEnd({ won: outcome === 'win' });
        },
        (COUNT_STEPS + 1) * COUNT_INTERVAL_MS,
      ),
    );
  };

  const reset = () => {
    clearTimers();
    setPhase('choosing');
    setPlayerThrow(null);
    setHouseThrow(null);
    setResult(null);
    setCount(0);
  };

  const rotate = shake.interpolate({ inputRange: [-1, 0], outputRange: ['-18deg', '0deg'] });
  const shownPlayer = phase === 'result' && playerThrow ? EMOJI[playerThrow] : '✊';
  const shownHouse = phase === 'result' && houseThrow ? EMOJI[houseThrow] : '✊';

  return (
    <View style={styles.container}>
      <View style={[styles.arena, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.handsRow}>
          <View style={styles.handColumn}>
            <Animated.Text style={[styles.hand, { transform: [{ rotate }] }]}>
              {shownPlayer}
            </Animated.Text>
            <Text style={[styles.handLabel, { color: colors.textSecondary }]}>You</Text>
          </View>
          <Text style={[styles.versus, { color: colors.textSecondary }]}>vs</Text>
          <View style={styles.handColumn}>
            {/* Both transforms belong in one array: a second `transform` in the style list would
                replace the first, and the mirroring would be lost. */}
            <Animated.Text style={[styles.hand, { transform: [{ rotate }, { scaleX: -1 }] }]}>
              {shownHouse}
            </Animated.Text>
            <Text style={[styles.handLabel, { color: colors.textSecondary }]}>Madibaz</Text>
          </View>
        </View>

        <Text style={[styles.status, { color: colors.text }]}>
          {phase === 'choosing'
            ? 'Pick your throw'
            : phase === 'counting'
              ? '.'.repeat(Math.max(count, 1))
              : result === 'draw'
                ? 'Draw — go again'
                : result === 'win'
                  ? 'You take it'
                  : 'Madibaz takes it'}
        </Text>
      </View>

      {/* Every finished round needs a way back to the choices, not just a draw: a student who
          dismisses the reward reveal with "Done" would otherwise be left with three dead buttons. */}
      {phase === 'result' ? (
        <Pressable
          accessibilityRole="button"
          onPress={reset}
          style={({ pressed }) => [
            styles.again,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.againLabel}>Throw again</Text>
        </Pressable>
      ) : (
        <View style={styles.choices}>
          {THROWS.map((option) => {
            const disabled = phase !== 'choosing' || paused;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={option}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => play(option)}
                style={({ pressed }) => [
                  styles.choice,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  playerThrow === option && { borderColor: colors.accent, borderWidth: 2 },
                  disabled && styles.choiceDisabled,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.choiceEmoji}>{EMOJI[option]}</Text>
                <Text style={[styles.choiceLabel, { color: colors.textSecondary }]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  arena: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 30,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  handsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  handColumn: { alignItems: 'center', gap: 8, minWidth: 92 },
  hand: { fontSize: 54 },
  handLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  versus: { fontSize: 13, fontWeight: '800' },
  status: { fontSize: 17, fontWeight: '800', marginTop: 22, minHeight: 24 },
  choices: { flexDirection: 'row', gap: 10 },
  choice: {
    flex: 1,
    minHeight: 96,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  choiceDisabled: { opacity: 0.45 },
  choiceEmoji: { fontSize: 30 },
  choiceLabel: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  again: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  againLabel: { color: '#071B2C', fontSize: 15, fontWeight: '800' },
});
