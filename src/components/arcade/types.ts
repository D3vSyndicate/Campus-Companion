// The contract every arcade game implements.
//
// A game knows how to be fun and nothing else: it never picks a reward, never touches storage, and
// never navigates. It reports a decided round and the host in GameHost does the rest. Adding a
// sixth game means writing this interface and registering it — the reward system comes for free.

export interface RoundOutcome {
  won: boolean;
  // Games that are scored on speed report it, for the personal best on the hub. Others omit it.
  elapsedMs?: number;
}

export interface GameProps {
  // Fire once a round is decided. Draws and aborted rounds are the game's own business: do not
  // report them, or they will count as losses in the student's record.
  onRoundEnd: (outcome: RoundOutcome) => void;
  // True while the unlock reveal is covering the screen. Games must ignore input while paused.
  paused: boolean;
}

export interface GameDefinition {
  id: 'rps';
  title: string;
  tagline: string;
  emoji: string;
  // Rendered on the hub tile, so it has to read well in two lines.
  howTo: string;
}
