import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player, PLAYER_COLORS, PLAYER_LABELS } from '../constants/players';
import { TokenPos } from '../types';
import { WIN_POS } from '../logic/gameLogic';

interface PlayerPanelProps {
  player: Player;
  tokens: [TokenPos, TokenPos, TokenPos, TokenPos];
  isActive: boolean;
  isWinner: boolean;
}

export default function PlayerPanel({ player, tokens, isActive, isWinner }: PlayerPanelProps) {
  const color = PLAYER_COLORS[player];
  const finished = tokens.filter(t => t === WIN_POS).length;

  return (
    <View style={[styles.container, { borderColor: color, borderWidth: isActive ? 3 : 1 }]}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.info}>
        <Text style={[styles.name, { color }]}>
          {isWinner ? '🏆 ' : ''}{PLAYER_LABELS[player]}
        </Text>
        <View style={styles.tokens}>
          {tokens.map((t, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: t === WIN_POS ? color : t >= 0 ? color : 'transparent',
                  borderColor: color,
                  opacity: t >= 0 || t === WIN_POS ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.score, { color }]}>{finished}/4 home</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    margin: 3,
    flex: 1,
  },
  colorBar: { width: 8, alignSelf: 'stretch' },
  info: { padding: 6, flex: 1 },
  name: { fontSize: 12, fontWeight: '700' },
  tokens: { flexDirection: 'row', gap: 3, marginVertical: 2 },
  dot: {
    width: 10, height: 10, borderRadius: 5, borderWidth: 1.5,
  },
  score: { fontSize: 10 },
});
