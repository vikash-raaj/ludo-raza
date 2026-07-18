import { Player } from './players';

export interface GlossStops {
  light: string;
  base: string;
  dark: string;
}

// 3-stop light→base→dark ramps used to build glossy radial/linear gradients
// for tokens, path cells and buttons throughout the app.
export const PLAYER_GLOSS: Record<Player, GlossStops> = {
  red:    { light: '#FF8A80', base: '#E53935', dark: '#8E0000' },
  green:  { light: '#A5D6A7', base: '#43A047', dark: '#1B5E20' },
  yellow: { light: '#FFCC80', base: '#FB8C00', dark: '#B34700' },
  blue:   { light: '#90CAF9', base: '#1E88E5', dark: '#0D47A1' },
};

export const GOLD_GLOSS: GlossStops = { light: '#FFF9C4', base: '#FFD600', dark: '#C79100' };

/** Lighten (positive percent) or darken (negative) a hex color — used to build
 * ad-hoc gradient stops for colors not covered by PLAYER_GLOSS (e.g. the
 * dynamic winner color in WinOverlay). */
export function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

// Lighter tint used for the base-corner cell gradient highlight (brighter than PLAYER_LIGHT)
export const PLAYER_LIGHTER: Record<Player, string> = {
  red:    '#FFE4E1',
  green:  '#E3F5E4',
  yellow: '#FFEBCC',
  blue:   '#E1F0FD',
};
