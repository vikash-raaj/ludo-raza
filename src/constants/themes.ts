export type ThemeName = 'classic' | 'forest' | 'night';

export interface AppTheme {
  name: ThemeName;
  label: string;
  emoji: string;
  /** gradient for all screen backgrounds */
  gradient: readonly [string, string, string];
  /** board grid lines */
  gridStroke: string;
  /** board outer border */
  boardBorder: string;
  /** safe-square star color */
  safeColor: string;
  /** accent color for buttons, active states */
  accent: string;
  /** unlock condition shown to user */
  unlockHint: string;
}

export const THEMES: Record<ThemeName, AppTheme> = {
  classic: {
    name: 'classic',
    label: 'Classic',
    emoji: '🎲',
    gradient:    ['#1A237E', '#283593', '#1565C0'],
    gridStroke:  '#BDBDBD',
    boardBorder: '#424242',
    safeColor:   '#FFD600',
    accent:      '#FFD600',
    unlockHint:  'Default',
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    emoji: '🌿',
    gradient:    ['#1B5E20', '#2E7D32', '#558B2F'],
    gridStroke:  '#A5D6A7',
    boardBorder: '#5D4037',
    safeColor:   '#FFE082',
    accent:      '#69F0AE',
    unlockHint:  'Unlock: 3-day login streak',
  },
  night: {
    name: 'night',
    label: 'Night',
    emoji: '🌙',
    gradient:    ['#0D0D0D', '#1A1A2E', '#16213E'],
    gridStroke:  '#444',
    boardBorder: '#B8860B',
    safeColor:   '#FFD700',
    accent:      '#FFD700',
    unlockHint:  'Unlock: 7-day login streak',
  },
};
