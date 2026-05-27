import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Dimensions, Alert, Animated,
} from 'react-native';

import Board from '../components/Board';
import Dice from '../components/Dice';
import PlayerPanel from '../components/PlayerPanel';

import { Player, ALL_PLAYERS, PLAYER_COLORS, PLAYER_LABELS } from '../constants/players';
import { gameReducer, createInitialState, getValidMoves } from '../logic/gameLogic';
import { getAIMove } from '../logic/aiPlayer';
import { playSound } from '../utils/soundManager';

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
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase]);

  // Detect captures: any opponent token that went from on-board (>=0,<51) to base (-1)
  const isFirstRender = useRef(true);
  const prevTokensRef = useRef(state.tokens);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    let captured = false;
    for (const p of ALL_PLAYERS) {
      for (let i = 0; i < 4; i++) {
        if (prevTokensRef.current[p][i] >= 0 &&
            prevTokensRef.current[p][i] < 51 &&
            state.tokens[p][i] === -1) {
          captured = true;
        }
      }
    }
    if (captured) playSound('token_capture');
    prevTokensRef.current = state.tokens;
  }, [state.tokens]);

  // ── AI auto-play ───────────────────────────────────────────────────────────
  // Use a ref so the timeout closure always sees fresh state
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!isComputerTurn) return;

    const delay = state.phase === 'rolling'
      ? 1100 + Math.random() * 600   // 1.1–1.7s to "think" before rolling
      : 700  + Math.random() * 400;  // 0.7–1.1s to "pick" a token

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
  }, [state.phase, state.currentPlayerIdx, isComputerTurn]);

  // ── Human actions ──────────────────────────────────────────────────────────
  const handleRoll = useCallback(() => {
    if (isComputerTurn) return;
    playSound('dice_roll');
    dispatch({ type: 'ROLL_DICE' });
  }, [isComputerTurn]);

  const handleTokenPress = useCallback((tokenIdx: number) => {
    if (isComputerTurn) return;
    // Detect if this is an exit-from-base move
    const pos = state.tokens[currentPlayer][tokenIdx];
    playSound(pos === -1 ? 'token_exit' : 'token_move');
    dispatch({ type: 'MOVE_TOKEN', tokenIdx });
  }, [isComputerTurn, state.tokens, currentPlayer]);

  const handleNewGame = useCallback(() => {
    Alert.alert('New Game', 'Start a new game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New Game', onPress: () => {
        celebrateAnim.setValue(0);
        dispatch({ type: 'NEW_GAME', players, computerPlayers });
      }},
    ]);
  }, [players, computerPlayers]);

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
        <TouchableOpacity onPress={onHome} style={styles.navBtn}>
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
          validTokens={isComputerTurn ? [] : validTokens}
          onTokenPress={handleTokenPress}
          size={BOARD_SIZE}
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
});
