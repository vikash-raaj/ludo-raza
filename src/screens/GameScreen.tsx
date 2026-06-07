import React, { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Board from '../components/Board';
import Dice from '../components/Dice';
import PlayerPanel from '../components/PlayerPanel';
import WinOverlay from '../components/WinOverlay';
import ThinkingDots from '../components/ThinkingDots';
import EmojiReaction from '../components/EmojiReaction';
import MathChallengeModal from '../components/MathChallengeModal';

import { Player, ALL_PLAYERS, PLAYER_COLORS, PLAYER_LABELS } from '../constants/players';
import { AppTheme } from '../constants/themes';
import { LUDO_FACTS, WIN_TIPS, LOSS_TIPS } from '../constants/learningContent';
import { gameReducer, createInitialState, getValidMoves, WIN_POS } from '../logic/gameLogic';
import { getAIMove, AIDifficulty } from '../logic/aiPlayer';
import { playSound } from '../utils/soundManager';
import { showInterstitialAd } from '../utils/adService';
import { saveLudoGame, clearLudoGame, recordWin, recordLoss, incrementCaptures, incrementMathCorrect } from '../utils/storage';
import { GameState } from '../types';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const BOARD_SIZE = Math.min(SCREEN_W - 8, SCREEN_H * 0.52);

const PLAYER_EMOJI: Record<Player, string> = {
  red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵',
};

interface GameScreenProps {
  players: Player[];
  computerPlayers: Player[];
  playerName: string;
  theme: AppTheme;
  quickMode?: boolean;
  mathMode?: boolean;
  soundOn?: boolean;
  aiDifficulty?: AIDifficulty;
  tokenShape?: import('../utils/storage').TokenShape;
  friendPlayerNames?: Partial<Record<Player, string>>;
  initialState?: GameState | null;
  onHome: () => void;
  onWin?: () => void;
}

export default function GameScreen({
  players, computerPlayers, playerName, theme,
  quickMode = false, mathMode = false, soundOn = true,
  aiDifficulty = 'medium', tokenShape = 'pin',
  friendPlayerNames = {},
  initialState, onHome, onWin,
}: GameScreenProps) {

  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    () => initialState ?? createInitialState(players, computerPlayers, quickMode),
  );

  // ── Countdown 3→2→1→GO! ────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState<3 | 2 | 1 | 'GO!' | null>(3);
  const [ludoFact,  setLudoFact]  = useState('');
  const [showFact,  setShowFact]  = useState(false);
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const factOpacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fact = LUDO_FACTS[Math.floor(Math.random() * LUDO_FACTS.length)];
    setLudoFact(fact);

    const sequence: Array<3 | 2 | 1 | 'GO!' | null> = [3, 2, 1, 'GO!', null];
    let step = 0;

    const tick = () => {
      const val = sequence[step];
      setCountdown(val);
      countdownAnim.setValue(0);
      Animated.spring(countdownAnim, {
        toValue: 1, useNativeDriver: true, tension: 120, friction: 6,
      }).start();

      if (val === null) {
        // Show fact after countdown
        setShowFact(true);
        Animated.sequence([
          Animated.timing(factOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.delay(2200),
          Animated.timing(factOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start(() => setShowFact(false));
        return;
      }
      if (val === 'GO!') { if (soundOn) playSound('countdown_go'); }
      else               { if (soundOn) playSound('countdown_beep'); }
      step++;
      setTimeout(tick, val === 'GO!' ? 700 : 750);
    };

    const t = setTimeout(tick, 100);
    return () => clearTimeout(t);
  }, []);

  // ── Dice spinning state ────────────────────────────────────────────────────
  const [isDiceSpinning, setIsDiceSpinning] = useState(false);

  const currentPlayer  = state.players[state.currentPlayerIdx];
  const isComputerTurn = state.computerPlayers.includes(currentPlayer) && state.phase !== 'gameover';

  // ── Math challenge ─────────────────────────────────────────────────────────
  const [showMath, setShowMath] = useState(false);
  const prevPhaseRef2 = useRef(state.phase);
  useEffect(() => {
    const prev = prevPhaseRef2.current;
    prevPhaseRef2.current = state.phase;
    if (
      mathMode && !isComputerTurn &&
      state.phase === 'selecting' && prev === 'rolling' &&
      !isDiceSpinning
    ) {
      setShowMath(true);
    }
  }, [state.phase, isComputerTurn, isDiceSpinning, mathMode]);

  const handleMathResult = useCallback((correct: boolean) => {
    setShowMath(false);
    if (correct) {
      incrementMathCorrect().catch(() => {});
    } else {
      dispatch({ type: 'SKIP_TURN' });
    }
  }, []);

  const validTokens =
    state.phase === 'selecting' && state.diceValue != null
      ? getValidMoves(state, currentPlayer, state.diceValue)
      : [];

  // ── Emoji reaction ─────────────────────────────────────────────────────────
  const [flyingEmoji, setFlyingEmoji] = useState<string | null>(null);
  const emojiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleEmojiPress = useCallback((emoji: string) => {
    if (emojiTimer.current) clearTimeout(emojiTimer.current);
    setFlyingEmoji(emoji);
    emojiTimer.current = setTimeout(() => setFlyingEmoji(null), 1200);
  }, []);

  // ── Win celebration ────────────────────────────────────────────────────────
  const [winTip, setWinTip] = useState('');
  const prevPhaseRef = useRef(state.phase);

  useEffect(() => {
    if (state.phase === 'gameover' && prevPhaseRef.current !== 'gameover') {
      if (soundOn) playSound('win');
      const isHumanWinner = state.winner && !state.computerPlayers.includes(state.winner);
      const pool = isHumanWinner ? WIN_TIPS : LOSS_TIPS;
      setWinTip(pool[Math.floor(Math.random() * pool.length)]);

      if (isHumanWinner) {
        recordWin().catch(() => {});
        onWin?.();
      } else {
        recordLoss().catch(() => {});
      }
      clearLudoGame().catch(() => {});
      setTimeout(() => showInterstitialAd(), 2000);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase]);

  // ── Step animation ─────────────────────────────────────────────────────────
  const [animatingToken, setAnimatingToken] = useState<{
    player: Player; tokenIdx: number; visPos: number;
  } | null>(null);

  const [newlyHomedPlayer, setNewlyHomedPlayer] = useState<Player | null>(null);

  const isFirstRender = useRef(true);
  const prevTokensRef = useRef(state.tokens);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }

    const prev = prevTokensRef.current;
    prevTokensRef.current = state.tokens;

    let captured = false;
    for (const p of ALL_PLAYERS) {
      for (let i = 0; i < 4; i++) {
        if (prev[p][i] >= 0 && prev[p][i] < 51 && state.tokens[p][i] === -1) captured = true;
      }
    }
    if (captured && soundOn) playSound('token_capture');
    if (captured) incrementCaptures().catch(() => {});

    // Detect token reaching home (WIN_POS)
    for (const p of ALL_PLAYERS) {
      for (let i = 0; i < 4; i++) {
        if (prev[p][i] !== WIN_POS && state.tokens[p][i] === WIN_POS) {
          setNewlyHomedPlayer(p);
          setTimeout(() => setNewlyHomedPlayer(null), 700);
        }
      }
    }

    for (const p of ALL_PLAYERS) {
      for (let i = 0; i < 4; i++) {
        const oldPos = prev[p][i];
        const newPos = state.tokens[p][i];
        const isForward = (oldPos >= 0 && newPos > oldPos) || (oldPos === -1 && newPos === 0);
        if (!isForward) continue;

        const steps: number[] = [];
        const start = oldPos === -1 ? 0 : oldPos + 1;
        for (let pos = start; pos <= newPos; pos++) steps.push(pos);
        if (steps.length === 0) continue;

        const STEP_MS = 180;
        setAnimatingToken({ player: p, tokenIdx: i, visPos: steps[0] });

        const timers: ReturnType<typeof setTimeout>[] = [];
        for (let s = 1; s < steps.length; s++) {
          const step = steps[s];
          timers.push(setTimeout(() => setAnimatingToken({ player: p, tokenIdx: i, visPos: step }), s * STEP_MS));
        }
        timers.push(setTimeout(() => setAnimatingToken(null), steps.length * STEP_MS));
        return () => timers.forEach(clearTimeout);
      }
    }
  }, [state.tokens]);

  const isAnimating = animatingToken !== null;

  // ── AI auto-play ───────────────────────────────────────────────────────────
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!isComputerTurn || isAnimating) return;

    const delay = state.phase === 'rolling'
      ? 1200 + Math.random() * 600
      : 900  + Math.random() * 400;

    const timer = setTimeout(() => {
      const s = stateRef.current;
      if (s.phase === 'rolling') {
        if (soundOn) playSound('dice_roll');
        setIsDiceSpinning(true);
        setTimeout(() => {
          dispatch({ type: 'ROLL_DICE' });
          setIsDiceSpinning(false);
        }, 500);
      } else if (s.phase === 'selecting') {
        const idx = getAIMove(s, aiDifficulty);
        if (idx >= 0) {
          if (soundOn) playSound('token_move');
          dispatch({ type: 'MOVE_TOKEN', tokenIdx: idx });
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [state.phase, state.currentPlayerIdx, isComputerTurn, isAnimating]);

  // ── Human actions ──────────────────────────────────────────────────────────
  const handleRoll = useCallback(() => {
    if (isComputerTurn || isAnimating || isDiceSpinning || state.phase !== 'rolling') return;
    setIsDiceSpinning(true);
    if (soundOn) playSound('dice_roll');
    setTimeout(() => {
      dispatch({ type: 'ROLL_DICE' });
      setIsDiceSpinning(false);
    }, 550);
  }, [isComputerTurn, isAnimating, isDiceSpinning, state.phase, soundOn]);

  const handleTokenPress = useCallback((tokenIdx: number) => {
    if (isComputerTurn || isAnimating || showMath) return;
    const pos = state.tokens[currentPlayer][tokenIdx];
    if (soundOn) playSound(pos === -1 ? 'token_exit' : 'token_move');
    dispatch({ type: 'MOVE_TOKEN', tokenIdx });
  }, [isComputerTurn, isAnimating, showMath, state.tokens, currentPlayer, soundOn]);

  // Save state when leaving an in-progress game
  const handleHome = useCallback(() => {
    if (state.phase === 'gameover') { onHome(); return; }
    Alert.alert('Leave Game', 'Save progress and exit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save & Exit', onPress: () => { saveLudoGame(state).catch(() => {}); onHome(); } },
      { text: 'Quit Without Saving', style: 'destructive', onPress: () => { clearLudoGame().catch(() => {}); onHome(); } },
    ]);
  }, [state, onHome]);

  const handleNewGame = useCallback(() => {
    Alert.alert('New Game', 'Start a new game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New Game', onPress: () => {
        if (state.phase !== 'gameover') showInterstitialAd();
        clearLudoGame().catch(() => {});
        dispatch({ type: 'NEW_GAME', players, computerPlayers, quickMode });
      }},
    ]);
  }, [players, computerPlayers, state.phase, quickMode]);

  // ── Labels ─────────────────────────────────────────────────────────────────
  // Resolve a display name for any player:
  //   1. friendPlayerNames override (set in Friends mode)
  //   2. playerName for Red in computer mode
  //   3. colour label fallback
  const getDisplayName = (p: Player): string => {
    if (friendPlayerNames[p]) return friendPlayerNames[p]!;
    if (p === 'red' && !computerPlayers.includes('red') && playerName) return playerName;
    return PLAYER_LABELS[p];
  };

  const turnLabel = (): string => {
    const emoji = PLAYER_EMOJI[currentPlayer];
    if (state.phase === 'gameover' && state.winner) {
      return `${PLAYER_EMOJI[state.winner]} ${getDisplayName(state.winner)} Wins!`;
    }
    if (isComputerTurn) return `${emoji} Computer thinking...`;
    if (state.phase === 'rolling') return `${emoji} Tap the dice!`;
    return `${emoji} Pick a piece!`;
  };

  const playerColor = PLAYER_COLORS[currentPlayer];

  const winnerIsHuman = !!state.winner && !computerPlayers.includes(state.winner);
  const winnerDisplayName = state.winner ? getDisplayName(state.winner) : '';

  return (
    <LinearGradient colors={theme.gradient as any} style={styles.fill}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleHome} style={styles.navBtn}>
            <Text style={styles.navTxt}>← Menu</Text>
          </TouchableOpacity>
          <Text style={styles.gameTitle}>🎲 LUDO RAZA</Text>
          <TouchableOpacity onPress={handleNewGame} style={styles.navBtn}>
            <Text style={styles.navTxt}>↺ New</Text>
          </TouchableOpacity>
        </View>

        {/* Top panels: Green & Yellow */}
        <View style={styles.panelRow}>
          {(['green', 'yellow'] as Player[]).filter(p => players.includes(p)).map(p => (
            <PlayerPanel
              key={p} player={p}
              tokens={state.tokens[p]}
              isActive={currentPlayer === p && state.phase !== 'gameover'}
              isWinner={state.winner === p}
              isComputer={computerPlayers.includes(p)}
              displayName={!computerPlayers.includes(p) ? getDisplayName(p) : undefined}
            />
          ))}
        </View>

        {/* Board */}
        <View style={styles.boardWrapper}>
          <Board
            state={state}
            validTokens={isAnimating || isComputerTurn || showMath ? [] : validTokens}
            onTokenPress={handleTokenPress}
            size={BOARD_SIZE}
            theme={theme}
            tokenShape={tokenShape}
            newlyHomedPlayer={newlyHomedPlayer}
            tokenOverride={animatingToken
              ? { player: animatingToken.player, tokenIdx: animatingToken.tokenIdx, pos: animatingToken.visPos }
              : undefined}
          />
        </View>

        {/* Bottom panels: Red & Blue */}
        <View style={styles.panelRow}>
          {(['red', 'blue'] as Player[]).filter(p => players.includes(p)).map(p => (
            <PlayerPanel
              key={p} player={p}
              tokens={state.tokens[p]}
              isActive={currentPlayer === p && state.phase !== 'gameover'}
              isWinner={state.winner === p}
              isComputer={computerPlayers.includes(p)}
              displayName={!computerPlayers.includes(p) ? getDisplayName(p) : undefined}
            />
          ))}
        </View>

        {/* Controls */}
        <View style={styles.controls}>

          {/* Turn banner */}
          <View style={[styles.turnBanner, { borderColor: playerColor, backgroundColor: playerColor + '22' }]}>
            <Text style={[styles.turnText, { color: playerColor }]}>{turnLabel()}</Text>
            {isComputerTurn && <ThinkingDots color={playerColor} />}
          </View>

          {/* Dice + button */}
          <View style={styles.diceRow}>
            <Dice
              value={state.diceValue}
              size={84}
              canRoll={state.phase === 'rolling' && !isComputerTurn}
              onRoll={handleRoll}
              color={playerColor}
              spinning={isDiceSpinning}
            />

            <View style={styles.actionArea}>
              {state.phase === 'rolling' && !isComputerTurn && !isDiceSpinning && (
                <TouchableOpacity
                  style={[styles.rollBtn, { backgroundColor: playerColor }]}
                  onPress={handleRoll}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rollBtnIcon}>🎲</Text>
                  <Text style={styles.rollBtnTxt}>ROLL!</Text>
                </TouchableOpacity>
              )}

              {(isDiceSpinning || (state.phase === 'rolling' && isComputerTurn)) && (
                <View style={[styles.rollBtn, { backgroundColor: '#E0E0E0' }]}>
                  <Text style={styles.rollBtnIcon}>{isDiceSpinning && !isComputerTurn ? '🎲' : '🤖'}</Text>
                  <Text style={[styles.rollBtnTxt, { color: '#757575' }]}>
                    {isDiceSpinning && !isComputerTurn ? 'Rolling…' : 'Wait…'}
                  </Text>
                </View>
              )}

              {state.phase === 'selecting' && !isComputerTurn && !showMath && (
                <View style={[styles.rollBtn, { backgroundColor: playerColor + '33', borderWidth: 2, borderColor: playerColor }]}>
                  <Text style={styles.rollBtnIcon}>👆</Text>
                  <Text style={[styles.rollBtnTxt, { color: playerColor }]}>Rolled {state.diceValue}!</Text>
                </View>
              )}

              {state.phase === 'selecting' && isComputerTurn && (
                <View style={[styles.rollBtn, { backgroundColor: '#E0E0E0' }]}>
                  <Text style={styles.rollBtnIcon}>🤖</Text>
                  <Text style={[styles.rollBtnTxt, { color: '#757575' }]}>Picking…</Text>
                </View>
              )}

              {state.phase === 'gameover' && (
                <TouchableOpacity
                  style={[styles.rollBtn, { backgroundColor: theme.accent }]}
                  onPress={handleNewGame}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rollBtnIcon}>🔄</Text>
                  <Text style={[styles.rollBtnTxt, { color: '#1A237E' }]}>AGAIN!</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Emoji reactions */}
          <EmojiReaction flyingEmoji={flyingEmoji} onEmojiPress={handleEmojiPress} />
        </View>

        {/* Countdown overlay */}
        {countdown !== null && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Animated.Text style={[
              styles.countdownText,
              countdown === 'GO!' ? styles.countdownGo : styles.countdownNum,
              {
                transform: [{
                  scale: countdownAnim.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0.3, 1.15, 1],
                  }),
                }],
                opacity: countdownAnim,
              },
            ]}>
              {countdown}
            </Animated.Text>
          </View>
        )}

        {/* Ludo history fact */}
        {showFact && (
          <Animated.View style={[styles.factBanner, { opacity: factOpacity }]} pointerEvents="none">
            <Text style={styles.factText}>📜 {ludoFact}</Text>
          </Animated.View>
        )}

        {/* Math challenge */}
        <MathChallengeModal
          visible={showMath}
          diceValue={state.diceValue}
          onResult={handleMathResult}
        />

        {/* Full-screen win overlay */}
        {state.phase === 'gameover' && state.winner && (
          <WinOverlay
            winnerName={winnerDisplayName}
            winnerColor={PLAYER_COLORS[state.winner]}
            isHuman={winnerIsHuman}
            tip={winTip}
            onPlayAgain={handleNewGame}
            onMenu={onHome}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  navBtn:    { paddingHorizontal: 8, paddingVertical: 6 },
  navTxt:    { color: '#90CAF9', fontSize: 13, fontWeight: '700' },
  gameTitle: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 2 },

  panelRow: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 2 },

  boardWrapper: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },

  controls: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingBottom: 4, paddingTop: 2, gap: 6,
  },

  turnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 24, borderWidth: 2,
  },
  turnText: { fontSize: 15, fontWeight: '800' },

  diceRow:    { flexDirection: 'row', alignItems: 'center', gap: 18 },
  actionArea: {},

  rollBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 22, borderRadius: 30,
  },
  rollBtnIcon: { fontSize: 20 },
  rollBtnTxt:  { fontSize: 16, fontWeight: '900', color: 'white', letterSpacing: 1.5 },

  // Countdown
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  countdownText: {
    fontWeight: '900', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 4 },
  },
  countdownNum: { fontSize: 140, color: '#FFD600' },
  countdownGo:  { fontSize: 90,  color: '#69F0AE' },

  // Ludo fact banner
  factBanner: {
    position: 'absolute',
    bottom: 160,
    left: 16, right: 16,
    backgroundColor: 'rgba(26,35,126,0.92)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  factText: { color: 'white', fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
