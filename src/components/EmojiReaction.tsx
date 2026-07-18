import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const EMOJIS = ['😂', '😤', '👏', '🎉'];

interface Props {
  /** emoji that is currently flying (null = none) */
  flyingEmoji: string | null;
  onEmojiPress: (emoji: string) => void;
}

function FlyingEmoji({ emoji }: { emoji: string }) {
  const ty  = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(1)).current;
  const scl = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scl, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(ty,  { toValue: -120, duration: 900, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text style={[styles.flying, { opacity: op, transform: [{ translateY: ty }, { scale: scl }] }]}>
      {emoji}
    </Animated.Text>
  );
}

export default function EmojiReaction({ flyingEmoji, onEmojiPress }: Props) {
  return (
    <View style={styles.container}>
      {/* Flying overlay */}
      {flyingEmoji && <FlyingEmoji key={flyingEmoji + Date.now()} emoji={flyingEmoji} />}

      {/* Tappable emoji row */}
      <View style={styles.row}>
        {EMOJIS.map(e => (
          <TouchableOpacity key={e} onPress={() => onEmojiPress(e)} activeOpacity={0.7}>
            <LinearGradient
              colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.08)']}
              start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.btn}
            >
              <Text style={styles.emoji}>{e}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  row:       { flexDirection: 'row', gap: 10 },
  btn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  emoji:  { fontSize: 20 },
  flying: {
    position: 'absolute',
    fontSize: 52,
    bottom: 40,
    alignSelf: 'center',
    zIndex: 100,
  },
});
