import React, { useState, useEffect } from 'react';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Player } from './src/constants/players';
import { THEMES, ThemeName, AppTheme } from './src/constants/themes';
import { GameState } from './src/types';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import SnakeLadderScreen from './src/screens/SnakeLadderScreen';
import DailyRewardModal from './src/components/DailyRewardModal';
import TutorialModal from './src/components/TutorialModal';
import AchievementToast from './src/components/AchievementToast';

import { initSounds, playSound, setHapticsEnabled } from './src/utils/soundManager';
import { initAds } from './src/utils/adService';
import * as StoreReview from 'expo-store-review';
import {
  getPlayerName, setPlayerName,
  getWinStats, WinStats,
  checkDailyLogin,
  getBoardTheme, setBoardTheme,
  getUnlockedThemes, unlockTheme,
  getSoundOn, setSoundOn,
  getHapticsOn, setHapticsOn,
  getAIDifficulty, setAIDifficulty, AIDifficulty,
  getTokenShape, setTokenShape, TokenShape,
  isTutorialDone, markTutorialDone,
  getEarnedAchievements, grantAchievements,
  getMathCorrect, getCaptures, getSnakeWins, recordSnakeWin,
  saveLudoGame, loadLudoGame, clearLudoGame,
} from './src/utils/storage';
import { Achievement, checkAchievements } from './src/constants/achievements';

type Screen = 'home' | 'ludo' | 'snake';

