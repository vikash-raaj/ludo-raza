import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Achievement } from '../constants/achievements';
import { GOLD_GLOSS } from '../constants/gloss';

interface Props {
  achievement: Achievement | null;
  onDone: () => void;
}

export default function AchievementToast({ achievement, onDone }: Props) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(2400),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => onDone());
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.emojiBadge}
      >
        <View style={styles.emojiSheen} />
        <Text style={styles.emoji}>{achievement.emoji}</Text>
      </LinearGradient>
      <View style={styles.text}>
        <Text style={styles.label}>Achievement Unlocked!</Text>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.desc}>{achievement.desc}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    left: 16, right: 16,
    backgroundColor: '#1A237E',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 9999,
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: '#FFD600',
  },
  emojiBadge: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
  },
  emojiSheen: {
    position: 'absolute', top: -10, left: -6, width: 42, height: 22,
    borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)',
    transform: [{ rotate: '-20deg' }],
  },
  emoji: { fontSize: 26 },
  text:  { flex: 1, gap: 2 },
  label: { fontSize: 10, color: '#FFD600', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { fontSize: 16, color: 'white', fontWeight: '900' },
  desc:  { fontSize: 12, color: '#90CAF9' },
});
