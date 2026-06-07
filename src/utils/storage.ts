import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../types';

const K_NAME          = 'lr_player_name';
const K_LUDO_SAVE     = 'lr_ludo_save';
const K_WIN_STREAK    = 'lr_win_streak';
const K_TOTAL_WINS    = 'lr_total_wins';
const K_GAMES_PLAYED  = 'lr_games_played';
const K_LUDO_WINS     = 'lr_ludo_wins';
const K_LUDO_PLAYED   = 'lr_ludo_played';
const K_SNAKE_PLAYED  = 'lr_snake_played';
const K_LAST_DATE     = 'lr_last_date';
const K_LOGIN_STREAK  = 'lr_login_streak';
const K_UNLOCKED      = 'lr_unlocked_themes';
const K_BOARD_THEME   = 'lr_board_theme';
const K_SOUND_ON      = 'lr_sound_on';
const K_HAPTICS_ON    = 'lr_haptics_on';
const K_AI_DIFFICULTY = 'lr_ai_difficulty';
const K_TUTORIAL_DONE = 'lr_tutorial_done';
const K_ACHIEVEMENTS  = 'lr_achievements';
const K_TOKEN_SHAPE   = 'lr_token_shape';
const K_MATH_CORRECT  = 'lr_math_correct';
const K_CAPTURES      = 'lr_captures';
const K_SNAKE_WINS    = 'lr_snake_wins';

// ── Player profile ─────────────────────────────────────────────────────────────
export async function getPlayerName(): Promise<string> {
  return (await AsyncStorage.getItem(K_NAME)) ?? '';
}
export async function setPlayerName(name: string): Promise<void> {
  await AsyncStorage.setItem(K_NAME, name.trim());
}

// ── Win stats ──────────────────────────────────────────────────────────────────
export interface WinStats {
  streak: number;
  total: number;
  played: number;
  ludoWins: number;
  ludoPlayed: number;
  snakeWinsCount: number;
  snakePlayed: number;
}
export async function getWinStats(): Promise<WinStats> {
  const [streak, total, played, ludoWins, ludoPlayed, snakeWinsRaw, snakePlayed] = await Promise.all([
    AsyncStorage.getItem(K_WIN_STREAK),
    AsyncStorage.getItem(K_TOTAL_WINS),
    AsyncStorage.getItem(K_GAMES_PLAYED),
    AsyncStorage.getItem(K_LUDO_WINS),
    AsyncStorage.getItem(K_LUDO_PLAYED),
    AsyncStorage.getItem(K_SNAKE_WINS),
    AsyncStorage.getItem(K_SNAKE_PLAYED),
  ]);
  return {
    streak:         Number(streak)       || 0,
    total:          Number(total)        || 0,
    played:         Number(played)       || 0,
    ludoWins:       Number(ludoWins)     || 0,
    ludoPlayed:     Number(ludoPlayed)   || 0,
    snakeWinsCount: Number(snakeWinsRaw) || 0,
    snakePlayed:    Number(snakePlayed)  || 0,
  };
}
export async function recordWin(): Promise<WinStats> {
  const s = await getWinStats();
  const next: WinStats = {
    ...s,
    streak:     s.streak + 1,
    total:      s.total  + 1,
    played:     s.played + 1,
    ludoWins:   s.ludoWins   + 1,
    ludoPlayed: s.ludoPlayed + 1,
  };
  await AsyncStorage.multiSet([
    [K_WIN_STREAK,   String(next.streak)],
    [K_TOTAL_WINS,   String(next.total)],
    [K_GAMES_PLAYED, String(next.played)],
    [K_LUDO_WINS,    String(next.ludoWins)],
    [K_LUDO_PLAYED,  String(next.ludoPlayed)],
  ]);
  return next;
}
export async function recordLoss(): Promise<void> {
  const { played, ludoPlayed } = await getWinStats();
  await AsyncStorage.multiSet([
    [K_WIN_STREAK,   '0'],
    [K_GAMES_PLAYED, String(played + 1)],
    [K_LUDO_PLAYED,  String(ludoPlayed + 1)],
  ]);
}

// ── Daily login ────────────────────────────────────────────────────────────────
export interface LoginResult {
  isNew: boolean;
  loginStreak: number;
}
export async function checkDailyLogin(): Promise<LoginResult> {
  const today = new Date().toDateString();
  const [lastDate, rawStreak] = await Promise.all([
    AsyncStorage.getItem(K_LAST_DATE),
    AsyncStorage.getItem(K_LOGIN_STREAK),
  ]);
  const currentStreak = Number(rawStreak) || 0;

  if (lastDate === today) return { isNew: false, loginStreak: currentStreak };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const newStreak = lastDate === yesterday.toDateString() ? currentStreak + 1 : 1;

  await AsyncStorage.multiSet([
    [K_LAST_DATE,     today],
    [K_LOGIN_STREAK,  String(newStreak)],
  ]);
  return { isNew: true, loginStreak: newStreak };
}

// ── Theme ──────────────────────────────────────────────────────────────────────
export async function getUnlockedThemes(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(K_UNLOCKED);
  return raw ? JSON.parse(raw) : ['classic'];
}
export async function unlockTheme(theme: string): Promise<void> {
  const themes = await getUnlockedThemes();
  if (!themes.includes(theme)) {
    await AsyncStorage.setItem(K_UNLOCKED, JSON.stringify([...themes, theme]));
  }
}
export async function getBoardTheme(): Promise<string> {
  return (await AsyncStorage.getItem(K_BOARD_THEME)) ?? 'classic';
}
export async function setBoardTheme(theme: string): Promise<void> {
  await AsyncStorage.setItem(K_BOARD_THEME, theme);
}

