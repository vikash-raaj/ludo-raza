export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win',      emoji: '🏆', title: 'First Victory',   desc: 'Win your first game'          },
  { id: 'win_5',          emoji: '🎖️', title: 'Veteran',          desc: 'Win 5 games'                  },
  { id: 'win_10',         emoji: '🥇', title: 'Champion',         desc: 'Win 10 games'                 },
  { id: 'win_25',         emoji: '👑', title: 'Legend',           desc: 'Win 25 games'                 },
  { id: 'streak_3',       emoji: '🔥', title: 'On Fire',          desc: '3-game win streak'            },
  { id: 'streak_5',       emoji: '⚡', title: 'Unstoppable',      desc: '5-game win streak'            },
  { id: 'login_3',        emoji: '🌿', title: 'Regular',          desc: 'Log in 3 days in a row'      },
  { id: 'login_7',        emoji: '🌙', title: 'Night Owl',        desc: 'Log in 7 days in a row'      },
  { id: 'math_master',    emoji: '🧮', title: 'Math Master',      desc: 'Answer 10 math challenges correctly' },
  { id: 'ludo_100',       emoji: '🎲', title: 'Dice Lord',        desc: 'Play 100 Ludo games'          },
  { id: 'snake_win',      emoji: '🐍', title: 'Snake Charmer',    desc: 'Win a Snakes & Ladders game'  },
  { id: 'capture_10',     emoji: '💥', title: 'Crusher',          desc: 'Capture 10 opponent tokens'   },
];

export function checkAchievements(params: {
  totalWins: number;
  winStreak: number;
  loginStreak: number;
  gamesPlayed: number;
  mathCorrect: number;
  captures: number;
  snakeWins: number;
  earned: string[];
}): Achievement[] {
  const { totalWins, winStreak, loginStreak, gamesPlayed, mathCorrect, captures, snakeWins, earned } = params;
  const newOnes: Achievement[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !earned.includes(id)) {
      const a = ACHIEVEMENTS.find(x => x.id === id);
      if (a) newOnes.push(a);
    }
  };

  check('first_win',   totalWins >= 1);
  check('win_5',       totalWins >= 5);
  check('win_10',      totalWins >= 10);
  check('win_25',      totalWins >= 25);
  check('streak_3',    winStreak >= 3);
  check('streak_5',    winStreak >= 5);
  check('login_3',     loginStreak >= 3);
  check('login_7',     loginStreak >= 7);
  check('math_master', mathCorrect >= 10);
  check('ludo_100',    gamesPlayed >= 100);
  check('snake_win',   snakeWins >= 1);
  check('capture_10',  captures >= 10);

  return newOnes;
}
