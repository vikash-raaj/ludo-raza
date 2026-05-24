import React, { useReducer, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Dimensions, Alert,
} from 'react-native';

import Board from '../components/Board';
import Dice from '../components/Dice';
import PlayerPanel from '../components/PlayerPanel';

import { Player, ALL_PLAYERS, PLAYER_COLORS, PLAYER_LABELS } from '../constants/players';
import { gameReducer, createInitialState, getValidMoves } from '../logic/gameLogic';

const SCREEN_W = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_W, Dimensions.get('window').height * 0.55);

interface GameScreenProps {
  players: Player[];
  onHome: () => void;
}

export default function GameScreen({ players, onHome }: GameScreenProps) {
  const [state, dispatch] = useReducer(gameReducer, null, () => createInitialState(players));

  const currentPlayer = state.players[state.currentPlayerIdx];
  const validTokens =
    state.phase === 'selecting' && state.diceValue != null
      ? getValidMoves(state, currentPlayer, state.diceValue)
      : [];

  const handleRoll = useCallback(() => {
    dispatch({ type: 'ROLL_DICE' });
  }, []);

  const handleTokenPress = useCallback((tokenIdx: number) => {
    dispatch({ type: 'MOVE_TOKEN', tokenIdx });
  }, []);

  const handleNewGame = useCallback(() => {
    Alert.alert('New Game', 'Start a new game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New Game', onPress: () => dispatch({ type: 'NEW_GAME', players }) },
    ]);
  }, [players]);

  const phaseLabel = () => {
    if (state.phase === 'gameover' && state.winner)
      return `${PLAYER_LABELS[state.winner]} Wins! 🎉`;
    if (state.phase === 'selecting')
      return `${PLAYER_LABELS[currentPlayer]} — tap a token`;
    return `${PLAYER_LABELS[currentPlayer]}'s turn`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onHome} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Menu</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>LUDO RAZA</Text>
        <TouchableOpacity onPress={handleNewGame} style={styles.backBtn}>
          <Text style={styles.backTxt}>New ↺</Text>
        </TouchableOpacity>
      </View>

      {/* Top player panels (Green + Yellow) */}
      <View style={styles.panelRow}>
        {(['green', 'yellow'] as Player[]).filter(p => players.includes(p)).map(p => (
          <PlayerPanel
            key={p} player={p}
            tokens={state.tokens[p]}
            isActive={currentPlayer === p && state.phase !== 'gameover'}
            isWinner={state.winner === p}
          />
        ))}
      </View>

      {/* Board */}
      <View style={styles.boardWrapper}>
        <Board
          state={state}
          validTokens={validTokens}
          onTokenPress={handleTokenPress}
          size={BOARD_SIZE}
        />
      </View>

      {/* Bottom player panels (Red + Blue) */}
      <View style={styles.panelRow}>
        {(['red', 'blue'] as Player[]).filter(p => players.includes(p)).map(p => (
          <PlayerPanel
            key={p} player={p}
            tokens={state.tokens[p]}
            isActive={currentPlayer === p && state.phase !== 'gameover'}
            isWinner={state.winner === p}
          />
        ))}
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        <View style={styles.phaseBox}>
          <Text style={[styles.phaseTxt, { color: PLAYER_COLORS[currentPlayer] }]}>
            {phaseLabel()}
          </Text>
        </View>
        <View style={styles.diceArea}>
          <Dice
            value={state.diceValue}
            size={72}
            canRoll={state.phase === 'rolling'}
            onRoll={handleRoll}
            color={PLAYER_COLORS[currentPlayer]}
          />
          {state.phase === 'rolling' && (
            <TouchableOpacity style={[styles.rollBtn, { backgroundColor: PLAYER_COLORS[currentPlayer] }]} onPress={handleRoll}>
              <Text style={styles.rollBtnTxt}>ROLL</Text>
            </TouchableOpacity>
          )}
          {state.phase === 'gameover' && (
            <TouchableOpacity style={styles.rollBtn} onPress={handleNewGame}>
              <Text style={[styles.rollBtnTxt, { color: '#1A237E' }]}>PLAY AGAIN</Text>
            </TouchableOpacity>
          )}
          {state.phase === 'selecting' && (
            <View style={[styles.rollBtn, { backgroundColor: '#E0E0E0' }]}>
              <Text style={[styles.rollBtnTxt, { color: '#757575' }]}>
                Rolled {state.diceValue}
              </Text>
            </View>
          )}
        </View>
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
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  backTxt: { color: '#90CAF9', fontSize: 13, fontWeight: '600' },
  gameTitle: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  panelRow: {
    flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 2,
  },
  boardWrapper: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8,
  },
  controls: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingBottom: 4,
  },
  phaseBox: { marginBottom: 6 },
  phaseTxt: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  diceArea: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rollBtn: {
    paddingVertical: 12, paddingHorizontal: 24, borderRadius: 28,
    backgroundColor: '#FFD600',
  },
  rollBtnTxt: { fontSize: 14, fontWeight: '900', color: 'white', letterSpacing: 2 },
});
