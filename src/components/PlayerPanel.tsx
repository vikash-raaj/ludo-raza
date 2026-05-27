import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player, PLAYER_COLORS, PLAYER_LABELS } from '../constants/players';
import { TokenPos } from '../types';
import { WIN_POS } from '../logic/gameLogic';

const PLAYER_EMOJI: Record<Player, string> = {
  red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵',
};

interface PlayerPanelProps {
  player: Player;
  tokens: [TokenPos, TokenPos, TokenPos, TokenPos];
  isActive: boolean;
  isWinner: boolean;
  isComputer?: boolean;
}

export default function PlayerPanel({ player, tokens, isActive, isWinner, isComputer }: PlayerPanelProps) {
  const color = PLAYER_COLORS[player];
  const finished = tokens.filter(t => t === WIN_POS).length;
  const onBoard  = tokens.filter(t => t >= 0 && t < WIN_POS).length;

  return (
    <View style={[
      styles.container,
      { borderColor: color, borderWidth: isActive ? 3 : 1 },
      isActive && styles.activeContainer,
    ]}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color }]}>
            {isWinner ? '🏆 ' : PLAYER_EMOJI[player] + ' '}
            {PLAYER_LABELS[player]}
          </Text>
          {isComputer && !isWinner && (
            <View style={[styles.cpuBadge, { borderColor: color }]}>
              <Text style={[styles.cpuText, { color }]}>CPU</Text>
            </View>
          )}
        </View>
        <View style={styles.tokens}>
          {tokens.map((t, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: t === WIN_POS ? color : t >= 0 ? color : 'transparent',
                  borderColor: color,
                  opacity: t >= 0 || t === WIN_POS ? 1 : 0.3,
                  transform: [{ scale: t >= 0 && t < WIN_POS ? 1.1 : 1 }],
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.score, { color }]}>
          {finished > 0 ? `${finished} home` : onBoard > 0 ? `${onBoard} moving` : 'at start'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'white',
    margin: 3,
    flex: 1,
  },
  activeContainer: {
    backgroundColor: '#FFFDE7',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  colorBar: { width: 8, alignSelf: 'stretch' },
  info: { paddingHorizontal: 8, paddingVertical: 6, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 13, fontWeight: '700' },
  cpuBadge: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  cpuText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  tokens: { flexDirection: 'row', gap: 4, marginVertical: 3 },
  dot: {
    width: 11, height: 11, borderRadius: 6, borderWidth: 1.5,
  },
  score: { fontSize: 10, fontWeight: '600' },
});
