export type Player = 'red' | 'green' | 'yellow' | 'blue';

export const ALL_PLAYERS: Player[] = ['red', 'green', 'yellow', 'blue'];

export const PLAYER_COLORS: Record<Player, string> = {
  red:    '#E53935',
  green:  '#43A047',
  yellow: '#FB8C00',
  blue:   '#1E88E5',
};

export const PLAYER_LIGHT: Record<Player, string> = {
  red:    '#FFCDD2',
  green:  '#C8E6C9',
  yellow: '#FFE0B2',
  blue:   '#BBDEFB',
};

export const PLAYER_LABELS: Record<Player, string> = {
  red: 'Red', green: 'Green', yellow: 'Yellow', blue: 'Blue',
};
