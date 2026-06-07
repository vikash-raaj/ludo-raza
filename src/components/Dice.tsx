import React, { useRef, useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]],
};

interface DiceProps {
  value: number | null;
  size?: number;
  canRoll: boolean;
  onRoll: () => void;
  color: string;
  /** When true, rapidly cycles through faces to show a rolling animation */
  spinning?: boolean;
}

export default function Dice({ value, size = 80, canRoll, onRoll, color, spinning = false }: DiceProps) {
  // The face value shown during and after animation
  const [displayValue, setDisplayValue] = useState<number | null>(value);

  // Keep display in sync when NOT spinning
  useEffect(() => {
    if (!spinning) setDisplayValue(value);
  }, [value, spinning]);

  // Face-cycling effect when spinning
  useEffect(() => {
    if (!spinning) return;
    const id = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 75);
    return () => clearInterval(id);
  }, [spinning]);

  const dots = displayValue ? DOT_POSITIONS[displayValue] : [];
  const r = size * 0.09;

  // Scale-pulse when rollable; wobble when spinning
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (spinning) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 80, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => { loop.stop(); pulseAnim.setValue(1); };
    }
    if (canRoll) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [canRoll, spinning]);

  const isActive = canRoll && !spinning;

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        onPress={isActive ? onRoll : undefined}
        style={[styles.container, { opacity: isActive ? 1 : 0.6 }]}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Svg width={size} height={size}>
          <Rect
            x={2} y={2} width={size - 4} height={size - 4}
            rx={size * 0.18} ry={size * 0.18}
            fill="white"
            stroke={isActive || spinning ? color : '#9E9E9E'}
            strokeWidth={isActive || spinning ? 4 : 2}
          />
          {dots.map(([cx, cy], i) => (
            <Circle key={i} cx={cx * size} cy={cy * size} r={r} fill={isActive || spinning ? color : '#9E9E9E'} />
          ))}
          {!displayValue && (
            <Circle cx={size / 2} cy={size / 2} r={size * 0.14} fill="#E0E0E0" />
          )}
        </Svg>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
