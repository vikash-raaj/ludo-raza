import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Rect } from 'react-native-svg';

import { MAIN_PATH, SAFE_INDICES, TOKEN_BASE_CELLS } from '../constants/board';
import { Player, ALL_PLAYERS, PLAYER_COLORS, PLAYER_LIGHT } from '../constants/players';
import { GameState, TokenPos } from '../types';
import { getCoords, WIN_POS } from '../logic/gameLogic';

// AnimatedCircle lets us drive SVG circle opacity from React Native's Animated API
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface BoardProps {
  state: GameState;
  validTokens: number[];
  onTokenPress: (tokenIdx: number) => void;
  size: number;
}

function cellFill(r: number, c: number): string {
  if (r < 6 && c < 6) return PLAYER_LIGHT.green;
  if (r < 6 && c > 8) return PLAYER_LIGHT.yellow;
  if (r > 8 && c < 6) return PLAYER_LIGHT.red;
  if (r > 8 && c > 8) return PLAYER_LIGHT.blue;
  if (c === 7 && r >= 9 && r <= 13) return PLAYER_COLORS.red;
  if (r === 7 && c >= 1 && c <= 5)  return PLAYER_COLORS.green;
  if (c === 7 && r >= 1 && r <= 5)  return PLAYER_COLORS.yellow;
  if (r === 7 && c >= 9 && c <= 13) return PLAYER_COLORS.blue;
  if (r === 7 && c === 7) return '#FFFFFF';
  return '#FFFFFF';
}

function isEntryCell(r: number, c: number): Player | null {
  if (r === 13 && c === 6) return 'red';
  if (r === 6  && c === 1) return 'green';
  if (r === 1  && c === 8) return 'yellow';
  if (r === 8  && c === 13) return 'blue';
  return null;
}

interface TokenRenderData {
  player: Player;
  tokenIdx: number;
  r: number;
  c: number;
  pos: TokenPos;
}

function collectTokens(state: GameState): TokenRenderData[] {
  const result: TokenRenderData[] = [];
  for (const player of ALL_PLAYERS) {
    for (let i = 0; i < 4; i++) {
      const pos = state.tokens[player][i];
      if (pos === WIN_POS) continue;
      const coords = getCoords(player, pos, i);
      result.push({ player, tokenIdx: i, r: coords.r, c: coords.c, pos });
    }
  }
  return result;
}

