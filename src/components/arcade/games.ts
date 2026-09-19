import type { ComponentType } from 'react';
import { RockPaperScissors } from './RockPaperScissors';
import type { GameDefinition, GameProps } from './types';

// The arcade's line-up. A new game is one entry here plus a component that takes GameProps — the
// hub tile, the round plumbing and the reward unlock all follow from this list.

export interface ArcadeGame extends GameDefinition {
  component: ComponentType<GameProps>;
}

export const GAMES: ArcadeGame[] = [
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    tagline: 'Best of one against the house',
    emoji: '✊',
    howTo: 'Pick a throw and beat the Madibaz hand.',
    component: RockPaperScissors,
  },
];

export const gameById = (id: string): ArcadeGame | undefined =>
  GAMES.find((game) => game.id === id);
