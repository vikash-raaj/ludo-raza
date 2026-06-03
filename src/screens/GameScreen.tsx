import React, { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Board from '../components/Board';
import Dice from '../components/Dice';
import PlayerPanel from '../components/PlayerPanel';

import { Player, ALL_PLAYERS, PLAYER_COLORS, PLAYER_LABELS } from '../constants/players';
import { gameReducer, createInitialState, getValidMoves } from '../logic/gameLogic';
import { getAIMove } from '../logic/aiPlayer';
import { playSound } from '../utils/soundManager';
import { showInterstitialAd } from '../utils/adService';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const BOARD_SIZE = Math.min(SCREEN_W - 8, SCREEN_H * 0.52);

const PLAYER_EMOJI: Record<Player, string> = {
  red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵',
};

interface GameScreenProps {
  players: Player[];
  computerPlayers: Player[];
  onHome: () => void;
}

export default function GameScreen({ players, computerPlayers, onHome }: GameScreenProps) {
  const [state, dispatch] = useReducer(
    gameReducer, null,
    () => createInitialState(players, computerPlayers)
  );

  // ── Countdown overlay: 3 → 2 → 1 → GO! ───────────────────────────────────
  const [countdown, setCountdown] = useState<3 | 2 | 1 | 'GO!' | null>(3);
  const countdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence: Array<3 | 2 | 1 | 'GO!' | null> = [3, 2, 1, 'GO!', null];
    let step = 0;

    const tick = () => {
      const val = sequence[step];
      setCountdown(val);
      countdownAnim.setValue(0);
      Animated.spring(countdownAnim, {
        toValue: 1, useNativeDriver: true, tension: 120, friction: 6,
      }).start();

      if (val === null) return;
      if (val === 'GO!') {
        playSound('countdown_go');
      } else {
        playSound('countdown_beep');
      }
      step++;
      setTimeout(tick, val === 'GO!' ? 700 : 750);
    };

    const t = setTimeout(tick, 100);
    return () => clearTimeout(t);
  }, []);

  const currentPlayer = state.players[state.currentPlayerIdx];
  const isComputerTurn = state.computerPlayers.includes(currentPlayer) && state.phase !== 'gameover';

  const validTokens =
    state.phase === 'selecting' && state.diceValue != null
      ? getValidMoves(state, currentPlayer, state.diceValue)
      : [];

  // Win celebration animation
  const celebrateAnim = useRef(new Animated.Value(0)).current;

  // ── Sound effects ──────────────────────────────────────────────────────────

  // Detect win
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (state.phase === 'gameover' && prevPhaseRef.current !== 'gameover') {
      playSound('win');
      Animated.spring(celebrateAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 5 }).start();
      setTimeout(() => showInterstitialAd(), 2000);
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase]);

  // ── Step animation state ───────────────────────────────────────────────────
  const [animatingToken, setAnimatingToken] = useState<{
    player: Player; tokenIdx: number; visPos: number;
  } | null>(null);

  // ── Capture detection + step-by-step animation (single effect) ────────────
  const isFirstRender = useRef(true);
  const prevTokensRef = useRef(state.tokens);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }

    const prev = prevTokensRef.current;
    prevTokensRef.current = state.tokens;

    // Capture sound: any token that went from on-board to base
    let captured = false;
    for (const p of ALL_PLAYERS) {
      for (let i = 0; i < 4; i++) {
        if (prev[p][i] >= 0 && prev[p][i] < 51 && state.tokens[p][i] === -1) {
          captured = true;
        }
      }
    }
    if (captured) playSound('token_capture');

    // Find the token that moved forward → animate step by step
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
          timers.push(setTimeout(() => {
            setAnimatingToken({ player: p, tokenIdx: i, visPos: step });
          }, s * STEP_MS));
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
    // Wait for any running animation to finish before the AI acts
    if (!isComputerTurn || isAnimating) return;

    const delay = state.phase === 'rolling'
      ? 1200 + Math.random() * 600
      : 900  + Math.random() * 400;

    const timer = setTimeout(() => {
      const s = stateRef.current;
      if (s.phase === 'rolling') {
        playSound('dice_roll');
        dispatch({ type: 'ROLL_DICE' });
      } else if (s.phase === 'selecting') {
        const idx = getAIMove(s);
        if (idx >= 0) {
          playSound('token_move');
          dispatch({ type: 'MOVE_TOKEN', tokenIdx: idx });
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [state.phase, state.currentPlayerIdx, isComputerTurn, isAnimating]);

  // ── Human actions ──────────────────────────────────────────────────────────
  const handleRoll = useCallback(() => {
    if (isComputerTurn || isAnimating) return;
    playSound('dice_roll');
    dispatch({ type: 'ROLL_DICE' });
  }, [isComputerTurn, isAnimating]);

  const handleTokenPress = useCallback((tokenIdx: number) => {
    if (isComputerTurn || isAnimating) return;
    const pos = state.tokens[currentPlayer][tokenIdx];
    playSound(pos === -1 ? 'token_exit' : 'token_move');
    dispatch({ type: 'MOVE_TOKEN', tokenIdx });
  }, [isComputerTurn, isAnimating, state.tokens, currentPlayer]);

  const handleNewGame = useCallback(() => {
    Alert.alert('New Game', 'Start a new game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New Game', onPress: () => {
        // Game-over path already shows an ad via the 2s delayed call; only
        // fire here when the user abandons an in-progress game.
        if (state.phase !== 'gameover') showInterstitialAd();
        celebrateAnim.setValue(0);
        dispatch({ type: 'NEW_GAME', players, computerPlayers });
      }},
    ]);
  }, [players, computerPlayers, state.phase]);

  // ── Labels ─────────────────────────────────────────────────────────────────
  const turnLabel = (): string => {
    const emoji = PLAYER_EMOJI[currentPlayer];
    if (state.phase === 'gameover' && state.winner) {
      return `${PLAYER_EMOJI[state.winner]} ${PLAYER_LABELS[state.winner]} Wins!`;
    }
    if (isComputerTurn) {
      return `${emoji} Computer thinking...`;
    }
    if (state.phase === 'rolling') {
      return `${emoji} Tap the dice!`;
    }
    return `${emoji} Pick a piece!`;
  };

  const playerColor = PLAYER_COLORS[currentPlayer];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onHome}
          style={styles.navBtn}
        >
          <Text style={styles.navTxt}>← Menu</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>🎲 LUDO RAZA</Text>
        <TouchableOpacity onPress={handleNewGame} style={styles.navBtn}>
          <Text style={styles.navTxt}>↺ New</Text>
        </TouchableOpacity>
      </View>

      {/* Top player panels: Green & Yellow */}
      <View style={styles.panelRow}>
        {(['green', 'yellow'] as Player[]).filter(p => players.includes(p)).map(p => (
          <PlayerPanel
            key={p} player={p}
            tokens={state.tokens[p]}
            isActive={currentPlayer === p && state.phase !== 'gameover'}
            isWinner={state.winner === p}
            isComputer={computerPlayers.includes(p)}
          />
        ))}
      </View>

      {/* Board */}
      <View style={styles.boardWrapper}>
        <Board
          state={state}
          validTokens={isAnimating || isComputerTurn ? [] : validTokens}
          onTokenPress={handleTokenPress}
          size={BOARD_SIZE}
          tokenOverride={animatingToken
            ? { player: animatingToken.player, tokenIdx: animatingToken.tokenIdx, pos: animatingToken.visPos }
            : undefined}
        />
      </View>

      {/* Bottom player panels: Red & Blue */}
      <View style={styles.panelRow}>
        {(['red', 'blue'] as Player[]).filter(p => players.includes(p)).map(p => (
          <PlayerPanel
            key={p} player={p}
            tokens={state.tokens[p]}
            isActive={currentPlayer === p && state.phase !== 'gameover'}
            isWinner={state.winner === p}
            isComputer={computerPlayers.includes(p)}
          />
        ))}
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>

        {/* Turn banner */}
        <View style={[styles.turnBanner, { borderColor: playerColor, backgroundColor: playerColor + '22' }]}>
          <Text style={[styles.turnText, { color: playerColor }]}>{turnLabel()}</Text>
          {isComputerTurn && <Text style={styles.thinkingDots}>●●●</Text>}
        </View>

        {/* Dice + action button row */}
        <View style={styles.diceRow}>
          <Dice
            value={state.diceValue}
            size={84}
            canRoll={state.phase === 'rolling' && !isComputerTurn}
            onRoll={handleRoll}
            color={playerColor}
          />

          <View style={styles.actionArea}>
            {state.phase === 'rolling' && !isComputerTurn && (
              <TouchableOpacity
                style={[styles.rollBtn, { backgroundColor: playerColor }]}
                onPress={handleRoll}
                activeOpacity={0.8}
              >
                <Text style={styles.rollBtnIcon}>🎲</Text>
                <Text style={styles.rollBtnTxt}>ROLL!</Text>
              </TouchableOpacity>
            )}

            {state.phase === 'rolling' && isComputerTurn && (
              <View style={[styles.rollBtn, { backgroundColor: '#E0E0E0' }]}>
                <Text style={styles.rollBtnIcon}>🤖</Text>
                <Text style={[styles.rollBtnTxt, { color: '#757575' }]}>Wait…</Text>
              </View>
            )}

            {state.phase === 'selecting' && !isComputerTurn && (
              <View style={[styles.rollBtn, { backgroundColor: playerColor + '33', borderWidth: 2, borderColor: playerColor }]}>
                <Text style={styles.rollBtnIcon}>👆</Text>
                <Text style={[styles.rollBtnTxt, { color: playerColor }]}>
                  Rolled {state.diceValue}!
                </Text>
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
                style={[styles.rollBtn, { backgroundColor: '#FFD600' }]}
                onPress={handleNewGame}
                activeOpacity={0.85}
              >
                <Text style={styles.rollBtnIcon}>🔄</Text>
                <Text style={[styles.rollBtnTxt, { color: '#1A237E' }]}>AGAIN!</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Win celebration */}
        {state.phase === 'gameover' && state.winner && (
          <Animated.View style={[styles.winBanner, {
            opacity: celebrateAnim,
            transform: [{ scale: celebrateAnim.interpolate({ inputRange: [0,1], outputRange: [0.7, 1] }) }],
          }]}>
            <Text style={styles.winEmoji}>🏆</Text>
            <Text style={[styles.winText, { color: PLAYER_COLORS[state.winner] }]}>
              {PLAYER_LABELS[state.winner]} Wins!
            </Text>
            <Text style={styles.winEmoji}>🎉</Text>
          </Animated.View>
        )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A237E' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  navBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  navTxt: { color: '#90CAF9', fontSize: 13, fontWeight: '700' },
  gameTitle: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 2 },

  panelRow: {
    flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 2,
  },

  boardWrapper: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },

  controls: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingBottom: 4, paddingTop: 2, gap: 6,
  },

  // Turn banner
  turnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 24, borderWidth: 2,
  },
  turnText: { fontSize: 15, fontWeight: '800' },
  thinkingDots: { fontSize: 10, color: '#9E9E9E', letterSpacing: 2 },

  // Dice row
  diceRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  actionArea: {},

  rollBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 13, paddingHorizontal: 22, borderRadius: 30,
  },
  rollBtnIcon: { fontSize: 20 },
  rollBtnTxt: { fontSize: 16, fontWeight: '900', color: 'white', letterSpacing: 1.5 },

  // Win celebration
  winBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'white', borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 10,
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  winEmoji: { fontSize: 26 },
  winText: { fontSize: 22, fontWeight: '900' },

  // Countdown overlay
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
});
