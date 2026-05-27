import { Player } from '../constants/players';

// Token position:
//  -1 = in home base
//   0–50 = on outer ring (relative to player's entry point)
//  51–55 = in home column
//  56 = finished (won)
export type TokenPos = number;

export interface GameState {
  players: Player[];
  tokens: Record<Player, [TokenPos, TokenPos, TokenPos, TokenPos]>;
  currentPlayerIdx: number;
  diceValue: number | null;
  phase: 'rolling' | 'selecting' | 'gameover';
  winner: Player | null;
  consecutiveSixes: number;
  computerPlayers: Player[];
}

export type GameAction =
  | { type: 'ROLL_DICE' }
  | { type: 'MOVE_TOKEN'; tokenIdx: number }
  | { type: 'NEW_GAME'; players: Player[]; computerPlayers: Player[] };
