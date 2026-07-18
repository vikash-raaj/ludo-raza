import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Switch, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Player } from '../constants/players';
import { AppTheme, THEMES, ThemeName } from '../constants/themes';
import { GOLD_GLOSS, shade } from '../constants/gloss';
import { WinStats, AIDifficulty, TokenShape } from '../utils/storage';

/** Glossy gradient tile — used for every "active/selected" or primary-action
 * surface in the lobby (gold badges, navy selections, the big start button). */
function Glossy({ colors, style, children }: {
  colors: readonly [string, string, ...string[]];
  style?: any;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient colors={colors} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.glossyBase, style]}>
      <View style={styles.glossySheen} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}

type GameMode = 'friends' | 'computer';
type GameType = 'ludo' | 'snake';

interface HomeScreenProps {
  playerName: string;
  theme: AppTheme;
  unlockedThemes: ThemeName[];
  winStats: WinStats;
  hasSavedGame: boolean;
  soundOn: boolean;
  hapticsOn: boolean;
  aiDifficulty: AIDifficulty;
  tokenShape: TokenShape;
  onStartLudo:  (players: Player[], computerPlayers: Player[], quickMode: boolean, mathMode: boolean, playerNames: Partial<Record<Player, string>>) => void;
  onStartSnake: (mathMode: boolean, twoPlayer: boolean) => void;
  onResumeLudo: () => void;
  onThemeChange: (t: ThemeName) => void;
  onSoundToggle: (on: boolean) => void;
  onHapticsToggle: (on: boolean) => void;
  onTokenShapeChange: (s: TokenShape) => void;
  onAiDiffChange: (d: AIDifficulty) => void;
  onNameEdit: () => void;
}

const FRIENDS_CONFIGS: Record<2 | 3 | 4, Player[]> = {
  2: ['red', 'yellow'],
  3: ['red', 'green', 'yellow'],
  4: ['red', 'green', 'yellow', 'blue'],
};

const COLOR_MAP: Record<Player, { color: string; light: string; emoji: string; label: string }> = {
  red:    { color: '#E53935', light: '#FFCDD2', emoji: '🔴', label: 'Red' },
  green:  { color: '#43A047', light: '#C8E6C9', emoji: '🟢', label: 'Green' },
  yellow: { color: '#FB8C00', light: '#FFE0B2', emoji: '🟡', label: 'Yellow' },
  blue:   { color: '#1E88E5', light: '#BBDEFB', emoji: '🔵', label: 'Blue' },
};

const VS_CPU_CONFIGS: Record<1 | 2 | 3, { players: Player[]; cpu: Player[] }> = {
  1: { players: ['red', 'green'],                  cpu: ['green'] },
  2: { players: ['red', 'green', 'yellow'],         cpu: ['green', 'yellow'] },
  3: { players: ['red', 'green', 'yellow', 'blue'], cpu: ['green', 'yellow', 'blue'] },
};

const AI_LABELS: Record<AIDifficulty, { label: string; emoji: string; color: string }> = {
  easy:   { label: 'Easy',   emoji: '😊', color: '#43A047' },
  medium: { label: 'Medium', emoji: '🤔', color: '#FB8C00' },
  hard:   { label: 'Hard',   emoji: '😤', color: '#E53935' },
};

