import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Player } from '../constants/players';

interface HomeScreenProps {
  onStart: (players: Player[]) => void;
}

const PLAYER_CONFIGS: Record<number, Player[]> = {
  2: ['red', 'yellow'],
  3: ['red', 'green', 'yellow'],
  4: ['red', 'green', 'yellow', 'blue'],
};

const COLOR_CONFIG = [
  { color: '#E53935', label: 'Red' },
  { color: '#43A047', label: 'Green' },
  { color: '#FB8C00', label: 'Yellow' },
  { color: '#1E88E5', label: 'Blue' },
];

export default function HomeScreen({ onStart }: HomeScreenProps) {
  const [count, setCount] = useState<2 | 3 | 4>(4);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.colorStrip}>
            {COLOR_CONFIG.map(({ color }, i) => (
              <View key={i} style={[styles.stripBlock, { backgroundColor: color }]} />
            ))}
          </View>
          <Text style={styles.title}>LUDO RAZA</Text>
          <Text style={styles.subtitle}>The King of Board Games</Text>
        </View>

        {/* Player Count Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Number of Players</Text>
          <View style={styles.countRow}>
            {([2, 3, 4] as const).map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.countBtn, count === n && styles.countBtnActive]}
                onPress={() => setCount(n)}
              >
                <Text style={[styles.countBtnText, count === n && styles.countBtnTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Player preview */}
          <View style={styles.previewRow}>
            {PLAYER_CONFIGS[count].map((p, i) => {
              const cfg = COLOR_CONFIG[['red','green','yellow','blue'].indexOf(p)];
              return (
                <View key={i} style={[styles.previewChip, { borderColor: cfg.color }]}>
                  <View style={[styles.previewDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.previewLabel, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => onStart(PLAYER_CONFIGS[count])}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>START GAME</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Classic Ludo — 2 to 4 Players</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A237E' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 24 },
  header: { alignItems: 'center' },
  colorStrip: { flexDirection: 'row', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  stripBlock: { width: 28, height: 8 },
  title: {
    fontSize: 48, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 6, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 8,
    textShadowOffset: { width: 2, height: 2 },
  },
  subtitle: { color: '#90CAF9', fontSize: 14, marginTop: 4, letterSpacing: 2 },
  card: {
    backgroundColor: 'white', borderRadius: 20, padding: 24,
    width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#424242', marginBottom: 16 },
  countRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  countBtn: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2,
    borderColor: '#9E9E9E', alignItems: 'center', justifyContent: 'center',
  },
  countBtnActive: { backgroundColor: '#1A237E', borderColor: '#1A237E' },
  countBtnText: { fontSize: 22, fontWeight: '700', color: '#757575' },
  countBtnTextActive: { color: 'white' },
  previewRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  previewChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5,
  },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  previewLabel: { fontSize: 12, fontWeight: '600' },
  startBtn: {
    backgroundColor: '#FFD600', paddingVertical: 18, paddingHorizontal: 60,
    borderRadius: 50, width: '100%', alignItems: 'center',
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  startBtnText: { fontSize: 20, fontWeight: '900', color: '#1A237E', letterSpacing: 3 },
  footer: { color: '#5C6BC0', fontSize: 12 },
});