function groupByCell(tokens: TokenRenderData[]): Map<string, TokenRenderData[]> {
  const map = new Map<string, TokenRenderData[]>();
  for (const t of tokens) {
    const key = `${t.r},${t.c}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

// Fractional offsets within a cell for stacked tokens
const MULTI_OFFSETS: [number, number][] = [
  [0.5, 0.5],
  [0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72],
];

function starPoints(cx: number, cy: number, numPoints: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}

export default function Board({ state, validTokens, onTokenPress, size }: BoardProps) {
  const cs = size / 15;
  const currentPlayer = state.players[state.currentPlayerIdx];
  const allTokens = collectTokens(state);
  const grouped = groupByCell(allTokens);

  // Pulsing opacity for selectable-token glow rings
  const glowAnim = useRef(new Animated.Value(1)).current;
  const hasSelectable = validTokens.length > 0;

  useEffect(() => {
    if (hasSelectable) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.25, duration: 550, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1.0,  duration: 550, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      glowAnim.setValue(1);
    }
  }, [hasSelectable]);

  // --- Cell fills ---
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const fill = cellFill(r, c);
      const entry = isEntryCell(r, c);
      cells.push(
        <Rect
          key={`c${r}${c}`}
          x={c * cs} y={r * cs} width={cs} height={cs}
          fill={entry ? PLAYER_LIGHT[entry] : fill}
        />
      );
    }
  }

  // --- Home base inner yard + token slots ---
  const homeBases: React.ReactNode[] = [];
  const corners: { player: Player; rowStart: number; colStart: number }[] = [
    { player: 'green',  rowStart: 0, colStart: 0 },
    { player: 'yellow', rowStart: 0, colStart: 9 },
    { player: 'red',    rowStart: 9, colStart: 0 },
    { player: 'blue',   rowStart: 9, colStart: 9 },
  ];
  for (const { player, rowStart, colStart } of corners) {
    const x = colStart * cs;
    const y = rowStart * cs;
    homeBases.push(
      <Rect key={`hb-outer-${player}`} x={x} y={y} width={6*cs} height={6*cs} fill={PLAYER_LIGHT[player]} />
    );
    homeBases.push(
      <Rect key={`hb-inner-${player}`}
        x={x + cs} y={y + cs} width={4*cs} height={4*cs}
        fill="white" rx={cs * 0.25}
      />
    );
    const slots = TOKEN_BASE_CELLS[player];
    for (let i = 0; i < 4; i++) {
      const { r, c } = slots[i];
      homeBases.push(
        <Circle key={`hb-slot-${player}-${i}`}
          cx={(c + 0.5) * cs} cy={(r + 0.5) * cs} r={cs * 0.85}
          fill={PLAYER_LIGHT[player]} stroke={PLAYER_COLORS[player]} strokeWidth={2}
        />
      );
    }
  }

  // --- Grid lines ---
  const gridLines: React.ReactNode[] = [];
  const stroke = '#BDBDBD';
  const sw = 0.5;
  for (let r = 0; r <= 15; r++) {
    gridLines.push(<Line key={`hl${r}`} x1={0} y1={r*cs} x2={size} y2={r*cs} stroke={stroke} strokeWidth={sw} />);
  }
  for (let c = 0; c <= 15; c++) {
    gridLines.push(<Line key={`vl${c}`} x1={c*cs} y1={0} x2={c*cs} y2={size} stroke={stroke} strokeWidth={sw} />);
  }
  gridLines.push(
    <Rect key="border" x={0} y={0} width={size} height={size} fill="none" stroke="#424242" strokeWidth={2} />
  );

  // --- Safe square stars ---
  const safeMarkers: React.ReactNode[] = [];
  SAFE_INDICES.forEach(idx => {
    const { r, c } = MAIN_PATH[idx];
    const cx = (c + 0.5) * cs;
    const cy = (r + 0.5) * cs;
    const pts = starPoints(cx, cy, 6, cs * 0.38, cs * 0.18);
    safeMarkers.push(<Polygon key={`safe${idx}`} points={pts} fill="#FFD600" opacity={0.8} />);
  });

  // --- Center 4-triangle pattern ---
  const x0 = 7 * cs, y0 = 7 * cs, cxc = 7.5 * cs, cyc = 7.5 * cs, x1 = 8 * cs, y1 = 8 * cs;
  const centerTris: React.ReactNode[] = [
    <Polygon key="ct-r" points={`${cxc},${cyc} ${x1},${y0} ${x1},${y1}`} fill={PLAYER_COLORS.blue} />,
    <Polygon key="ct-l" points={`${cxc},${cyc} ${x0},${y0} ${x0},${y1}`} fill={PLAYER_COLORS.green} />,
    <Polygon key="ct-t" points={`${cxc},${cyc} ${x0},${y0} ${x1},${y0}`} fill={PLAYER_COLORS.yellow} />,
    <Polygon key="ct-b" points={`${cxc},${cyc} ${x0},${y1} ${x1},${y1}`} fill={PLAYER_COLORS.red} />,
  ];

  // --- Tokens ---
  const tokenNodes: React.ReactNode[] = [];
  grouped.forEach((tokens) => {
    const count = tokens.length;
    const r0 = tokens[0].r;
    const c0 = tokens[0].c;

    tokens.forEach((t, stackIdx) => {
      const isCurrentPlayer = t.player === currentPlayer;
      const isSelectable = isCurrentPlayer && validTokens.includes(t.tokenIdx) && state.phase === 'selecting';

      let cx: number, cy: number, radius: number;
      if (count === 1 || t.pos === -1) {
        cx = (c0 + MULTI_OFFSETS[0][0]) * cs;
        cy = (r0 + MULTI_OFFSETS[0][1]) * cs;
        radius = cs * 0.38;
      } else {
        cx = (c0 + MULTI_OFFSETS[stackIdx + 1][0]) * cs;
        cy = (r0 + MULTI_OFFSETS[stackIdx + 1][1]) * cs;
        radius = cs * 0.28;
      }

      // Hit area: a nearly-transparent circle that fills most of the cell
      // so children can tap tokens with a fat finger without missing.
      const hitRadius = count === 1 ? cs * 0.46 : cs * 0.3;

      tokenNodes.push(
        <G
          key={`tok-${t.player}-${t.tokenIdx}`}
          onPress={() => { if (isSelectable) onTokenPress(t.tokenIdx); }}
        >
          {/* Large invisible hit target so fat-finger tapping is reliable */}
          <Circle cx={cx} cy={cy} r={hitRadius} fill="rgba(0,0,0,0.001)" />

          {/* Animated pulsing glow ring for selectable tokens */}
          {isSelectable && (
            <AnimatedCircle
              cx={cx} cy={cy}
              r={radius + cs * 0.18}
              fill="white"
              opacity={glowAnim}
            />
          )}

          {/* Token body */}
          <Circle
            cx={cx} cy={cy} r={radius}
            fill={PLAYER_COLORS[t.player]}
            stroke={isSelectable ? '#FFFFFF' : 'rgba(0,0,0,0.25)'}
            strokeWidth={isSelectable ? 3.5 : 1.5}
          />
          {/* Shine highlight */}
          <Circle cx={cx - radius * 0.22} cy={cy - radius * 0.22} r={radius * 0.38} fill="rgba(255,255,255,0.55)" />
        </G>
      );
    });
  });

  return (
    <View style={{ width: size, height: size, borderRadius: 4, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
      <Svg width={size} height={size}>
        {cells}
        {homeBases}
        {gridLines}
        {safeMarkers}
        {centerTris}
        {tokenNodes}
      </Svg>
    </View>
  );
}
