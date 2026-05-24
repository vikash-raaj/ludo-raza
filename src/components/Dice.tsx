import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
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
}

export default function Dice({ value, size = 64, canRoll, onRoll, color }: DiceProps) {
  const dots = value ? DOT_POSITIONS[value] : [];
  const r = size * 0.09;

  return (
    <TouchableOpacity
      onPress={canRoll ? onRoll : undefined}
      style={[styles.container, { opacity: canRoll ? 1 : 0.5 }]}
      activeOpacity={0.7}
    >
      <Svg width={size} height={size}>
        <Rect
          x={2} y={2} width={size - 4} height={size - 4}
          rx={size * 0.16} ry={size * 0.16}
          fill="white"
          stroke={canRoll ? color : '#9E9E9E'}
          strokeWidth={3}
        />
        {dots.map(([cx, cy], i) => (
          <Circle key={i} cx={cx * size} cy={cy * size} r={r} fill={canRoll ? color : '#757575'} />
        ))}
        {!value && (
          <Circle cx={size / 2} cy={size / 2} r={size * 0.12} fill="#E0E0E0" />
        )}
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
