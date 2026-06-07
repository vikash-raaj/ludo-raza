import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { getStreakReward } from '../constants/learningContent';

interface Props {
  visible: boolean;
  streak: number;
  onClose: () => void;
}

export default function DailyRewardModal({ visible, streak, onClose }: Props) {
  const bounce = useRef(new Animated.Value(0.5)).current;
  const glow   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    bounce.setValue(0.5);
    glow.setValue(0);
    Animated.parallel([
      Animated.spring(bounce, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, [visible]);

  const reward = getStreakReward(streak);
  const isForest = streak >= 3;
  const isNight  = streak >= 7;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: bounce }] }]}>

          <Animated.Text style={[styles.giftEmoji, { opacity: glow }]}>🎁</Animated.Text>
          <Text style={styles.title}>Day {streak} Reward!</Text>
          <Text style={styles.streakBadge}>🔥 {streak}-day login streak</Text>

          <Text style={styles.rewardText}>{reward}</Text>

          {(isForest || isNight) && (
            <View style={styles.unlockBox}>
              <Text style={styles.unlockTitle}>🔓 Theme Unlocked!</Text>
              {isNight  && <Text style={styles.unlockItem}>🌙 Night theme — available in settings</Text>}
              {isForest && !isNight && <Text style={styles.unlockItem}>🌿 Forest theme — available in settings</Text>}
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.btnText}>🎉  CLAIM REWARD</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white', borderRadius: 28,
    padding: 28, alignItems: 'center', gap: 12,
    width: '82%',
    shadowColor: '#FFD600', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  giftEmoji:    { fontSize: 72 },
  title:        { fontSize: 26, fontWeight: '900', color: '#1A237E' },
  streakBadge:  { fontSize: 16, fontWeight: '800', color: '#E65100', backgroundColor: '#FFF3E0', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  rewardText:   { fontSize: 15, color: '#37474F', textAlign: 'center', lineHeight: 22 },
  unlockBox: {
    backgroundColor: '#E8F5E9', borderRadius: 14,
    padding: 12, width: '100%', gap: 4,
  },
  unlockTitle:  { fontSize: 13, fontWeight: '900', color: '#2E7D32' },
  unlockItem:   { fontSize: 13, color: '#388E3C' },
  btn: {
    backgroundColor: '#FFD600', paddingVertical: 14,
    paddingHorizontal: 32, borderRadius: 30, marginTop: 4,
  },
  btnText: { fontSize: 16, fontWeight: '900', color: '#1A237E', letterSpacing: 1.5 },
});