export default function App() {
  // ── Navigation ─────────────────────────────────────────────────────────────
  const [screen,          setScreen]          = useState<Screen>('home');
  const [players,         setPlayers]         = useState<Player[]>(['red', 'green', 'yellow', 'blue']);
  const [computerPlayers, setComputerPlayers] = useState<Player[]>([]);
  const [quickMode,       setQuickMode]       = useState(false);
  const [mathMode,        setMathMode]        = useState(false);
  const [friendPlayerNames, setFriendPlayerNames] = useState<Partial<Record<Player, string>>>({});

  // ── Profile & Preferences ──────────────────────────────────────────────────
  const [playerName,    setPlayerNameState]   = useState('');
  const [theme,         setThemeState]        = useState<AppTheme>(THEMES.classic);
  const [unlockedThemes, setUnlockedThemes]   = useState<ThemeName[]>(['classic']);
  const [winStats,      setWinStats]          = useState<WinStats>({ streak: 0, total: 0, played: 0, ludoWins: 0, ludoPlayed: 0, snakeWinsCount: 0, snakePlayed: 0 });
  const [soundOn,       setSoundOnState]      = useState(true);
  const [hapticsOn,     setHapticsOnState]    = useState(true);
  const [aiDifficulty,  setAiDifficultyState] = useState<AIDifficulty>('medium');
  const [tokenShape,    setTokenShapeState]   = useState<TokenShape>('pin');

  // ── Onboarding & Daily Reward ──────────────────────────────────────────────
  const [showNameModal,   setShowNameModal]   = useState(false);
  const [nameInput,       setNameInput]       = useState('');
  const [dailyReward,     setDailyReward]     = useState(false);
  const [loginStreak,     setLoginStreak]     = useState(1);

  // ── Tutorial ───────────────────────────────────────────────────────────────
  const [showTutorial,    setShowTutorial]    = useState(false);
  const [tutorialType,    setTutorialType]    = useState<'ludo' | 'snake'>('ludo');

  // ── Achievements ───────────────────────────────────────────────────────────
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null);
  const achievementQueue = React.useRef<Achievement[]>([]);

  // ── Save/Resume ────────────────────────────────────────────────────────────
  const [savedLudoState,  setSavedLudoState]  = useState<GameState | null>(null);
  const [hasSavedGame,    setHasSavedGame]    = useState(false);

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const boot = async () => {
      await Promise.all([
        initSounds().catch(() => {}),
        initAds().catch(() => {}),
      ]);

      const [
        name, themeName, unlocked, stats, sound, haptics, diff, shape, saved, login, tutDone,
      ] = await Promise.all([
        getPlayerName(),
        getBoardTheme(),
        getUnlockedThemes(),
        getWinStats(),
        getSoundOn(),
        getHapticsOn(),
        getAIDifficulty(),
        getTokenShape(),
        loadLudoGame(),
        checkDailyLogin(),
        isTutorialDone(),
      ]);

      setPlayerNameState(name);
      setUnlockedThemes(unlocked as ThemeName[]);
      setThemeState(THEMES[themeName as ThemeName] ?? THEMES.classic);
      setWinStats(stats);
      setSoundOnState(sound);
      setHapticsOnState(haptics);
      setHapticsEnabled(haptics);
      setAiDifficultyState(diff);
      setTokenShapeState(shape as TokenShape);
      setSavedLudoState(saved);
      setHasSavedGame(!!saved);

      if (!name) {
        setShowNameModal(true);
      }

      if (!tutDone && name) {
        // Show Ludo tutorial on first launch (after name is set)
        setTimeout(() => { setTutorialType('ludo'); setShowTutorial(true); }, 600);
      }

      if (login.isNew) {
        const streak = login.loginStreak;
        setLoginStreak(streak);
        // Unlock themes by streak
        if (streak >= 3) { await unlockTheme('forest'); }
        if (streak >= 7) { await unlockTheme('night'); }
        const freshUnlocked = await getUnlockedThemes();
        setUnlockedThemes(freshUnlocked as ThemeName[]);

        // Check login-streak achievements on each new day login
        const earned = await getEarnedAchievements().catch(() => [] as string[]);
        const loginAchievements = checkAchievements({
          totalWins: stats.total, winStreak: stats.streak,
          loginStreak: streak, gamesPlayed: stats.played,
          mathCorrect: 0, captures: 0, snakeWins: 0, earned,
        });
        if (loginAchievements.length > 0) {
          grantAchievements(loginAchievements.map(a => a.id)).catch(() => {});
          // Delay toast until after the daily reward modal
          setTimeout(() => triggerAchievements(loginAchievements), 2500);
        }

        // Show reward modal after short delay (after any name modal)
        setTimeout(() => setDailyReward(true), name ? 400 : 1000);
      }
    };
    boot();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    const trimmed = nameInput.trim() || 'Player';
    await setPlayerName(trimmed);
    setPlayerNameState(trimmed);
    setNameInput('');
    setShowNameModal(false);
  };

  const handleThemeChange = async (t: ThemeName) => {
    setThemeState(THEMES[t]);
    await setBoardTheme(t);
  };

  const handleSoundToggle = async (on: boolean) => {
    setSoundOnState(on);
    await setSoundOn(on);
  };

  const handleTokenShape = async (s: TokenShape) => {
    setTokenShapeState(s);
    await setTokenShape(s);
  };

  const handleHapticsToggle = async (on: boolean) => {
    setHapticsOnState(on);
    setHapticsEnabled(on);
    await setHapticsOn(on);
  };

  const handleAiDiff = async (d: AIDifficulty) => {
    setAiDifficultyState(d);
    await setAIDifficulty(d);
  };

  const handleStartLudo = (
    selected: Player[], computers: Player[], quick: boolean, math: boolean,
    names: Partial<Record<Player, string>> = {},
  ) => {
    if (soundOn) playSound('game_start');
    setPlayers(selected);
    setFriendPlayerNames(names);
    setComputerPlayers(computers);
    setQuickMode(quick);
    setMathMode(math);
    // Clear any existing saved game when starting fresh
    clearLudoGame().catch(() => {});
    setSavedLudoState(null);
    setHasSavedGame(false);
    setScreen('ludo');
  };

  const handleResumeLudo = () => {
    if (!savedLudoState) return;
    if (soundOn) playSound('game_start');
    // Restore player config from saved state
    setPlayers(savedLudoState.players);
    setComputerPlayers(savedLudoState.computerPlayers);
    setQuickMode(savedLudoState.quickMode ?? false);
    setMathMode(false);
    setScreen('ludo');
  };

  const [snakeTwoPlayer, setSnakeTwoPlayer] = useState(false);

  const handleStartSnake = (math: boolean, twoP: boolean) => {
    if (soundOn) playSound('game_start');
    setMathMode(math);
    setSnakeTwoPlayer(twoP);
    setScreen('snake');
  };

  const handleGameHome = () => {
    setScreen('home');
    // Refresh stats and saved game status
    getWinStats().then(setWinStats).catch(() => {});
    loadLudoGame().then(s => { setSavedLudoState(s); setHasSavedGame(!!s); }).catch(() => {});
  };

  const triggerAchievements = (newOnes: Achievement[]) => {
    if (newOnes.length === 0) return;
    achievementQueue.current.push(...newOnes);
    if (!pendingAchievement) {
      setPendingAchievement(achievementQueue.current.shift()!);
    }
  };

  const handleAchievementDone = () => {
    const next = achievementQueue.current.shift() ?? null;
    setPendingAchievement(next);
  };

  const handleWin = async (isSnake = false) => {
    const [stats, earned, mathCorrect, captures, snakeWins] = await Promise.all([
      getWinStats().catch(() => null),
      getEarnedAchievements().catch(() => [] as string[]),
      getMathCorrect().catch(() => 0),
      getCaptures().catch(() => 0),
      isSnake ? recordSnakeWin().catch(() => 0) : getSnakeWins().catch(() => 0),
    ]);

    if (stats) {
      setWinStats(stats);
      const login = await checkDailyLogin().catch(() => ({ loginStreak: 1 }));
      const newOnes = checkAchievements({
        totalWins: stats.total, winStreak: stats.streak,
        loginStreak: login.loginStreak, gamesPlayed: stats.played,
        mathCorrect, captures, snakeWins, earned,
      });
      if (newOnes.length > 0) {
        grantAchievements(newOnes.map(a => a.id)).catch(() => {});
        triggerAchievements(newOnes);
      }
      // Prompt for review every 3rd win
      if (stats.total > 0 && stats.total % 3 === 0) {
        const isAvailable = await StoreReview.isAvailableAsync().catch(() => false);
        if (isAvailable) StoreReview.requestReview().catch(() => {});
      }
    }
  };

  return (
    <SafeAreaProvider>
      {screen === 'ludo' ? (
        <GameScreen
          players={players}
          computerPlayers={computerPlayers}
          playerName={playerName}
          theme={theme}
          quickMode={quickMode}
          mathMode={mathMode}
          soundOn={soundOn}
          aiDifficulty={aiDifficulty}
          tokenShape={tokenShape}
          friendPlayerNames={friendPlayerNames}
          initialState={savedLudoState}
          onHome={handleGameHome}
          onWin={() => handleWin(false)}
        />
      ) : screen === 'snake' ? (
        <SnakeLadderScreen
          onHome={handleGameHome}
          playerName={playerName}
          theme={theme}
          soundOn={soundOn}
          mathMode={mathMode}
          twoPlayer={snakeTwoPlayer}
          onWin={() => handleWin(true)}
        />
      ) : (
        <HomeScreen
          playerName={playerName}
          theme={theme}
          unlockedThemes={unlockedThemes}
          winStats={winStats}
          hasSavedGame={hasSavedGame}
          soundOn={soundOn}
          hapticsOn={hapticsOn}
          aiDifficulty={aiDifficulty}
          tokenShape={tokenShape}
          onStartLudo={handleStartLudo}
          onStartSnake={handleStartSnake}
          onResumeLudo={handleResumeLudo}
          onThemeChange={handleThemeChange}
          onSoundToggle={handleSoundToggle}
          onHapticsToggle={handleHapticsToggle}
          onTokenShapeChange={handleTokenShape}
          onAiDiffChange={handleAiDiff}
          onNameEdit={() => { setNameInput(playerName); setShowNameModal(true); }}
        />
      )}

      {/* ── Player name onboarding / edit modal ──────────────────────── */}
      <Modal visible={showNameModal} transparent animationType="fade" statusBarTranslucent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.nameCard}>
            <Text style={styles.nameEmoji}>👤</Text>
            <Text style={styles.nameTitle}>What's your name?</Text>
            <Text style={styles.nameSubtitle}>This will be shown in the game</Text>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name…"
              placeholderTextColor="#B0BEC5"
              maxLength={16}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity style={styles.nameBtn} onPress={handleSaveName} activeOpacity={0.85}>
              <Text style={styles.nameBtnText}>LET'S PLAY! 🎲</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Daily reward modal ────────────────────────────────────────── */}
      <DailyRewardModal
        visible={dailyReward}
        streak={loginStreak}
        onClose={() => setDailyReward(false)}
      />

      {/* ── How-to-play tutorial (first launch only) ─────────────────── */}
      <TutorialModal
        visible={showTutorial}
        gameType={tutorialType}
        onClose={() => { setShowTutorial(false); markTutorialDone().catch(() => {}); }}
      />

      {/* ── Achievement toast ─────────────────────────────────────────── */}
      <AchievementToast
        achievement={pendingAchievement}
        onDone={handleAchievementDone}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  nameCard: {
    backgroundColor: 'white', borderRadius: 28,
    padding: 28, alignItems: 'center', gap: 12, width: '100%',
    shadowColor: '#1A237E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 20,
  },
  nameEmoji:    { fontSize: 56 },
  nameTitle:    { fontSize: 26, fontWeight: '900', color: '#1A237E' },
  nameSubtitle: { fontSize: 14, color: '#78909C', textAlign: 'center' },
  nameInput: {
    width: '100%', borderWidth: 2, borderColor: '#C5CAE9',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
    fontSize: 18, fontWeight: '700', color: '#1A237E',
    backgroundColor: '#F5F7FF',
  },
  nameBtn: {
    backgroundColor: '#1A237E', paddingVertical: 16,
    paddingHorizontal: 32, borderRadius: 30, width: '100%',
    alignItems: 'center', marginTop: 4,
  },
  nameBtnText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
});
