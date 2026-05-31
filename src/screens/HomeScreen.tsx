import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Player } from '../constants/players';

type GameMode = 'friends' | 'computer';
type GameType = 'ludo' | 'snake';

interface HomeScreenProps {
  onStartLudo:  (players: Player[], computerPlayers: Player[]) => void;
  onStartSnake: () => void;
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

export default function HomeScreen({ onStartLudo, onStartSnake }: HomeScreenProps) {
  const [gameType, setGameType] = useState<GameType>('ludo');
  const [mode, setMode]         = useState<GameMode>('friends');
  const [count, setCount]       = useState<2 | 3 | 4>(4);
  const [cpuCount, setCpuCount] = useState<1 | 2 | 3>(1);

  const handleStartLudo = () => {
    if (mode === 'computer') {
      const { players, cpu } = VS_CPU_CONFIGS[cpuCount];
      onStartLudo(players, cpu);
    } else {
      onStartLudo(FRIENDS_CONFIGS[count], []);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.diceEmoji}>🎲</Text>
          <Text style={styles.title}>LUDO RAZA</Text>
          <Text style={styles.subtitle}>Roll • Move • Win!</Text>
          <View style={styles.colorStrip}>
            {(['red','green','yellow','blue'] as Player[]).map(p => (
              <View key={p} style={[styles.stripBlock, { backgroundColor: COLOR_MAP[p].color }]} />
            ))}
          </View>
        </View>

        {/* ── Game type selector ───────────────────────────────────────── */}
        <View style={styles.gameTypeRow}>
          <TouchableOpacity
            style={[styles.gameTypeBtn, gameType === 'ludo' && styles.gameTypeBtnActive]}
            onPress={() => setGameType('ludo')}
            activeOpacity={0.8}
          >
            <Text style={styles.gameTypeIcon}>🎲</Text>
            <Text style={[styles.gameTypeLabel, gameType === 'ludo' && styles.gameTypeLabelActive]}>
              Ludo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gameTypeBtn, gameType === 'snake' && styles.gameTypeBtnActive]}
            onPress={() => setGameType('snake')}
            activeOpacity={0.8}
          >
            <Text style={styles.gameTypeIcon}>🐍</Text>
            <Text style={[styles.gameTypeLabel, gameType === 'snake' && styles.gameTypeLabelActive]}>
              Snakes & Ladders
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── LUDO options ──────────────────────────────────────────────── */}
        {gameType === 'ludo' && (
          <>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'friends' && styles.modeBtnActive]}
                onPress={() => setMode('friends')}
                activeOpacity={0.8}
              >
                <Text style={styles.modeIcon}>👥</Text>
                <Text style={[styles.modeLabel, mode === 'friends' && styles.modeLabelActive]}>
                  With Friends
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'computer' && styles.modeBtnActive]}
                onPress={() => setMode('computer')}
                activeOpacity={0.8}
              >
                <Text style={styles.modeIcon}>🤖</Text>
                <Text style={[styles.modeLabel, mode === 'computer' && styles.modeLabelActive]}>
                  vs Computer
                </Text>
              </TouchableOpacity>
            </View>

            {/* Friends: pick player count */}
            {mode === 'friends' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>How many players?</Text>
                <View style={styles.countRow}>
                  {([2, 3, 4] as const).map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.countBtn, count === n && styles.countBtnActive]}
                      onPress={() => setCount(n)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.countNum, count === n && styles.countNumActive]}>{n}</Text>
                      <Text style={[styles.countSub, count === n && styles.countSubActive]}>players</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.chipRow}>
                  {FRIENDS_CONFIGS[count].map(p => (
                    <View key={p} style={[styles.chip, { borderColor: COLOR_MAP[p].color, backgroundColor: COLOR_MAP[p].light }]}>
                      <Text style={styles.chipEmoji}>{COLOR_MAP[p].emoji}</Text>
                      <Text style={[styles.chipLabel, { color: COLOR_MAP[p].color }]}>{COLOR_MAP[p].label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* vs Computer */}
            {mode === 'computer' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  You vs {cpuCount} Computer{cpuCount > 1 ? 's' : ''}!
                </Text>
                <View style={styles.countRow}>
                  {([1, 2, 3] as const).map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.countBtn, cpuCount === n && styles.countBtnActive]}
                      onPress={() => setCpuCount(n)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.countNum, cpuCount === n && styles.countNumActive]}>{n}</Text>
                      <Text style={[styles.countSub, cpuCount === n && styles.countSubActive]}>
                        {n === 1 ? 'CPU' : 'CPUs'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.vsRow}>
                  <View style={styles.vsYouBox}>
                    <Text style={styles.vsIcon}>🔴</Text>
                    <Text style={styles.vsYouLabel}>YOU</Text>
                    <Text style={styles.vsPlayerName}>Red</Text>
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
                <View style={[styles.infoBanner, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={styles.infoText}>
                    🎯 You play as <Text style={{ color: '#E53935', fontWeight: '800' }}>RED</Text>.{'\n'}
                    {VS_CPU_CONFIGS[cpuCount].cpu.map(p => COLOR_MAP[p].label).join(', ')}{' '}
                    {cpuCount === 1 ? 'is a computer' : 'are computers'}.
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.startBtn} onPress={handleStartLudo} activeOpacity={0.85}>
              <Text style={styles.startIcon}>🎮</Text>
              <Text style={styles.startBtnText}>START LUDO!</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── SNAKE & LADDERS option ────────────────────────────────────── */}
        {gameType === 'snake' && (
          <>
            <View style={styles.card}>
              <Text style={styles.snakeTitle}>🐍 Snakes & Ladders 🪜</Text>
              <Text style={styles.snakeDesc}>
                Classic 100-cell board.{'\n'}
                Avoid snakes, climb ladders.{'\n'}
                First to 100 wins!
              </Text>
              <View style={styles.snakeVsRow}>
                <View style={styles.snakePlayer}>
                  <Text style={styles.snakePinBlue}>📍</Text>
                  <Text style={[styles.snakePlayerLabel, { color: '#1565C0' }]}>YOU</Text>
                </View>
                <Text style={styles.snakeVsText}>VS</Text>
                <View style={styles.snakePlayer}>
                  <Text style={styles.snakePinRed}>📍</Text>
                  <Text style={[styles.snakePlayerLabel, { color: '#C62828' }]}>COM 🤖</Text>
                </View>
              </View>
              <View style={[styles.infoBanner, { backgroundColor: '#EDE7F6', width: '100%' }]}>
                <Text style={[styles.infoText, { color: '#512DA8' }]}>
                  You vs 1 Computer opponent
                </Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.startBtn, styles.snakeStartBtn]} onPress={onStartSnake} activeOpacity={0.85}>
              <Text style={styles.startIcon}>🐍</Text>
              <Text style={styles.startBtnText}>START GAME!</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.footer}>
          {gameType === 'ludo' ? 'Classic Ludo • 2–4 Players' : 'Snakes & Ladders • You vs Computer'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#1A237E' },
  scroll: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 20 },

  // Header
  header:    { alignItems: 'center', gap: 4 },
  diceEmoji: { fontSize: 52 },
  title: {
    fontSize: 46, fontWeight: '900', color: '#FFFFFF', letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 10, textShadowOffset: { width: 2, height: 3 },
  },
  subtitle:   { color: '#90CAF9', fontSize: 15, letterSpacing: 3, fontWeight: '600' },
  colorStrip: { flexDirection: 'row', borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  stripBlock: { width: 32, height: 10 },

  // Game-type selector
  gameTypeRow: { flexDirection: 'row', gap: 12, width: '100%' },
  gameTypeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', gap: 4,
  },
  gameTypeBtnActive: {
    backgroundColor: 'white', borderColor: '#FFD600',
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  gameTypeIcon:        { fontSize: 26 },
  gameTypeLabel:       { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  gameTypeLabelActive: { color: '#1A237E' },

  // Mode buttons (Ludo)
  modeRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', gap: 6,
  },
  modeBtnActive: {
    backgroundColor: 'white', borderColor: '#FFD600',
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  modeIcon:        { fontSize: 30 },
  modeLabel:       { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  modeLabelActive: { color: '#1A237E' },

  // Card
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    width: '100%', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A237E' },

  // Count buttons
  countRow: { flexDirection: 'row', gap: 14 },
  countBtn: {
    width: 76, height: 76, borderRadius: 16, borderWidth: 2.5,
    borderColor: '#C5CAE9', alignItems: 'center', justifyContent: 'center', gap: 2,
    backgroundColor: '#F5F5F5',
  },
  countBtnActive:  { backgroundColor: '#1A237E', borderColor: '#1A237E' },
  countNum:        { fontSize: 28, fontWeight: '900', color: '#757575' },
  countNumActive:  { color: 'white' },
  countSub:        { fontSize: 10, color: '#9E9E9E', fontWeight: '600' },
  countSubActive:  { color: 'rgba(255,255,255,0.7)' },
  chipRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  chipEmoji:       { fontSize: 14 },
  chipLabel:       { fontSize: 13, fontWeight: '700' },

  // vs Computer
  vsRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vsYouBox:    { alignItems: 'center', gap: 2 },
  vsCpuBox:    { flexDirection: 'row', gap: 8 },
  vsIcon:      { fontSize: 32 },
  vsYouLabel:  { fontSize: 12, fontWeight: '900', color: '#E53935', letterSpacing: 1 },
  vsPlayerName:{ fontSize: 11, color: '#757575' },
  vsText:      { fontSize: 20, fontWeight: '900', color: '#9E9E9E' },
  cpuPlayer:   { alignItems: 'center', gap: 2 },
  cpuTag:      { fontSize: 14 },
  infoBanner:  { width: '100%', padding: 12, borderRadius: 12 },
  infoText:    { fontSize: 13, color: '#2E7D32', textAlign: 'center', lineHeight: 20 },

  // Snake & Ladders card
  snakeTitle:       { fontSize: 20, fontWeight: '900', color: '#4A148C', textAlign: 'center' },
  snakeDesc:        { fontSize: 14, color: '#5D4037', textAlign: 'center', lineHeight: 22 },
  snakeVsRow:       { flexDirection: 'row', alignItems: 'center', gap: 24, paddingVertical: 8 },
  snakePlayer:      { alignItems: 'center', gap: 4 },
  snakePinBlue:     { fontSize: 36 },
  snakePinRed:      { fontSize: 36 },
  snakePlayerLabel: { fontSize: 14, fontWeight: '900' },
  snakeVsText:      { fontSize: 22, fontWeight: '900', color: '#9E9E9E' },

  // Start button
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFD600', paddingVertical: 18, paddingHorizontal: 48,
    borderRadius: 50, width: '100%', justifyContent: 'center',
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 10,
  },
  snakeStartBtn: { backgroundColor: '#7B1FA2', shadowColor: '#7B1FA2' },
  startIcon:     { fontSize: 26 },
  startBtnText:  { fontSize: 22, fontWeight: '900', color: '#1A237E', letterSpacing: 2 },

  footer: { color: '#5C6BC0', fontSize: 12, marginBottom: 8 },
});
