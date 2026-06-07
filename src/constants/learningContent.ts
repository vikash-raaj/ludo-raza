// ── Snakes & Ladders cell lessons ──────────────────────────────────────────────

interface Lesson {
  title: string;
  body: string;
}

export const SNAKE_LESSONS: Record<number, Lesson> = {
  99: { title: 'Pride',       body: 'You were just one step from winning — but pride comes before a fall. The snake of arrogance sends you back!' },
  94: { title: 'Falsehood',   body: 'Lies eventually catch up with you. The snake of dishonesty pulls you all the way down.' },
  87: { title: 'Greed',       body: 'Too much is never enough. The snake of greed shows that wanting more than your share leads backward.' },
  64: { title: 'Disobedience',body: 'Ignoring good advice has consequences. This snake represents the cost of stubbornness.' },
  62: { title: 'Debt',        body: 'Living beyond your means slides you backward. This snake teaches financial wisdom.' },
  56: { title: 'Envy',        body: 'Jealousy never lifts you — it only pulls you down. Be happy for others\' success!' },
  49: { title: 'Laziness',    body: 'Procrastination is the thief of progress. The snake of laziness sets you back far.' },
  48: { title: 'Impatience',  body: 'Rushing ahead without thinking leads to setbacks. Patience is a virtue.' },
  43: { title: 'Ignorance',   body: 'Knowledge is power. Ignoring learning drags you backward in life.' },
  17: { title: 'Dishonesty',  body: 'Small deceptions lead to big falls. Honesty is always the shorter path forward.' },
};

export const LADDER_LESSONS: Record<number, Lesson> = {
  4:  { title: 'Charity',      body: 'Giving to others lifts you higher than you could reach alone. Kindness is a ladder!' },
  9:  { title: 'Perseverance', body: 'Keep going even when it\'s hard. Persistence climbs you far above where you started.' },
  20: { title: 'Humility',     body: 'Those who stay humble rise the highest. Recognizing your limits is the first step to growth.' },
  28: { title: 'Generosity',   body: 'Sharing what you have elevates everyone. Generosity always lifts the giver too!' },
  40: { title: 'Knowledge',    body: 'Learning is the fastest ladder in life. Education carries you far beyond your starting point.' },
  51: { title: 'Reliability',  body: 'Being dependable makes others trust you. Consistency is the ladder of reputation.' },
  63: { title: 'Courage',      body: 'Facing fears and taking bold steps catapults you to new heights.' },
  71: { title: 'Patience',     body: 'Good things come to those who wait wisely. Patience is one of life\'s greatest ladders.' },
};

// ── Ludo history facts (shown after countdown GO!) ────────────────────────────

export const LUDO_FACTS: string[] = [
  'Ludo is based on Pachisi, played in India since the 6th century!',
  'Mughal Emperor Akbar played Pachisi using people as living pieces.',
  'The name "Ludo" comes from the Latin word for "I play."',
  'Ludo was patented in England in 1896 by Alfred Collier.',
  'In India, Pachisi was played on a cloth board shaped like a plus sign.',
  'The original Pachisi used cowrie shells instead of dice!',
  'Ludo was one of the first board games to be digitized, in the 1980s.',
  'The word "Pachisi" means "twenty-five" — the highest score with cowrie shells.',
  'During lockdown 2020, Ludo King hit 50M+ daily active users!',
  'Snakes & Ladders was invented in India as "Moksha Patam" to teach morality.',
  'In England, the game was renamed "Snakes and Ladders" in the 1890s.',
  'Originally, Snakes & Ladders had MORE snakes than ladders — life is hard!',
  'Every safe square in Ludo is colored — those are the ancient "castles" of Pachisi.',
];

// ── Post-game strategy tips ────────────────────────────────────────────────────

export const WIN_TIPS: string[] = [
  'Pro: Always get all 4 tokens out of base as fast as possible.',
  'Tip: Capture opponents early to slow them down.',
  'Strategy: Keep at least one token on a safe square when in danger.',
  'Pro: Stack two tokens together — they protect each other from capture!',
  'Tip: Rolling 6 gives you a bonus turn — use it to move your fastest token.',
  'Strategy: The home column is safe — race your most advanced token there first.',
  'Pro: Spreading tokens across the board gives you more options on every roll.',
];

export const LOSS_TIPS: string[] = [
  'Next time: Exit your tokens from base quickly — don\'t wait for perfect rolls.',
  'Tip: Watch which squares are "safe" (stars) — park there to avoid capture.',
  'Strategy: Don\'t cluster all tokens in one spot — spread them out!',
  'Pro: When CPU captures you, focus on the token furthest ahead.',
  'Tip: If you can\'t capture, advance your closest-to-home token.',
  'Strategy: Protect your home-column tokens — they\'re almost there!',
  'Next time: Rolling 6 three times in a row forfeits your turn — play safe.',
];

// ── Math challenge questions ───────────────────────────────────────────────────

interface MathQ {
  q: string;
  answer: number;
  choices: number[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(answer: number): number[] {
  const wrongs = new Set<number>();
  while (wrongs.size < 2) {
    const delta = Math.floor(Math.random() * 6) + 1;
    const w = Math.random() > 0.5 ? answer + delta : Math.max(1, answer - delta);
    if (w !== answer) wrongs.add(w);
  }
  return shuffle([answer, ...wrongs]);
}

export function generateMathQuestion(diceValue: number): MathQ {
  const templates: Array<() => { q: string; answer: number }> = [
    () => ({ q: `${diceValue} × 3 = ?`,              answer: diceValue * 3 }),
    () => ({ q: `${diceValue} + ${diceValue} = ?`,   answer: diceValue * 2 }),
    () => ({ q: `${diceValue * 2} ÷ 2 = ?`,          answer: diceValue }),
    () => ({ q: `${diceValue + 10} − 10 = ?`,        answer: diceValue }),
    () => ({ q: `${diceValue} × ${diceValue} = ?`,   answer: diceValue * diceValue }),
    () => ({ q: `${diceValue * 4} ÷ 4 = ?`,          answer: diceValue }),
    () => ({ q: `${diceValue} + ${diceValue + 1} = ?`, answer: diceValue * 2 + 1 }),
  ];
  const { q, answer } = templates[Math.floor(Math.random() * templates.length)]();
  return { q, answer, choices: makeChoices(answer) };
}

// ── Daily reward messages ──────────────────────────────────────────────────────

export const STREAK_REWARDS: string[] = [
  '🎁 Welcome back! Keep it up!',
  '🎲 2-day streak! You\'re on a roll!',
  '🌿 3-day streak! Forest theme unlocked!',
  '🔥 4 days! You\'re a true Ludo fan!',
  '⭐ 5-day streak! You\'re unstoppable!',
  '🏅 6 days! Almost a full week!',
  '🌙 7-day streak! Night theme unlocked! You\'re a champion!',
];

export function getStreakReward(streak: number): string {
  const idx = Math.min(streak - 1, STREAK_REWARDS.length - 1);
  return STREAK_REWARDS[idx];
}
