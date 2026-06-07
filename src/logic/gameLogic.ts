import { MAIN_PATH, PLAYER_OFFSET, HOME_COLUMNS, SAFE_INDICES, TOKEN_BASE_CELLS } from '../constants/board';
import { Player, ALL_PLAYERS } from '../constants/players';
import { GameState, GameAction, TokenPos } from '../types';

export const WIN_POS = 56;

export function createInitialState(
  players: Player[],
  computerPlayers: Player[] = [],
  quickMode = false,
): GameState {
  const tokens = {} as Record<Player, [TokenPos, TokenPos, TokenPos, TokenPos]>;
  for (const p of ALL_PLAYERS) {
    // Quick mode: 2 tokens already on the board (pos 5, 18) so every player
    // can move immediately without needing a 6.
    tokens[p] = quickMode ? [-1, -1, 5, 18] : [-1, -1, -1, -1];
  }
  return {
    players,
    tokens,
    currentPlayerIdx: 0,
    diceValue: null,
    phase: 'rolling',
    winner: null,
    consecutiveSixes: 0,
    computerPlayers,
    quickMode,
  };
}

// Get board (row, col) for a given player + relative position + tokenIdx (for base offsets)
export function getCoords(player: Player, pos: TokenPos, tokenIdx: number): { r: number; c: number } {
  if (pos === -1) return TOKEN_BASE_CELLS[player][tokenIdx];
  if (pos <= 50) {
    const g = (PLAYER_OFFSET[player] + pos) % 52;
    return MAIN_PATH[g];
  }
  if (pos <= 55) return HOME_COLUMNS[player][pos - 51];
  return { r: 7, c: 7 }; // center (won)
}

function isPositionSafe(player: Player, pos: TokenPos): boolean {
  if (pos < 0 || pos >= 51) return true; // base and home column are always safe
  const g = (PLAYER_OFFSET[player] + pos) % 52;
  return SAFE_INDICES.has(g);
}

function getValidMoves(state: GameState, player: Player, dice: number): number[] {
  const valid: number[] = [];
  for (let i = 0; i < 4; i++) {
    const pos = state.tokens[player][i];
    if (pos === WIN_POS) continue;
    if (pos === -1 && dice === 6) { valid.push(i); continue; }
    if (pos >= 0 && pos + dice <= WIN_POS) valid.push(i);
  }
  return valid;
}

function applyCaptures(state: GameState, player: Player, tokenIdx: number, newPos: TokenPos): GameState {
  if (isPositionSafe(player, newPos)) return state;
  const landCoords = getCoords(player, newPos, tokenIdx);
  const newTokens = { ...state.tokens };

  for (const opp of state.players) {
    if (opp === player) continue;
    const oppToks = [...newTokens[opp]] as [TokenPos, TokenPos, TokenPos, TokenPos];
    let changed = false;
    for (let i = 0; i < 4; i++) {
      const oppPos = oppToks[i];
      if (oppPos < 0 || oppPos >= 51) continue;
      const oppCoords = getCoords(opp, oppPos, i);
      if (oppCoords.r === landCoords.r && oppCoords.c === landCoords.c) {
        oppToks[i] = -1;
        changed = true;
      }
    }
    if (changed) newTokens[opp] = oppToks;
  }
  return { ...state, tokens: newTokens };
}

function applyMove(state: GameState, player: Player, tokenIdx: number): GameState {
  const dice = state.diceValue!;
  const oldPos = state.tokens[player][tokenIdx];
  const newPos: TokenPos = oldPos === -1 ? 0 : oldPos + dice;

  const updatedTokens = [...state.tokens[player]] as [TokenPos, TokenPos, TokenPos, TokenPos];
  updatedTokens[tokenIdx] = newPos;

  let next: GameState = {
    ...state,
    tokens: { ...state.tokens, [player]: updatedTokens },
  };

  // Captures
  next = applyCaptures(next, player, tokenIdx, newPos);

  // Win check
  if (next.tokens[player].every(p => p === WIN_POS)) {
    return { ...next, winner: player, phase: 'gameover', diceValue: null };
  }

  // A 6 grants another turn
  if (dice === 6) {
    return { ...next, phase: 'rolling', diceValue: null };
  }

  const nextIdx = (state.currentPlayerIdx + 1) % state.players.length;
  return { ...next, currentPlayerIdx: nextIdx, phase: 'rolling', diceValue: null };
}

function advanceTurn(state: GameState): GameState {
  const nextIdx = (state.currentPlayerIdx + 1) % state.players.length;
  return { ...state, currentPlayerIdx: nextIdx, phase: 'rolling', diceValue: null, consecutiveSixes: 0 };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState(action.players, action.computerPlayers, action.quickMode);

    case 'SKIP_TURN': {
      const nextIdx = (state.currentPlayerIdx + 1) % state.players.length;
      return { ...state, currentPlayerIdx: nextIdx, phase: 'rolling', diceValue: null, consecutiveSixes: 0 };
    }

    case 'ROLL_DICE': {
      if (state.phase !== 'rolling') return state;
      const dice = Math.floor(Math.random() * 6) + 1;
      const newSixes = dice === 6 ? state.consecutiveSixes + 1 : 0;

      // Three consecutive sixes → forfeit turn
      if (newSixes === 3) {
        return advanceTurn({ ...state, diceValue: dice });
      }

      const player = state.players[state.currentPlayerIdx];
      const valid = getValidMoves({ ...state, diceValue: dice }, player, dice);

      if (valid.length === 0) {
        return advanceTurn({ ...state, diceValue: dice, consecutiveSixes: newSixes });
      }

      if (valid.length === 1) {
        return applyMove({ ...state, diceValue: dice, consecutiveSixes: newSixes }, player, valid[0]);
      }

      return { ...state, diceValue: dice, consecutiveSixes: newSixes, phase: 'selecting' };
    }

    case 'MOVE_TOKEN': {
      if (state.phase !== 'selecting') return state;
      const player = state.players[state.currentPlayerIdx];
      const valid = getValidMoves(state, player, state.diceValue!);
      if (!valid.includes(action.tokenIdx)) return state;
      return applyMove(state, player, action.tokenIdx);
    }

    default:
      return state;
  }
}

export { getValidMoves };
