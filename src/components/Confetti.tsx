import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

const { width: W } = Dimensions.get('window');
const COLORS = ['#E53935','#43A047','#FB8C00','#1E88E5','#FFD600','#9C27B0','#00BCD4','#FF4081','#76FF03'];
const COUNT = 48;

function rnd(a: number, b: number) { return a + Math.random() * (b - a); }

function Piece({ startX, delay }: { startX: number; delay: number }) {
  const ty  = useRef(new Animated.Value(-30)).current;
  const tx  = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(1)).current;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const w = rnd(7, 14);
  const h = w * rnd(0.4, 0.7);
  const dur = rnd(1600, 2800);
  const drift = rnd(-80, 80);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(ty,  { toValue: Dimensions.get('window').height * 0.85, duration: dur, useNativeDriver: true }),
        Animated.timing(tx,  { toValue: drift, duration: dur, useNativeDriver: true }),
        Animated.timing(rot, { toValue: rnd(3, 8), duration: dur, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(dur * 0.65),
          Animated.timing(op, { toValue: 0, duration: dur * 0.35, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      top: 0,
      left: startX,
      width: w,
      height: h,
      backgroundColor: color,
      borderRadius: 2,
      transform: [
        { translateY: ty },
        { translateX: tx },
        { rotate: rot.interpolate({ inputRange: [0, 8], outputRange: ['0deg', '960deg'] }) },
      ],
      opacity: op,
    }} />
  );
}

const pieces = Array.from({ length: COUNT }, (_, i) => ({
  startX: rnd(0, W),
  delay:  i * 55,
}));

export default function Confetti() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => <Piece key={i} startX={p.startX} delay={p.delay} />)}
    </View>
  );
}
