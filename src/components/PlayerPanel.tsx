import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Player, PLAYER_COLORS, PLAYER_LABELS } from '../constants/players';
import { PLAYER_GLOSS } from '../constants/gloss';
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
  /** Override label — used to show the human player's actual name */
  displayName?: string;
}

export default function PlayerPanel({
  player, tokens, isActive, isWinner, isComputer, displayName,
}: PlayerPanelProps) {
  const color    = PLAYER_COLORS[player];
  const gloss    = PLAYER_GLOSS[player];
  const finished = tokens.filter(t => t === WIN_POS).length;
  const onBoard  = tokens.filter(t => t >= 0 && t < WIN_POS).length;
  const name     = displayName ?? PLAYER_LABELS[player];

  return (
    <View style={[
      styles.container,
      { borderColor: isActive ? color : 'rgba(255,255,255,0.18)', borderWidth: isActive ? 2.5 : 1 },
      isActive && { shadowColor: color },
    ]}>
      <View style={styles.avatarWrap}>
        <LinearGradient
          colors={[gloss.light, gloss.base, gloss.dark]}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }}
          style={[styles.avatar, isActive && styles.avatarActive]}
        >
          <View style={styles.avatarSheen} />
          <Text style={styles.avatarEmoji}>{PLAYER_EMOJI[player]}</Text>
        </LinearGradient>
        {isWinner && <Text style={styles.crown}>👑</Text>}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {isComputer && !isWinner && (
            <View style={styles.cpuBadge}>
              <Text style={styles.cpuText}>CPU</Text>
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
                  backgroundColor: t >= 0 ? gloss.base : 'rgba(255,255,255,0.15)',
                  borderColor: t >= 0 ? gloss.dark : 'rgba(255,255,255,0.3)',
                  opacity: t >= 0 || t === WIN_POS ? 1 : 0.5,
                },
              ]}
            >
              {t >= 0 && <View style={styles.dotShine} />}
            </View>
          ))}
        </View>
        <Text style={styles.score}>
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
    gap: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    margin: 3,
    flex: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarActive: {
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 6, elevation: 6,
  },
  avatarSheen: {
    position: 'absolute', top: -6, left: -4, width: 26, height: 16,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ rotate: '-20deg' }],
  },
  avatarEmoji: { fontSize: 12 },
  crown: { position: 'absolute', top: -10, right: -4, fontSize: 14 },

  info:      { flex: 1 },
  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name:      { fontSize: 12, fontWeight: '800', flexShrink: 1, color: 'white' },
  cpuBadge:  { borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  cpuText:   { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, color: 'rgba(255,255,255,0.85)' },
  tokens:    { flexDirection: 'row', gap: 4, marginVertical: 3 },
  dot:       { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, overflow: 'hidden' },
  dotShine:  { position: 'absolute', top: 1, left: 1.5, width: 4, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  score:     { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
});
