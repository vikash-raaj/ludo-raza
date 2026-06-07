import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { generateMathQuestion } from '../constants/learningContent';

interface Props {
  visible: boolean;
  diceValue: number | null;
  onResult: (correct: boolean) => void;
}

export default function MathChallengeModal({ visible, diceValue, onResult }: Props) {
  const [q, setQ]           = useState<{ q: string; answer: number; choices: number[] } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (visible && diceValue) {
      setQ(generateMathQuestion(diceValue));
      setSelected(null);
      setAnswered(false);
      scale.setValue(0.7);
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }).start();
    }
  }, [visible, diceValue]);

  const handleChoice = (val: number) => {
    if (answered) return;
    setSelected(val);
    setAnswered(true);

    const isCorrect = val === q?.answer;

    if (!isCorrect) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 6,   duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0,   duration: 60, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => onResult(isCorrect), 1000);
  };

  if (!visible || !q) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale }, { translateX: shake }] }]}>
          <Text style={styles.badge}>🧠 Math Challenge!</Text>
          <Text style={styles.dice}>You rolled  <Text style={styles.diceNum}>{diceValue}</Text></Text>
          <Text style={styles.question}>{q.q}</Text>

          <View style={styles.choicesRow}>
            {q.choices.map((c, i) => {
              const isSelected = selected === c;
              const correct    = answered && c === q.answer;
              const wrong      = answered && isSelected && c !== q.answer;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.choice,
                    correct && styles.choiceCorrect,
                    wrong   && styles.choiceWrong,
                    isSelected && !answered && styles.choiceSelected,
                  ]}
                  onPress={() => handleChoice(c)}
                  activeOpacity={0.8}
                  disabled={answered}
                >
                  <Text style={[styles.choiceTxt, (correct || wrong) && styles.choiceTxtLight]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {answered && (
            <Text style={[styles.result, { color: selected === q.answer ? '#43A047' : '#E53935' }]}>
              {selected === q.answer ? '✅ Correct!' : `❌ Answer was ${q.answer}`}
            </Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white', borderRadius: 28,
    padding: 26, alignItems: 'center', gap: 14,
    width: '85%',
    shadowColor: '#1A237E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 18, elevation: 18,
  },
  badge:      { fontSize: 14, fontWeight: '900', color: '#5C6BC0', letterSpacing: 1 },
  dice:       { fontSize: 15, color: '#546E7A' },
  diceNum:    { fontWeight: '900', color: '#1A237E', fontSize: 18 },
  question:   { fontSize: 30, fontWeight: '900', color: '#1A237E', textAlign: 'center' },
  choicesRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  choice: {
    minWidth: 72, paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 16, backgroundColor: '#EEF0FF',
    borderWidth: 2, borderColor: '#C5CAE9', alignItems: 'center',
  },
  choiceSelected:{ borderColor: '#1A237E', backgroundColor: '#E8EAF6' },
  choiceCorrect: { backgroundColor: '#43A047', borderColor: '#43A047' },
  choiceWrong:   { backgroundColor: '#E53935', borderColor: '#E53935' },
  choiceTxt:     { fontSize: 22, fontWeight: '900', color: '#1A237E' },
  choiceTxtLight:{ color: 'white' },
  result:        { fontSize: 16, fontWeight: '900' },
});
