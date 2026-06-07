import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function ThinkingDots({ color = '#9E9E9E' }: { color?: string }) {
  const d0 = useRef(new Animated.Value(0.2)).current;
  const d1 = useRef(new Animated.Value(0.2)).current;
  const d2 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    function dot(val: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.2, duration: 280, useNativeDriver: true }),
          Animated.delay(560 - delay),
        ])
      );
    }
    const a0 = dot(d0, 0);
    const a1 = dot(d1, 210);
    const a2 = dot(d2, 420);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, []);

  return (
    <View style={styles.row}>
      {[d0, d1, d2].map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { backgroundColor: color, opacity: d }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
