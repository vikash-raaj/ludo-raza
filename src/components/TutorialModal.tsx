import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native';

const { width: W } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const LUDO_SLIDES: Slide[] = [
  {
    emoji: '🎲',
    title: 'Roll to Start',
    body: 'Roll a 6 to bring a token out of your home base onto the board. Roll 6 again for a bonus turn!',
  },
  {
    emoji: '🏃',
    title: 'Move Your Tokens',
    body: 'After leaving base, move your tokens clockwise around the outer ring, then into your colour-coded home column.',
  },
  {
    emoji: '⭐',
    title: 'Safe Squares',
    body: 'Stars mark safe squares — tokens sitting there cannot be captured by opponents. Use them wisely!',
  },
  {
    emoji: '💥',
    title: 'Capture!',
    body: 'Land on an opponent\'s token to send it back to base. You also get an extra roll when you capture.',
  },
  {
    emoji: '🏆',
    title: 'Win the Game',
    body: 'Race all 4 of your tokens to the centre home triangle first to win. Exact rolls required to enter home.',
  },
];

const SNAKE_SLIDES: Slide[] = [
  {
    emoji: '🎲',
    title: 'Roll & Move',
    body: 'Take turns rolling the dice and moving your token that many squares forward on the 100-square board.',
  },
  {
    emoji: '🪜',
    title: 'Climb Ladders',
    body: 'Land on a ladder\'s base and you\'ll climb to a higher square — a short-cut to victory!',
  },
  {
    emoji: '🐍',
    title: 'Avoid Snakes',
    body: 'Land on a snake\'s head and you\'ll slide down to its tail. Watch out and learn from each slide!',
  },
  {
    emoji: '💡',
    title: 'Learn While You Play',
    body: 'Each snake and ladder triggers a mini life-lesson card. Dismiss it to continue after 3 seconds.',
  },
  {
    emoji: '🏁',
    title: 'Reach 100',
    body: 'The first player to land exactly on square 100 wins! Roll the exact number needed — no overshooting.',
  },
];

interface TutorialModalProps {
  visible: boolean;
  gameType: 'ludo' | 'snake';
  onClose: () => void;
}

export default function TutorialModal({ visible, gameType, onClose }: TutorialModalProps) {
  const [page, setPage] = useState(0);
  const slides = gameType === 'ludo' ? LUDO_SLIDES : SNAKE_SLIDES;
  const isLast = page === slides.length - 1;
  const slide = slides[page];

  const handleNext = () => {
    if (isLast) { onClose(); setPage(0); }
    else setPage(p => p + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>

          {/* Dot indicators */}
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.btnText}>{isLast ? "LET'S PLAY! 🎲" : 'NEXT →'}</Text>
          </TouchableOpacity>

          {!isLast && (
            <TouchableOpacity style={styles.skipBtn} onPress={() => { onClose(); setPage(0); }} activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip tutorial</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: 'white', borderRadius: 28,
    paddingVertical: 36, paddingHorizontal: 28,
    alignItems: 'center', gap: 14, width: '100%',
    shadowColor: '#1A237E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 20,
  },
  emoji:  { fontSize: 64 },
  title:  { fontSize: 24, fontWeight: '900', color: '#1A237E', textAlign: 'center' },
  body:   { fontSize: 15, color: '#37474F', lineHeight: 23, textAlign: 'center' },
  dots:   { flexDirection: 'row', gap: 7, marginTop: 4 },
  dot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CFD8DC' },
  dotActive: { backgroundColor: '#1A237E', width: 22 },
  btn: {
    backgroundColor: '#1A237E', paddingVertical: 14,
    paddingHorizontal: 36, borderRadius: 28, marginTop: 4,
  },
  btnText:  { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  skipBtn:  { paddingVertical: 6 },
  skipText: { color: '#9E9E9E', fontSize: 13, fontWeight: '600' },
});
