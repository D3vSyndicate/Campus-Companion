import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ALL_REWARDS,
  MADIBAZ,
  Reward,
  RewardKind,
  rewardById,
} from '../data/arcade-rewards';

// The Madibaz Arcade's memory: which rewards a student has unlocked, and how they are doing at the
// games. Everything lives on this phone for now.
//
// Reads and writes go through the ledger below rather than touching AsyncStorage directly, so
// moving unlocks to Supabase later means replacing readLedger/writeLedger and nothing else.

const LEDGER_KEY = 'arcade:ledger';

export type GameId = 'rps';

export interface GameStats {
  played: number;
  won: number;
  // A personal best in milliseconds, for games scored on speed. Rock Paper Scissors is not one, so
  // nothing sets this today — it is kept because the ledger already holds it for anyone who played
  // an earlier build, and because the next speed-scored game will want it.
  bestMs?: number;
}

export interface ArcadeLedger {
  // Reward ids, oldest first, so the vault can show them in the order they were earned.
  unlocked: string[];
  stats: Partial<Record<GameId, GameStats>>;
}

const EMPTY_LEDGER: ArcadeLedger = { unlocked: [], stats: {} };

const keyFor = (userId: string) => `${LEDGER_KEY}:${userId}`;

// A ledger that cannot be read is treated as an empty one. Losing arcade progress is a
// disappointment, never an error worth blocking a student over.
async function readLedger(userId: string): Promise<ArcadeLedger> {
  try {
    const saved = await AsyncStorage.getItem(keyFor(userId));
    if (!saved) return EMPTY_LEDGER;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return EMPTY_LEDGER;
    const { unlocked, stats } = parsed as Partial<ArcadeLedger>;
    return {
      // Rewards that have since been removed from the content file are dropped on read, so the
      // vault never tries to render an id it cannot resolve.
      unlocked: Array.isArray(unlocked) ? unlocked.map(String).filter((id) => rewardById(id)) : [],
      stats: stats && typeof stats === 'object' ? stats : {},
    };
  } catch {
    return EMPTY_LEDGER;
  }
}

async function writeLedger(userId: string, ledger: ArcadeLedger): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(ledger));
  } catch {
    // The student keeps the reward on screen either way; only the record of it is lost.
  }
}

// -----------------------------------------------------------------------------
// Picking a reward
// -----------------------------------------------------------------------------

// Facts are the everyday unlock, tips come up often enough to land before they are needed, and a
// graduate story is the rare one — that rarity is what makes the vault worth filling.
const KIND_WEIGHTS: Record<RewardKind, number> = {
  fact: 55,
  tip: 30,
  madibaz: 15,
};

export interface Unlock {
  reward: Reward;
  // False once a student has seen everything and is being shown a repeat.
  isNew: boolean;
}

// Picks the next reward for a win: never repeats one the student already holds until the whole
// pool is exhausted, and never offers a kind that has no content (Meet a Madibaz ships empty).
export function pickReward(unlocked: string[], random: () => number = Math.random): Unlock | null {
  if (ALL_REWARDS.length === 0) return null;

  const fresh = ALL_REWARDS.filter((reward) => !unlocked.includes(reward.id));

  // Everything is unlocked: show a repeat rather than nothing, and let the UI say so.
  if (fresh.length === 0) {
    const reward = ALL_REWARDS[Math.floor(random() * ALL_REWARDS.length)];
    return { reward, isNew: false };
  }

  const kinds = (Object.keys(KIND_WEIGHTS) as RewardKind[]).filter((kind) =>
    fresh.some((reward) => reward.kind === kind),
  );
  const totalWeight = kinds.reduce((sum, kind) => sum + KIND_WEIGHTS[kind], 0);

  // Weights are re-normalised over the kinds that still have unseen content, so an empty or
  // finished category hands its share to the others instead of producing a dud roll.
  let roll = random() * totalWeight;
  let chosenKind = kinds[kinds.length - 1];
  for (const kind of kinds) {
    roll -= KIND_WEIGHTS[kind];
    if (roll <= 0) {
      chosenKind = kind;
      break;
    }
  }

  const candidates = fresh.filter((reward) => reward.kind === chosenKind);
  return { reward: candidates[Math.floor(random() * candidates.length)], isNew: true };
}

// -----------------------------------------------------------------------------
// Recording play
// -----------------------------------------------------------------------------

export interface WinResult {
  unlock: Unlock | null;
  ledger: ArcadeLedger;
}

const statsFor = (ledger: ArcadeLedger, game: GameId): GameStats =>
  ledger.stats[game] ?? { played: 0, won: 0 };

// Called at the end of every round, win or lose. A win also draws a reward and banks it.
export async function recordRound(
  userId: string,
  game: GameId,
  outcome: { won: boolean; elapsedMs?: number },
): Promise<WinResult> {
  const ledger = await readLedger(userId);
  const previous = statsFor(ledger, game);

  const next: GameStats = {
    played: previous.played + 1,
    won: previous.won + (outcome.won ? 1 : 0),
    bestMs:
      typeof outcome.elapsedMs === 'number' &&
      (previous.bestMs === undefined || outcome.elapsedMs < previous.bestMs)
        ? outcome.elapsedMs
        : previous.bestMs,
  };

  const unlock = outcome.won ? pickReward(ledger.unlocked) : null;
  const updated: ArcadeLedger = {
    unlocked: unlock?.isNew ? [...ledger.unlocked, unlock.reward.id] : ledger.unlocked,
    stats: { ...ledger.stats, [game]: next },
  };

  await writeLedger(userId, updated);
  return { unlock, ledger: updated };
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

// Reloads whenever the screen comes back into view, so a reward unlocked in a game shows up in the
// vault without either screen having to tell the other.
export function useArcade() {
  const { user } = useAuth();
  const userId = user?.id;
  const [ledger, setLedger] = useState<ArcadeLedger>(EMPTY_LEDGER);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const saved = userId ? await readLedger(userId) : EMPTY_LEDGER;
        if (!active) return;
        setLedger(saved);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [userId]),
  );

  const playRound = useCallback(
    async (game: GameId, outcome: { won: boolean; elapsedMs?: number }) => {
      // Without a signed-in student there is nowhere to bank progress, so the round is played for
      // fun and the reward is still shown.
      if (!userId) {
        return { unlock: outcome.won ? pickReward(ledger.unlocked) : null, ledger };
      }
      const result = await recordRound(userId, game, outcome);
      setLedger(result.ledger);
      return result;
    },
    [userId, ledger],
  );

  const unlockedRewards = ledger.unlocked
    .map((id) => rewardById(id))
    .filter((reward): reward is Reward => Boolean(reward));

  return {
    loading,
    ledger,
    unlockedRewards,
    playRound,
    totalRewards: ALL_REWARDS.length,
    // The vault needs to distinguish "you have not found these yet" from "we have not written
    // these yet", and only this file knows the pool is empty.
    madibazComingSoon: MADIBAZ.length === 0,
  };
}
