import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { Player } from '../constants/players';

type GameMode = 'friends' | 'computer';

interface HomeScreenProps {
  onStart: (players: Player[], computerPlayers: Player[]) => void;
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

// vs Computer: 4-player game — Red is the human, others are CPU
const VS_COMPUTER_PLAYERS: Player[]         = ['red', 'green', 'yellow', 'blue'];
const VS_COMPUTER_CPU_PLAYERS: Player[]     = ['green', 'yellow', 'blue'];

export default function HomeScreen({ onStart }: HomeScreenProps) {
  const [mode, setMode]   = useState<GameMode>('friends');
  const [count, setCount] = useState<2 | 3 | 4>(4);

  const handleStart = () => {
    if (mode === 'computer') {
      onStart(VS_COMPUTER_PLAYERS, VS_COMPUTER_CPU_PLAYERS);
    } else {
      onStart(FRIENDS_CONFIGS[count], []);
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

        {/* Mode selector */}
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

        {/* Friends mode: pick player count */}
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
                  <Text style={[styles.countSub, count === n && styles.countSubActive]}>
                    {n === 2 ? 'players' : n === 3 ? 'players' : 'players'}
                  </Text>
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

        {/* vs Computer mode: fixed 4-player */}
        {mode === 'computer' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You vs 3 Computers!</Text>

            <View style={styles.vsRow}>
              <View style={styles.vsYouBox}>
                <Text style={styles.vsIcon}>🔴</Text>
                <Text style={styles.vsYouLabel}>YOU</Text>
                <Text style={styles.vsPlayerName}>Red</Text>
              </View>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.vsCpuBox}>
                {VS_COMPUTER_CPU_PLAYERS.map(p => (
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
                Green, Yellow & Blue are computers.
              </Text>
            </View>
          </View>
        )}

        {/* Start button */}
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startIcon}>🎮</Text>
          <Text style={styles.startBtnText}>START GAME!</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Classic Ludo • 2–4 Players</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A237E' },
  scroll: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 20 },

  // Header
  header: { alignItems: 'center', gap: 4 },
  diceEmoji: { fontSize: 52 },
  title: {
    fontSize: 46, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 6,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 10, textShadowOffset: { width: 2, height: 3 },
  },
  subtitle: { color: '#90CAF9', fontSize: 15, letterSpacing: 3, fontWeight: '600' },
  colorStrip: { flexDirection: 'row', borderRadius: 6, overflow: 'hidden', marginTop: 8 },
  stripBlock: { width: 32, height: 10 },

  // Mode buttons
  modeRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: 'white', borderColor: '#FFD600',
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  modeIcon: { fontSize: 30 },
  modeLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },
  modeLabelActive: { color: '#1A237E' },

  // Card
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 20,
    width: '100%', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A237E' },

  // Friends: count buttons
  countRow: { flexDirection: 'row', gap: 14 },
  countBtn: {
    width: 76, height: 76, borderRadius: 16, borderWidth: 2.5,
    borderColor: '#C5CAE9', alignItems: 'center', justifyContent: 'center', gap: 2,
    backgroundColor: '#F5F5F5',
  },
  countBtnActive: { backgroundColor: '#1A237E', borderColor: '#1A237E' },
  countNum: { fontSize: 28, fontWeight: '900', color: '#757575' },
  countNumActive: { color: 'white' },
  countSub: { fontSize: 10, color: '#9E9E9E', fontWeight: '600' },
  countSubActive: { color: 'rgba(255,255,255,0.7)' },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '700' },

  // vs Computer
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vsYouBox: { alignItems: 'center', gap: 2 },
  vsCpuBox: { flexDirection: 'row', gap: 8 },
  vsIcon: { fontSize: 32 },
  vsYouLabel: { fontSize: 12, fontWeight: '900', color: '#E53935', letterSpacing: 1 },
  vsPlayerName: { fontSize: 11, color: '#757575' },
  vsText: { fontSize: 20, fontWeight: '900', color: '#9E9E9E' },
  cpuPlayer: { alignItems: 'center', gap: 2 },
  cpuTag: { fontSize: 14 },
  infoBanner: {
    width: '100%', padding: 12, borderRadius: 12,
  },
  infoText: { fontSize: 13, color: '#2E7D32', textAlign: 'center', lineHeight: 20 },

  // Start button
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFD600', paddingVertical: 18, paddingHorizontal: 48,
    borderRadius: 50, width: '100%', justifyContent: 'center',
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55, shadowRadius: 14, elevation: 10,
  },
  startIcon: { fontSize: 26 },
  startBtnText: { fontSize: 22, fontWeight: '900', color: '#1A237E', letterSpacing: 2 },
  footer: { color: '#5C6BC0', fontSize: 12, marginBottom: 8 },
});