// ── Sound toggle ───────────────────────────────────────────────────────────────
export async function getSoundOn(): Promise<boolean> {
  return (await AsyncStorage.getItem(K_SOUND_ON)) !== 'false';
}
export async function setSoundOn(on: boolean): Promise<void> {
  await AsyncStorage.setItem(K_SOUND_ON, on ? 'true' : 'false');
}

// ── Haptics toggle ─────────────────────────────────────────────────────────────
export async function getHapticsOn(): Promise<boolean> {
  return (await AsyncStorage.getItem(K_HAPTICS_ON)) !== 'false';
}
export async function setHapticsOn(on: boolean): Promise<void> {
  await AsyncStorage.setItem(K_HAPTICS_ON, on ? 'true' : 'false');
}

// ── AI difficulty ──────────────────────────────────────────────────────────────
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export async function getAIDifficulty(): Promise<AIDifficulty> {
  return ((await AsyncStorage.getItem(K_AI_DIFFICULTY)) ?? 'medium') as AIDifficulty;
}
export async function setAIDifficulty(d: AIDifficulty): Promise<void> {
  await AsyncStorage.setItem(K_AI_DIFFICULTY, d);
}

// ── Token shape ────────────────────────────────────────────────────────────────
export type TokenShape = 'pin' | 'pawn' | 'round';
export async function getTokenShape(): Promise<TokenShape> {
  return ((await AsyncStorage.getItem(K_TOKEN_SHAPE)) ?? 'pin') as TokenShape;
}
export async function setTokenShape(s: TokenShape): Promise<void> {
  await AsyncStorage.setItem(K_TOKEN_SHAPE, s);
}

// ── Tutorial seen ──────────────────────────────────────────────────────────────
export async function isTutorialDone(): Promise<boolean> {
  return (await AsyncStorage.getItem(K_TUTORIAL_DONE)) === 'true';
}
export async function markTutorialDone(): Promise<void> {
  await AsyncStorage.setItem(K_TUTORIAL_DONE, 'true');
}

// ── Achievement tracking ───────────────────────────────────────────────────────
export async function getEarnedAchievements(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(K_ACHIEVEMENTS);
  return raw ? JSON.parse(raw) : [];
}
export async function grantAchievements(ids: string[]): Promise<void> {
  const current = await getEarnedAchievements();
  const merged  = Array.from(new Set([...current, ...ids]));
  await AsyncStorage.setItem(K_ACHIEVEMENTS, JSON.stringify(merged));
}
export async function incrementMathCorrect(): Promise<number> {
  const n = Number(await AsyncStorage.getItem(K_MATH_CORRECT)) + 1;
  await AsyncStorage.setItem(K_MATH_CORRECT, String(n));
  return n;
}
export async function getMathCorrect(): Promise<number> {
  return Number(await AsyncStorage.getItem(K_MATH_CORRECT)) || 0;
}
export async function incrementCaptures(): Promise<number> {
  const n = Number(await AsyncStorage.getItem(K_CAPTURES)) + 1;
  await AsyncStorage.setItem(K_CAPTURES, String(n));
  return n;
}
export async function getCaptures(): Promise<number> {
  return Number(await AsyncStorage.getItem(K_CAPTURES)) || 0;
}
export async function recordSnakeWin(): Promise<number> {
  const [wRaw, pRaw, sTotal, sPlayed] = await Promise.all([
    AsyncStorage.getItem(K_SNAKE_WINS),
    AsyncStorage.getItem(K_SNAKE_PLAYED),
    AsyncStorage.getItem(K_TOTAL_WINS),
    AsyncStorage.getItem(K_GAMES_PLAYED),
  ]);
  const n = Number(wRaw) + 1;
  const played = Number(pRaw) + 1;
  const total  = Number(sTotal) + 1;
  const gPlayed = Number(sPlayed) + 1;
  await AsyncStorage.multiSet([
    [K_SNAKE_WINS,   String(n)],
    [K_SNAKE_PLAYED, String(played)],
    [K_TOTAL_WINS,   String(total)],
    [K_GAMES_PLAYED, String(gPlayed)],
  ]);
  return n;
}
export async function recordSnakeLoss(): Promise<void> {
  const [pRaw, gRaw] = await Promise.all([
    AsyncStorage.getItem(K_SNAKE_PLAYED),
    AsyncStorage.getItem(K_GAMES_PLAYED),
  ]);
  await AsyncStorage.multiSet([
    [K_SNAKE_PLAYED, String(Number(pRaw) + 1)],
    [K_GAMES_PLAYED, String(Number(gRaw) + 1)],
    [K_WIN_STREAK,   '0'],
  ]);
}
export async function getSnakeWins(): Promise<number> {
  return Number(await AsyncStorage.getItem(K_SNAKE_WINS)) || 0;
}

// ── Ludo save / resume ─────────────────────────────────────────────────────────
export async function saveLudoGame(state: GameState): Promise<void> {
  await AsyncStorage.setItem(K_LUDO_SAVE, JSON.stringify(state));
}
export async function loadLudoGame(): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(K_LUDO_SAVE);
  return raw ? JSON.parse(raw) : null;
}
export async function clearLudoGame(): Promise<void> {
  await AsyncStorage.removeItem(K_LUDO_SAVE);
}
