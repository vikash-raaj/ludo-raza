import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SNAKE_LESSONS, LADDER_LESSONS } from '../constants/learningContent';

interface Props {
  visible: boolean;
  type: 'snake' | 'ladder' | null;
  cell: number;
  onClose: () => void;
}

export default function LessonModal({ visible, type, cell, onClose }: Props) {
  const slideY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideY.setValue(120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, tension: 90, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      const t = setTimeout(onClose, 3200);
      return () => clearTimeout(t);
    }
  }, [visible, cell]);

  if (!visible || !type) return null;

  const lesson = type === 'snake' ? SNAKE_LESSONS[cell] : LADDER_LESSONS[cell];
  if (!lesson) return null;

  const isSnake  = type === 'snake';
  const bgColor  = isSnake ? '#B71C1C' : '#1B5E20';
  const emoji    = isSnake ? '🐍' : '🪜';

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bgColor, opacity, transform: [{ translateY: slideY }] }]}
    >
      <TouchableOpacity style={styles.inner} onPress={onClose} activeOpacity={0.9}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.textCol}>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.body}>{lesson.body}</Text>
          <Text style={styles.tap}>Tap to dismiss</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },
  inner: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  emoji:  { fontSize: 38 },
  textCol:{ flex: 1, gap: 4 },
  title:  { fontSize: 18, fontWeight: '900', color: 'white' },
  body:   { fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 19 },
  tap:    { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
});
