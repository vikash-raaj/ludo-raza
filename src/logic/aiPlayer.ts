import { GameState, TokenPos } from '../types';
import { Player } from '../constants/players';
import { getValidMoves, WIN_POS, getCoords } from './gameLogic';
import { SAFE_INDICES, PLAYER_OFFSET } from '../constants/board';

function isPosSafe(player: Player, pos: TokenPos): boolean {
  if (pos < 0 || pos >= 51) return true;
  const g = (PLAYER_OFFSET[player] + pos) % 52;
  return SAFE_INDICES.has(g);
}

function wouldCapture(state: GameState, player: Player, tokenIdx: number, newPos: TokenPos): boolean {
  if (isPosSafe(player, newPos) || newPos < 0 || newPos > 50) return false;
  const landCoords = getCoords(player, newPos, tokenIdx);
  for (const opp of state.players) {
    if (opp === player) continue;
    for (let i = 0; i < 4; i++) {
      const oppPos = state.tokens[opp][i];
      if (oppPos < 0 || oppPos >= 51) continue;
      const oppCoords = getCoords(opp, oppPos, i);
      if (oppCoords.r === landCoords.r && oppCoords.c === landCoords.c) return true;
    }
  }
  return false;
}

// Returns the token index the AI should move, or -1 if no valid moves.
// Strategy (highest priority first):
//  1. Win the game (reach position 56)
//  2. Capture an opponent token
//  3. Enter home column (pos 51+)
//  4. Land on a safe square
//  5. Exit home base (when dice = 6)
//  6. Advance the most-progressed token
export function getAIMove(state: GameState): number {
  const player = state.players[state.currentPlayerIdx];
  const dice = state.diceValue!;
  const valid = getValidMoves(state, player, dice);

  if (valid.length === 0) return -1;
  if (valid.length === 1) return valid[0];

  let best = valid[0];
  let bestScore = -Infinity;

  for (const tokenIdx of valid) {
    const pos = state.tokens[player][tokenIdx];
    const newPos: TokenPos = pos === -1 ? 0 : pos + dice;
    // Base score = progress on board
    let score = newPos;

    if (newPos === WIN_POS) {
      score += 200;
    } else if (wouldCapture(state, player, tokenIdx, newPos)) {
      score += 100;
    } else if (newPos >= 51) {
      score += 30;
    } else if (isPosSafe(player, newPos)) {
      score += 20;
    } else if (pos === -1) {
      // Exiting base is worth a little bonus so AI doesn't stall
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      best = tokenIdx;
    }
  }

  return best;
}