export default function HomeScreen({
  playerName, theme, unlockedThemes, winStats, hasSavedGame,
  soundOn, hapticsOn, aiDifficulty, tokenShape,
  onStartLudo, onStartSnake, onResumeLudo, onThemeChange, onSoundToggle,
  onHapticsToggle, onTokenShapeChange, onAiDiffChange, onNameEdit,
}: HomeScreenProps) {

  const [gameType,  setGameType]  = useState<GameType>('ludo');
  const [mode,      setMode]      = useState<GameMode>('friends');
  const [count,     setCount]     = useState<2 | 3 | 4>(4);
  const [cpuCount,  setCpuCount]  = useState<1 | 2 | 3>(1);
  const [quickMode, setQuickMode] = useState(false);
  const [mathMode,  setMathMode]  = useState(false);
  const [snake2P,      setSnake2P]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats,    setShowStats]    = useState(false);

  // Friendly-mode custom player names (keyed by colour)
  const [friendNames, setFriendNames] = useState<Partial<Record<Player, string>>>({});
  const updateFriendName = (p: Player, name: string) =>
    setFriendNames(prev => ({ ...prev, [p]: name }));

  const handleStartLudo = () => {
    if (mode === 'computer') {
      const { players, cpu } = VS_CPU_CONFIGS[cpuCount];
      onStartLudo(players, cpu, quickMode, mathMode, {});
    } else {
      onStartLudo(FRIENDS_CONFIGS[count], [], quickMode, mathMode, friendNames);
    }
  };

  const displayName = playerName || 'Player';
  const winRate = winStats.played > 0 ? Math.round((winStats.total / winStats.played) * 100) : 0;

  return (
    <LinearGradient colors={theme.gradient as any} style={styles.fill}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Glossy colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]} style={styles.diceBadge}>
              <Text style={styles.diceEmoji}>🎲</Text>
            </Glossy>
            <Text style={styles.title}>LUDO RAZA</Text>
            <Text style={styles.subtitle}>Roll • Move • Win!</Text>
            <View style={styles.colorStrip}>
              {(['red','green','yellow','blue'] as Player[]).map(p => (
                <View key={p} style={[styles.stripBlock, { backgroundColor: COLOR_MAP[p].color }]} />
              ))}
            </View>
          </View>

          {/* ── Player greeting + stats row ──────────────────────────── */}
          <View style={styles.profileRow}>
            <TouchableOpacity style={styles.nameBtn} onPress={onNameEdit} activeOpacity={0.8}>
              <Text style={styles.nameBtnText}>👤 {displayName}</Text>
              <Text style={styles.nameBtnEdit}>✏️</Text>
            </TouchableOpacity>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🏆 {winStats.total} wins</Text>
            </View>
            {winStats.streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: '#E65100' }]}>
                <Text style={styles.streakText}>🔥 {winStats.streak} streak</Text>
              </View>
            )}
          </View>

          {/* Resume banner */}
          {hasSavedGame && (
            <TouchableOpacity onPress={onResumeLudo} activeOpacity={0.85} style={styles.fullWidth}>
              <Glossy colors={[shade('#43A047', 25), '#43A047', shade('#43A047', -30)]} style={styles.resumeBanner}>
                <Text style={styles.resumeText}>▶  CONTINUE SAVED GAME</Text>
              </Glossy>
            </TouchableOpacity>
          )}

          {/* ── Game type selector ──────────────────────────────────── */}
          <View style={styles.gameTypeRow}>
            <TouchableOpacity style={styles.fill1} onPress={() => setGameType('ludo')} activeOpacity={0.8}>
              {gameType === 'ludo' ? (
                <Glossy colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]} style={[styles.gameTypeBtn, styles.activeGoldShadow]}>
                  <Text style={styles.gameTypeIcon}>🎲</Text>
                  <Text style={[styles.gameTypeLabel, styles.gameTypeLabelActive]}>Ludo</Text>
                </Glossy>
              ) : (
                <View style={[styles.gameTypeBtn, styles.tileIdle]}>
                  <Text style={styles.gameTypeIcon}>🎲</Text>
                  <Text style={styles.gameTypeLabel}>Ludo</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.fill1} onPress={() => setGameType('snake')} activeOpacity={0.8}>
              {gameType === 'snake' ? (
                <Glossy colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]} style={[styles.gameTypeBtn, styles.activeGoldShadow]}>
                  <Text style={styles.gameTypeIcon}>🐍</Text>
                  <Text style={[styles.gameTypeLabel, styles.gameTypeLabelActive]}>Snakes & Ladders</Text>
                </Glossy>
              ) : (
                <View style={[styles.gameTypeBtn, styles.tileIdle]}>
                  <Text style={styles.gameTypeIcon}>🐍</Text>
                  <Text style={styles.gameTypeLabel}>Snakes & Ladders</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── LUDO options ─────────────────────────────────────────── */}
          {gameType === 'ludo' && (
            <>
              <View style={styles.modeRow}>
                <TouchableOpacity style={styles.fill1} onPress={() => setMode('friends')} activeOpacity={0.8}>
                  {mode === 'friends' ? (
                    <Glossy colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]} style={[styles.modeBtn, styles.activeGoldShadow]}>
                      <Text style={styles.modeIcon}>👥</Text>
                      <Text style={[styles.modeLabel, styles.modeLabelActive]}>With Friends</Text>
                    </Glossy>
                  ) : (
                    <View style={[styles.modeBtn, styles.tileIdle]}>
                      <Text style={styles.modeIcon}>👥</Text>
                      <Text style={styles.modeLabel}>With Friends</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.fill1} onPress={() => setMode('computer')} activeOpacity={0.8}>
                  {mode === 'computer' ? (
                    <Glossy colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]} style={[styles.modeBtn, styles.activeGoldShadow]}>
                      <Text style={styles.modeIcon}>🤖</Text>
                      <Text style={[styles.modeLabel, styles.modeLabelActive]}>vs Computer</Text>
                    </Glossy>
                  ) : (
                    <View style={[styles.modeBtn, styles.tileIdle]}>
                      <Text style={styles.modeIcon}>🤖</Text>
                      <Text style={styles.modeLabel}>vs Computer</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {mode === 'friends' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>How many players?</Text>
                  <View style={styles.countRow}>
                    {([2, 3, 4] as const).map(n => (
                      <TouchableOpacity key={n} onPress={() => setCount(n)} activeOpacity={0.8}>
                        {count === n ? (
                          <Glossy colors={[shade('#1A237E', 30), '#1A237E', shade('#1A237E', -25)]} style={[styles.countBtn, styles.transparentBorder]}>
                            <Text style={[styles.countNum, styles.countNumActive]}>{n}</Text>
                            <Text style={[styles.countSub, styles.countSubActive]}>players</Text>
                          </Glossy>
                        ) : (
                          <View style={[styles.countBtn, styles.tileIdle]}>
                            <Text style={styles.countNum}>{n}</Text>
                            <Text style={styles.countSub}>players</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Name inputs for each active player */}
                  <View style={styles.nameInputsWrap}>
                    {FRIENDS_CONFIGS[count].map(p => (
                      <View key={p} style={[styles.nameInputRow, { borderColor: COLOR_MAP[p].color }]}>
                        <Text style={styles.nameInputEmoji}>{COLOR_MAP[p].emoji}</Text>
                        <TextInput
                          style={[styles.nameInputField, { color: COLOR_MAP[p].color }]}
                          value={friendNames[p] ?? ''}
                          onChangeText={t => updateFriendName(p, t)}
                          placeholder={COLOR_MAP[p].label}
                          placeholderTextColor={COLOR_MAP[p].color + '88'}
                          maxLength={12}
                          returnKeyType="done"
                        />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {mode === 'computer' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>You vs {cpuCount} Computer{cpuCount > 1 ? 's' : ''}!</Text>
                  <View style={styles.countRow}>
                    {([1, 2, 3] as const).map(n => (
                      <TouchableOpacity key={n} onPress={() => setCpuCount(n)} activeOpacity={0.8}>
                        {cpuCount === n ? (
                          <Glossy colors={[shade('#1A237E', 30), '#1A237E', shade('#1A237E', -25)]} style={[styles.countBtn, styles.transparentBorder]}>
                            <Text style={[styles.countNum, styles.countNumActive]}>{n}</Text>
                            <Text style={[styles.countSub, styles.countSubActive]}>{n === 1 ? 'CPU' : 'CPUs'}</Text>
                          </Glossy>
                        ) : (
                          <View style={[styles.countBtn, styles.tileIdle]}>
                            <Text style={styles.countNum}>{n}</Text>
                            <Text style={styles.countSub}>{n === 1 ? 'CPU' : 'CPUs'}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.vsRow}>
                    <View style={styles.vsYouBox}>
                      <Text style={styles.vsIcon}>🔴</Text>
                      <Text style={styles.vsYouLabel}>{displayName.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.vsText}>VS</Text>
                    <View style={styles.vsCpuBox}>
                      {VS_CPU_CONFIGS[cpuCount].cpu.map(p => (
                        <View key={p} style={styles.cpuPlayer}>
                          <Text style={styles.vsIcon}>{COLOR_MAP[p].emoji}</Text>
                          <Text style={styles.cpuTag}>🤖</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {/* AI Difficulty */}
                  <View style={styles.diffRow}>
                    {(['easy','medium','hard'] as AIDifficulty[]).map(d => {
                      const { label, emoji, color } = AI_LABELS[d];
                      const active = aiDifficulty === d;
                      return (
                        <TouchableOpacity key={d} style={styles.fill1} onPress={() => onAiDiffChange(d)} activeOpacity={0.8}>
                          {active ? (
                            <Glossy colors={[shade(color, 25), color, shade(color, -25)]} style={[styles.diffBtn, styles.transparentBorder]}>
                              <Text style={styles.diffEmoji}>{emoji}</Text>
                              <Text style={[styles.diffLabel, styles.diffLabelActive]}>{label}</Text>
                            </Glossy>
                          ) : (
                            <View style={styles.diffBtn}>
                              <Text style={styles.diffEmoji}>{emoji}</Text>
                              <Text style={styles.diffLabel}>{label}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Game modifiers */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Game Options</Text>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>⚡ Quick Mode</Text>
                    <Text style={styles.toggleDesc}>2 tokens start on the board — faster games!</Text>
                  </View>
                  <Switch value={quickMode} onValueChange={setQuickMode} trackColor={{ true: theme.accent }} />
                </View>
                <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: '#EEE' }]}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleTitle}>🧠 Math Challenge</Text>
                    <Text style={styles.toggleDesc}>Solve a math question after rolling!</Text>
                  </View>
                  <Switch value={mathMode} onValueChange={setMathMode} trackColor={{ true: '#5C6BC0' }} />
                </View>
              </View>

              <TouchableOpacity onPress={handleStartLudo} activeOpacity={0.85} style={styles.fullWidth}>
                <Glossy colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]} style={[styles.startBtn, { shadowColor: theme.accent }]}>
                  <Text style={styles.startIcon}>🎮</Text>
                  <Text style={[styles.startBtnText, { color: '#1A237E' }]}>START LUDO!</Text>
                </Glossy>
              </TouchableOpacity>
            </>
          )}

          {/* ── SNAKE options ────────────────────────────────────────── */}
          {gameType === 'snake' && (
            <>
              <View style={styles.card}>
                <Text style={styles.snakeTitle}>🐍 Snakes & Ladders 🪜</Text>
                <Text style={styles.snakeDesc}>
                  Classic 100-cell board.{'\n'}
                  Avoid snakes, climb ladders.{'\n'}
                  First to 100 wins!{'\n\n'}
                  <Text style={{ color: '#43A047', fontWeight: '700' }}>
                    💡 Learn the moral meaning of each snake & ladder!
                  </Text>
                </Text>

                {/* 1P / 2P toggle */}
                <View style={styles.snakeModeRow}>
                  <TouchableOpacity style={styles.fill1} onPress={() => setSnake2P(false)} activeOpacity={0.8}>
                    {!snake2P ? (
                      <Glossy colors={[shade('#7B1FA2', 25), '#7B1FA2', shade('#7B1FA2', -25)]} style={[styles.snakeModeBtn, styles.transparentBorder]}>
                        <Text style={[styles.snakeModeTxt, styles.snakeModeTxtActive]}>🤖 vs Computer</Text>
                      </Glossy>
                    ) : (
                      <View style={styles.snakeModeBtn}>
                        <Text style={styles.snakeModeTxt}>🤖 vs Computer</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.fill1} onPress={() => setSnake2P(true)} activeOpacity={0.8}>
                    {snake2P ? (
                      <Glossy colors={[shade('#7B1FA2', 25), '#7B1FA2', shade('#7B1FA2', -25)]} style={[styles.snakeModeBtn, styles.transparentBorder]}>
                        <Text style={[styles.snakeModeTxt, styles.snakeModeTxtActive]}>👥 2 Players</Text>
                      </Glossy>
                    ) : (
                      <View style={styles.snakeModeBtn}>
                        <Text style={styles.snakeModeTxt}>👥 2 Players</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.snakeVsRow}>
                  <View style={styles.snakePlayer}>
                    <Text style={styles.snakePinBlue}>📍</Text>
                    <Text style={[styles.snakePlayerLabel, { color: '#1565C0' }]}>{displayName.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.snakeVsText}>VS</Text>
                  <View style={styles.snakePlayer}>
                    <Text style={styles.snakePinRed}>📍</Text>
                    <Text style={[styles.snakePlayerLabel, { color: '#C62828' }]}>{snake2P ? 'PLAYER 2' : 'COM 🤖'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => onStartSnake(mathMode, snake2P)} activeOpacity={0.85} style={styles.fullWidth}>
                <Glossy colors={[shade('#7B1FA2', 25), '#7B1FA2', shade('#7B1FA2', -25)]} style={[styles.startBtn, { shadowColor: '#7B1FA2' }]}>
                  <Text style={styles.startIcon}>🐍</Text>
                  <Text style={[styles.startBtnText, { color: 'white' }]}>START GAME!</Text>
                </Glossy>
              </TouchableOpacity>
            </>
          )}

          {/* ── Settings & Stats row ─────────────────────────────────── */}
          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(true)} activeOpacity={0.8}>
              <Text style={styles.iconBtnEmoji}>⚙️</Text>
              <Text style={styles.iconBtnLabel}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowStats(true)} activeOpacity={0.8}>
              <Text style={styles.iconBtnEmoji}>📊</Text>
              <Text style={styles.iconBtnLabel}>Stats</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            {gameType === 'ludo' ? 'Classic Ludo • 2–4 Players' : 'Snakes & Ladders • You vs Computer'}
          </Text>
        </ScrollView>
      </SafeAreaView>

      {/* ── Settings Modal ──────────────────────────────────────────── */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>⚙️ Settings</Text>

            {/* Sound toggle */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>🔊 Sound</Text>
              <Switch value={soundOn} onValueChange={onSoundToggle} trackColor={{ true: '#43A047' }} />
            </View>

            {/* Haptics toggle */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>📳 Vibration</Text>
              <Switch value={hapticsOn} onValueChange={onHapticsToggle} trackColor={{ true: '#43A047' }} />
            </View>

            {/* Theme picker */}
            <Text style={[styles.settingLabel, { marginTop: 12, marginBottom: 8 }]}>🎨 Board Theme</Text>
            <View style={styles.themeRow}>
              {(['classic','forest','night'] as ThemeName[]).map(t => {
                const th = THEMES[t];
                const locked = !unlockedThemes.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeBtn,
                      theme.name === t && styles.themeBtnActive,
                      locked && styles.themeBtnLocked,
                    ]}
                    onPress={() => { if (!locked) { onThemeChange(t); } }}
                    activeOpacity={locked ? 1 : 0.8}
                  >
                    <Text style={styles.themeEmoji}>{th.emoji}</Text>
                    <Text style={styles.themeLabel}>{th.label}</Text>
                    {locked && <Text style={styles.themeLock}>🔒</Text>}
                    {locked && <Text style={styles.themeHint}>{th.unlockHint}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Token shape picker */}
            <Text style={[styles.settingLabel, { marginTop: 12, marginBottom: 8 }]}>🎭 Token Shape</Text>
            <View style={styles.themeRow}>
              {([
                { id: 'pin'  as TokenShape, label: 'Pin',   emoji: '📍' },
                { id: 'pawn' as TokenShape, label: 'Pawn',  emoji: '♟️' },
                { id: 'round'as TokenShape, label: 'Round', emoji: '🔵' },
              ]).map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.themeBtn, tokenShape === s.id && styles.themeBtnActive]}
                  onPress={() => onTokenShapeChange(s.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.themeEmoji}>{s.emoji}</Text>
                  <Text style={styles.themeLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setShowSettings(false)} activeOpacity={0.8} style={styles.fullWidth}>
              <Glossy colors={[shade('#1A237E', 25), '#1A237E', shade('#1A237E', -20)]} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </Glossy>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Stats Modal ─────────────────────────────────────────────── */}
      <Modal visible={showStats} transparent animationType="slide" onRequestClose={() => setShowStats(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📊 Your Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{winStats.played}</Text>
                <Text style={styles.statLbl}>Total Games</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#43A047' }]}>{winStats.total}</Text>
                <Text style={styles.statLbl}>Total Wins</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: '#1E88E5' }]}>{winRate}%</Text>
                <Text style={styles.statLbl}>Win Rate</Text>
              </View>
              <View style={[styles.statBox, { width: '100%' }]}>
                <Text style={[styles.statNum, { color: '#E65100' }]}>🔥 {winStats.streak}</Text>
                <Text style={styles.statLbl}>Win Streak</Text>
              </View>
            </View>

            {/* Split stats */}
            <View style={styles.splitStats}>
              <View style={styles.splitRow}>
                <Text style={styles.splitIcon}>🎲</Text>
                <View style={styles.splitInfo}>
                  <Text style={styles.splitGame}>Ludo</Text>
                  <Text style={styles.splitDetail}>{winStats.ludoWins}W / {winStats.ludoPlayed}P</Text>
                </View>
              </View>
              <View style={styles.splitRow}>
                <Text style={styles.splitIcon}>🐍</Text>
                <View style={styles.splitInfo}>
                  <Text style={styles.splitGame}>Snakes & Ladders</Text>
                  <Text style={styles.splitDetail}>{winStats.snakeWinsCount}W / {winStats.snakePlayed}P</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowStats(false)} activeOpacity={0.8} style={styles.fullWidth}>
              <Glossy colors={[shade('#1A237E', 25), '#1A237E', shade('#1A237E', -20)]} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Close</Text>
              </Glossy>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill:      { flex: 1 },
  fill1:     { flex: 1 },
  fullWidth: { width: '100%' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 16 },

  // Reusable glossy gradient tile (see <Glossy>)
  glossyBase: { overflow: 'hidden', position: 'relative' },
  glossySheen: {
    position: 'absolute', top: 3, left: '8%', right: '8%', height: '42%',
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.32)',
  },
  tileIdle: { backgroundColor: 'rgba(255,255,255,0.12)' },

  // Header
  header:    { alignItems: 'center', gap: 4 },
  diceBadge: {
    width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
    marginBottom: 4,
  },
  diceEmoji: { fontSize: 38 },
  title: {
    fontSize: 46, fontWeight: '900', color: '#FFFFFF', letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 10, textShadowOffset: { width: 2, height: 3 },
  },
  subtitle:   { color: '#90CAF9', fontSize: 15, letterSpacing: 3, fontWeight: '600' },
  colorStrip: { flexDirection: 'row', borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  stripBlock: { width: 32, height: 10 },

  // Profile row
  profileRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  nameBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  nameBtnText:{ color: 'white', fontWeight: '700', fontSize: 14 },
  nameBtnEdit:{ fontSize: 14 },
  streakBadge:{ backgroundColor: '#1565C0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  streakText: { color: 'white', fontSize: 12, fontWeight: '800' },

  // Resume
  resumeBanner: {
    width: '100%', paddingVertical: 14,
    borderRadius: 16, alignItems: 'center',
    shadowColor: '#43A047', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  resumeText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // Game type
  gameTypeRow: { flexDirection: 'row', gap: 12, width: '100%' },
  gameTypeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', gap: 4,
  },
  activeGoldShadow: { shadowColor: '#FFD600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6, borderColor: 'transparent' },
  gameTypeIcon:        { fontSize: 26 },
  gameTypeLabel:       { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  gameTypeLabelActive: { color: '#1A237E' },

  // Mode
  modeRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', gap: 6,
  },
  modeIcon:        { fontSize: 30 },
  modeLabel:       { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  modeLabelActive: { color: '#1A237E' },
  transparentBorder: { borderColor: 'transparent' },

  // Card
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    width: '100%', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A237E' },

  // Count
  countRow: { flexDirection: 'row', gap: 14 },
  countBtn: {
    width: 76, height: 76, borderRadius: 16, borderWidth: 2.5,
    borderColor: '#C5CAE9', alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: '#F5F5F5',
  },
  countNum:        { fontSize: 28, fontWeight: '900', color: '#757575' },
  countNumActive:  { color: 'white' },
  countSub:        { fontSize: 10, color: '#9E9E9E', fontWeight: '600' },
  countSubActive:  { color: 'rgba(255,255,255,0.7)' },
  chipRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  nameInputsWrap:  { width: '100%', gap: 8, marginTop: 8 },
  nameInputRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.6)' },
  nameInputEmoji:  { fontSize: 18 },
  nameInputField:  { flex: 1, fontSize: 15, fontWeight: '700', paddingVertical: 4 },
  chipEmoji:       { fontSize: 14 },
  chipLabel:       { fontSize: 13, fontWeight: '700' },

  // vs CPU
  vsRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vsYouBox:     { alignItems: 'center', gap: 2 },
  vsCpuBox:     { flexDirection: 'row', gap: 8 },
  vsIcon:       { fontSize: 32 },
  vsYouLabel:   { fontSize: 11, fontWeight: '900', color: '#E53935', letterSpacing: 1 },
  vsText:       { fontSize: 20, fontWeight: '900', color: '#9E9E9E' },
  cpuPlayer:    { alignItems: 'center', gap: 2 },
  cpuTag:       { fontSize: 14 },

  // AI difficulty
  diffRow: { flexDirection: 'row', gap: 10 },
  diffBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
    borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', gap: 2,
  },
  diffEmoji: { fontSize: 20 },
  diffLabel: { fontSize: 12, fontWeight: '700', color: '#757575' },
  diffLabelActive: { color: 'white' },

  // Toggles
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', paddingTop: 8 },
  toggleInfo:  { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 14, fontWeight: '800', color: '#1A237E' },
  toggleDesc:  { fontSize: 12, color: '#78909C' },

  // Start button
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 18, paddingHorizontal: 48,
    borderRadius: 50, width: '100%', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 14, elevation: 10,
  },
  startIcon:    { fontSize: 26 },
  startBtnText: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },

  // Snake card
  snakeModeRow:         { flexDirection: 'row', gap: 8, width: '100%' },
  snakeModeBtn:         { flex: 1, paddingVertical: 10, borderRadius: 16, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center' },
  snakeModeTxt:         { fontSize: 13, fontWeight: '800', color: '#757575' },
  snakeModeTxtActive:   { color: 'white' },
  snakeTitle:       { fontSize: 20, fontWeight: '900', color: '#4A148C', textAlign: 'center' },
  snakeDesc:        { fontSize: 14, color: '#5D4037', textAlign: 'center', lineHeight: 22 },
  snakeVsRow:       { flexDirection: 'row', alignItems: 'center', gap: 24, paddingVertical: 8 },
  snakePlayer:      { alignItems: 'center', gap: 4 },
  snakePinBlue:     { fontSize: 36 },
  snakePinRed:      { fontSize: 36 },
  snakePlayerLabel: { fontSize: 14, fontWeight: '900' },
  snakeVsText:      { fontSize: 22, fontWeight: '900', color: '#9E9E9E' },

  // Bottom row
  bottomRow: { flexDirection: 'row', gap: 16 },
  iconBtn: {
    alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16,
  },
  iconBtnEmoji: { fontSize: 26 },
  iconBtnLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },

  footer: { color: '#90CAF9', fontSize: 12, marginBottom: 8 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: 'white', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1A237E', textAlign: 'center' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#37474F' },

  themeRow: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16,
    borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', gap: 4,
  },
  themeBtnActive: { borderColor: '#1A237E', backgroundColor: '#E8EAF6' },
  themeBtnLocked: { opacity: 0.5 },
  themeEmoji: { fontSize: 24 },
  themeLabel: { fontSize: 12, fontWeight: '700', color: '#37474F' },
  themeLock:  { fontSize: 16 },
  themeHint:  { fontSize: 9, color: '#9E9E9E', textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  statBox: {
    width: '45%', alignItems: 'center', backgroundColor: '#F5F5F5',
    borderRadius: 14, paddingVertical: 14, gap: 4,
  },
  statNum: { fontSize: 28, fontWeight: '900', color: '#1A237E' },
  statLbl: { fontSize: 12, color: '#78909C', fontWeight: '600', textAlign: 'center' },

  splitStats: { width: '100%', gap: 8, marginTop: 4 },
  splitRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  splitIcon:  { fontSize: 24 },
  splitInfo:  { flex: 1 },
  splitGame:  { fontSize: 14, fontWeight: '800', color: '#37474F' },
  splitDetail:{ fontSize: 12, color: '#78909C', fontWeight: '600' },

  closeBtn: { paddingVertical: 14, borderRadius: 24, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
