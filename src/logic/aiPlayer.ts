import { GameState, TokenPos } from '../types';
import { Player } from '../constants/players';
import { getValidMoves, WIN_POS, getCoords } from './gameLogic';
import { SAFE_INDICES, PLAYER_OFFSET } from '../constants/board';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

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

// Hard AI: check if landing on newPos puts us in danger of being captured next turn
function wouldBeVulnerable(state: GameState, player: Player, newPos: TokenPos): boolean {
  if (isPosSafe(player, newPos) || newPos < 0 || newPos > 50) return false;
  const landCoords = getCoords(player, newPos, 0); // rough check

  for (const opp of state.players) {
    if (opp === player) continue;
    for (let i = 0; i < 4; i++) {
      const oppPos = state.tokens[opp][i];
      if (oppPos < 0 || oppPos >= 51) continue;
      // If opponent could roll 1–6 and land exactly on our new position
      for (let dice = 1; dice <= 6; dice++) {
        const oppNewPos = oppPos + dice;
        if (oppNewPos > 50) continue;
        const oppCoords = getCoords(opp, oppNewPos, i);
        if (oppCoords.r === landCoords.r && oppCoords.c === landCoords.c) return true;
      }
    }
  }
  return false;
}

/**
 * Returns the token index the AI should move, or -1 if no valid moves.
 *
 * Easy   — random valid move (beginner-friendly, makes mistakes)
 * Medium — score-based (current balanced strategy)
 * Hard   — score-based + avoids landing in vulnerable positions
 */
export function getAIMove(state: GameState, difficulty: AIDifficulty = 'medium'): number {
  const player = state.players[state.currentPlayerIdx];
  const dice = state.diceValue!;
  const valid = getValidMoves(state, player, dice);

  if (valid.length === 0) return -1;
  if (valid.length === 1) return valid[0];

  // Easy: just pick randomly
  if (difficulty === 'easy') {
    return valid[Math.floor(Math.random() * valid.length)];
  }

  // Medium / Hard: score-based selection
  let best = valid[0];
  let bestScore = -Infinity;

  for (const tokenIdx of valid) {
    const pos = state.tokens[player][tokenIdx];
    const newPos: TokenPos = pos === -1 ? 0 : pos + dice;
    let score = newPos; // base = progress

    if (newPos === WIN_POS) {
      score += 200;
    } else if (wouldCapture(state, player, tokenIdx, newPos)) {
      score += 100;
    } else if (newPos >= 51) {
      score += 30;
    } else if (isPosSafe(player, newPos)) {
      score += 20;
    } else if (pos === -1) {
      score += 10;
    }

    if (difficulty === 'hard') {
      // Penalise landing where an opponent can capture us next turn
      if (!isPosSafe(player, newPos) && wouldBeVulnerable(state, player, newPos)) {
        score -= 45;
      }
      // Hard AI prefers moving the token furthest ahead if no threats
      score += pos * 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      best = tokenIdx;
    }
  }

  return best;
}
