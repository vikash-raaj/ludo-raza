import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Rect } from 'react-native-svg';

import { MAIN_PATH, SAFE_INDICES, TOKEN_BASE_CELLS } from '../constants/board';
import { Player, ALL_PLAYERS, PLAYER_COLORS, PLAYER_LIGHT } from '../constants/players';
import { GameState, TokenPos } from '../types';
import { getCoords, WIN_POS } from '../logic/gameLogic';

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

// Collect all token render data: { player, tokenIdx, r, c, pos }
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

// Group tokens by cell key
function groupByCell(tokens: TokenRenderData[]): Map<string, TokenRenderData[]> {
  const map = new Map<string, TokenRenderData[]>();
  for (const t of tokens) {
    const key = `${t.r},${t.c}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return map;
}

// Offsets for up to 4 tokens in the same cell (relative fractions of cell size)
const MULTI_OFFSETS: [number, number][] = [
  [0.5, 0.5],
  [0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72],
];

export default function Board({ state, validTokens, onTokenPress, size }: BoardProps) {
  const cs = size / 15;
  const currentPlayer = state.players[state.currentPlayerIdx];
  const allTokens = collectTokens(state);
  const grouped = groupByCell(allTokens);

  // --- Cell fills ---
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const fill = cellFill(r, c);
      const entry = isEntryCell(r, c);
      cells.push(
        <Rect
          key={`c${r}${c}`}
          x={c * cs}
          y={r * cs}
          width={cs}
          height={cs}
          fill={entry ? PLAYER_LIGHT[entry] : fill}
        />
      );
    }
  }

  // --- Home base inner yard + slots ---
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
    // Outer colored area
    homeBases.push(
      <Rect key={`hb-outer-${player}`} x={x} y={y} width={6*cs} height={6*cs} fill={PLAYER_LIGHT[player]} />
    );
    // Inner white yard
    homeBases.push(
      <Rect
        key={`hb-inner-${player}`}
        x={x + cs} y={y + cs} width={4*cs} height={4*cs}
        fill="white" rx={cs * 0.25}
      />
    );
    // 4 token slot circles
    const slots = TOKEN_BASE_CELLS[player];
    for (let i = 0; i < 4; i++) {
      const { r, c } = slots[i];
      homeBases.push(
        <Circle
          key={`hb-slot-${player}-${i}`}
          cx={(c + 0.5) * cs} cy={(r + 0.5) * cs} r={cs * 0.85}
          fill={PLAYER_LIGHT[player]} stroke={PLAYER_COLORS[player]} strokeWidth={2}
        />
      );
    }
  }

  // --- Grid lines (only over the cross path, not home corners) ---
  const gridLines: React.ReactNode[] = [];
  const stroke = '#BDBDBD';
  const sw = 0.5;
  for (let r = 0; r <= 15; r++) {
    gridLines.push(
      <Line key={`hl${r}`} x1={0} y1={r*cs} x2={size} y2={r*cs} stroke={stroke} strokeWidth={sw} />
    );
  }
  for (let c = 0; c <= 15; c++) {
    gridLines.push(
      <Line key={`vl${c}`} x1={c*cs} y1={0} x2={c*cs} y2={size} stroke={stroke} strokeWidth={sw} />
    );
  }
  // Heavy outer border
  gridLines.push(
    <Rect key="border" x={0} y={0} width={size} height={size} fill="none" stroke="#424242" strokeWidth={2} />
  );

  // --- Safe square stars ---
  const safeMarkers: React.ReactNode[] = [];
  SAFE_INDICES.forEach(idx => {
    const { r, c } = MAIN_PATH[idx];
    const cx = (c + 0.5) * cs;
    const cy = (r + 0.5) * cs;
    // Simple 6-pointed star using two triangles
    const outer = cs * 0.38;
    const inner = cs * 0.18;
    const pts1 = starPoints(cx, cy, 6, outer, inner);
    safeMarkers.push(
      <Polygon key={`safe${idx}`} points={pts1} fill="#FFD600" opacity={0.8} />
    );
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
      const isInBase = t.pos === -1;
      const isCurrentPlayer = t.player === currentPlayer;
      const isSelectable = isCurrentPlayer && validTokens.includes(t.tokenIdx) && state.phase === 'selecting';

      let cx: number, cy: number, radius: number;
      if (count === 1 || isInBase) {
        cx = (c0 + MULTI_OFFSETS[0][0]) * cs;
        cy = (r0 + MULTI_OFFSETS[0][1]) * cs;
        radius = cs * 0.35;
      } else {
        cx = (c0 + MULTI_OFFSETS[stackIdx + 1][0]) * cs;
        cy = (r0 + MULTI_OFFSETS[stackIdx + 1][1]) * cs;
        radius = cs * 0.27;
      }

      tokenNodes.push(
        <G key={`tok-${t.player}-${t.tokenIdx}`} onPress={() => isSelectable && onTokenPress(t.tokenIdx)}>
          {isSelectable && (
            <Circle cx={cx} cy={cy} r={radius + cs * 0.12} fill="white" opacity={0.9} />
          )}
          <Circle
            cx={cx} cy={cy} r={radius}
            fill={PLAYER_COLORS[t.player]}
            stroke={isSelectable ? '#FFFFFF' : 'rgba(0,0,0,0.3)'}
            strokeWidth={isSelectable ? 3 : 1.5}
          />
          <Circle cx={cx} cy={cy} r={radius * 0.55} fill="white" opacity={0.45} />
        </G>
      );
    });
  });

  return (
    <View style={{ width: size, height: size }}>
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

function starPoints(cx: number, cy: number, numPoints: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (Math.PI / numPoints) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(' ');
}
