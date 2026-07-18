import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Confetti from './Confetti';
import { GOLD_GLOSS, shade } from '../constants/gloss';

interface WinOverlayProps {
  winnerName: string;
  winnerColor: string;
  isHuman: boolean;
  tip: string;
  onPlayAgain: () => void;
  onMenu: () => void;
}

export default function WinOverlay({
  winnerName, winnerColor, isHuman, tip, onPlayAgain, onMenu,
}: WinOverlayProps) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 70, friction: 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleShare = async () => {
    const msg = isHuman
      ? `🏆 I just won in LudoRaza! Come challenge me! 🎲`
      : `🎲 Just played LudoRaza — a classic board game app with Ludo & Snakes and Ladders!`;
    await Share.share({ message: msg }).catch(() => {});
  };

  return (
    <View style={styles.overlay}>
      <Confetti />
      <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>

        <View style={styles.trophyGlow} pointerEvents="none" />
        <LinearGradient
          colors={[GOLD_GLOSS.light, GOLD_GLOSS.base, GOLD_GLOSS.dark]}
          start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }}
          style={styles.trophyBadge}
        >
          <View style={styles.trophyBadgeSheen} />
          <Text style={styles.trophy}>{isHuman ? '🏆' : '🤖'}</Text>
        </LinearGradient>

        <Text style={[styles.winnerText, { color: winnerColor }]}>
          {winnerName} Wins!
        </Text>
        <Text style={styles.celebrate}>{isHuman ? '🎉🎊🥳' : '😅 Try again!'}</Text>

        {/* Strategy tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipLabel}>💡 Pro Tip</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        <TouchableOpacity onPress={onPlayAgain} activeOpacity={0.85} style={styles.btnWrap}>
          <LinearGradient
            colors={[shade(winnerColor, 22), winnerColor, shade(winnerColor, -30)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.btn}
          >
            <View style={styles.btnSheen} />
            <Text style={styles.btnText}>🔄  PLAY AGAIN</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.shareBtnText}>📤  Share Result</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={onMenu} activeOpacity={0.7}>
          <Text style={styles.menuBtnText}>← MENU</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 12,
    width: '85%',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 20,
  },
  trophyGlow: {
    position: 'absolute', top: 10, alignSelf: 'center',
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: '#FFD600', opacity: 0.4,
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 30, elevation: 4,
  },
  trophyBadge: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.75)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  trophyBadgeSheen: {
    position: 'absolute', top: -14, left: -8, width: 68, height: 34,
    borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.55)',
    transform: [{ rotate: '-20deg' }],
  },
  trophy:      { fontSize: 42 },
  winnerText:  { fontSize: 30, fontWeight: '900', letterSpacing: 1 },
  celebrate:   { fontSize: 28, letterSpacing: 4 },
  tipBox: {
    backgroundColor: '#F3F4FF',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    gap: 4,
  },
  tipLabel: { fontSize: 12, fontWeight: '900', color: '#5C6BC0', letterSpacing: 1 },
  tipText:  { fontSize: 13, color: '#37474F', lineHeight: 19 },
  btnWrap: { width: '100%', marginTop: 4 },
  btn: {
    width: '100%', paddingVertical: 15, borderRadius: 30,
    alignItems: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnSheen: {
    position: 'absolute', top: 4, left: 18, right: 18, height: '42%',
    borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.32)',
  },
  btnText: { fontSize: 18, fontWeight: '900', color: 'white', letterSpacing: 2 },
  shareBtn:     { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20, borderWidth: 1.5, borderColor: '#B0BEC5' },
  shareBtnText: { fontSize: 14, color: '#546E7A', fontWeight: '700' },
  menuBtn:    { paddingVertical: 8 },
  menuBtnText:{ fontSize: 14, color: '#9E9E9E', fontWeight: '700' },
});
