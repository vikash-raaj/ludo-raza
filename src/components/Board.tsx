import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import { MAIN_PATH, SAFE_INDICES, TOKEN_BASE_CELLS } from '../constants/board';
import { Player, ALL_PLAYERS, PLAYER_COLORS, PLAYER_LIGHT } from '../constants/players';
import { AppTheme } from '../constants/themes';
import { TokenShape } from '../utils/storage';
import { GameState, TokenPos } from '../types';
import { getCoords, WIN_POS } from '../logic/gameLogic';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface BoardProps {
  state: GameState;
  validTokens: number[];
  onTokenPress: (tokenIdx: number) => void;
  size: number;
  tokenOverride?: { player: Player; tokenIdx: number; pos: number };
  theme?: AppTheme;
  tokenShape?: TokenShape;
  newlyHomedPlayer?: Player | null;
}

// ── Token shape renderers ───────────────────────────────────────────────────

// Map-pin (teardrop)
function makePinPath(cx: number, cy: number, headR: number): string {
  const headCy  = cy - headR * 0.12;
  const spreadX = headR * 0.88;
  const spreadY = headCy + headR * 0.52;
  const pointY  = headCy + headR * 1.78;
  return (
    `M ${cx - spreadX},${spreadY} ` +
    `A ${headR} ${headR} 0 1 1 ${cx + spreadX},${spreadY} ` +
    `L ${cx},${pointY} Z`
  );
}

// Chess-pawn shape: wide base, narrow neck, round head
function makePawnPath(cx: number, cy: number, r: number): string {
  const headR  = r * 0.46;
  const headCy = cy - r * 0.72;
  const neckW  = r * 0.22;
  const neckTop = headCy + headR * 0.85;
  const neckBot = cy + r * 0.30;
  const baseW  = r * 0.82;
  const baseH  = r * 0.28;
  const baseTop = cy + r * 0.30;
  const baseBot = cy + r * 0.85;
  return (
    `M ${cx - neckW},${neckTop} ` +
    `A ${headR} ${headR} 0 1 1 ${cx + neckW},${neckTop} ` +
    `L ${cx + neckW},${neckBot} ` +
    `L ${cx + baseW},${baseBot} ` +
    `L ${cx - baseW},${baseBot} ` +
    `L ${cx - neckW},${neckBot} Z`
  );
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

function collectTokens(
  state: GameState,
  override?: { player: Player; tokenIdx: number; pos: number },
): TokenRenderData[] {
  const result: TokenRenderData[] = [];
  for (const player of ALL_PLAYERS) {
    for (let i = 0; i < 4; i++) {
      const pos: TokenPos =
        override && override.player === player && override.tokenIdx === i
          ? override.pos
          : state.tokens[player][i];
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

export default function Board({ state, validTokens, onTokenPress, size, tokenOverride, theme, tokenShape = 'pin', newlyHomedPlayer }: BoardProps) {
  const cs = size / 15;
  const currentPlayer = state.players[state.currentPlayerIdx];
  const allTokens = collectTokens(state, tokenOverride);
  const grouped = groupByCell(allTokens);

  const glowAnim = useRef(new Animated.Value(1)).current;
  const hasSelectable = validTokens.length > 0;

  useEffect(() => {
    if (hasSelectable) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.2, duration: 500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1.0, duration: 500, useNativeDriver: true }),
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
        <Rect key={`c${r}_${c}`}
          x={c * cs} y={r * cs} width={cs} height={cs}
          fill={entry ? PLAYER_LIGHT[entry] : fill}
        />
      );
    }
  }

  // --- Home bases ---
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
  const stroke = theme?.gridStroke ?? '#BDBDBD';
  const border = theme?.boardBorder ?? '#424242';
  for (let r = 0; r <= 15; r++)
    gridLines.push(<Line key={`hl${r}`} x1={0} y1={r*cs} x2={size} y2={r*cs} stroke={stroke} strokeWidth={0.5} />);
  for (let c = 0; c <= 15; c++)
    gridLines.push(<Line key={`vl${c}`} x1={c*cs} y1={0} x2={c*cs} y2={size} stroke={stroke} strokeWidth={0.5} />);
  gridLines.push(
    <Rect key="border" x={0} y={0} width={size} height={size} fill="none" stroke={border} strokeWidth={2} />
  );

  // --- Safe stars ---
  const safeMarkers: React.ReactNode[] = [];
  SAFE_INDICES.forEach(idx => {
    const { r, c } = MAIN_PATH[idx];
    const cx = (c + 0.5) * cs;
    const cy = (r + 0.5) * cs;
    safeMarkers.push(
      <Polygon key={`safe${idx}`} points={starPoints(cx, cy, 6, cs * 0.38, cs * 0.18)} fill={theme?.safeColor ?? '#FFD600'} opacity={0.8} />
    );
  });

  // --- Center triangles ---
  const x0 = 7 * cs, y0 = 7 * cs, cxc = 7.5 * cs, cyc = 7.5 * cs, x1 = 8 * cs, y1 = 8 * cs;
  const centerTris: React.ReactNode[] = [
    <Polygon key="ct-r" points={`${cxc},${cyc} ${x1},${y0} ${x1},${y1}`} fill={PLAYER_COLORS.blue} />,
    <Polygon key="ct-l" points={`${cxc},${cyc} ${x0},${y0} ${x0},${y1}`} fill={PLAYER_COLORS.green} />,
    <Polygon key="ct-t" points={`${cxc},${cyc} ${x0},${y0} ${x1},${y0}`} fill={PLAYER_COLORS.yellow} />,
    <Polygon key="ct-b" points={`${cxc},${cyc} ${x0},${y1} ${x1},${y1}`} fill={PLAYER_COLORS.red} />,
  ];

  // --- Tokens on board ---
  const tokenNodes: React.ReactNode[] = [];
  grouped.forEach((tokens) => {
    const count = tokens.length;
    const r0 = tokens[0].r;
    const c0 = tokens[0].c;

    tokens.forEach((t, stackIdx) => {
      const isCurrentPlayer = t.player === currentPlayer;
      const isSelectable = isCurrentPlayer && validTokens.includes(t.tokenIdx) && state.phase === 'selecting';

      let cx: number, cy: number;
      if (count === 1 || t.pos === -1) {
        cx = (c0 + MULTI_OFFSETS[0][0]) * cs;
        cy = (r0 + MULTI_OFFSETS[0][1]) * cs;
      } else {
        cx = (c0 + MULTI_OFFSETS[stackIdx + 1][0]) * cs;
        cy = (r0 + MULTI_OFFSETS[stackIdx + 1][1]) * cs;
      }

      const headR    = (count === 1 || t.pos === -1) ? cs * 0.30 : cs * 0.22;
      const headCy   = cy - headR * 0.12;
      const color    = PLAYER_COLORS[t.player];
      const hitR     = (count === 1) ? cs * 0.46 : cs * 0.30;
      const strokeW  = isSelectable ? 2.5 : 1.2;
      const stroke   = isSelectable ? '#FFFFFF' : 'rgba(0,0,0,0.30)';

      tokenNodes.push(
        <G key={`tok-${t.player}-${t.tokenIdx}`} onPress={() => { if (isSelectable) onTokenPress(t.tokenIdx); }}>
          <Circle cx={cx} cy={cy} r={hitR} fill="rgba(0,0,0,0.001)" />

          {isSelectable && (
            <AnimatedCircle cx={cx} cy={headCy} r={headR + cs * 0.17} fill="white" opacity={glowAnim} />
          )}

          {tokenShape === 'round' ? (
            // ── Round (classic disc) ──────────────────────────────────
            <G>
              <Ellipse cx={cx} cy={cy + headR * 0.8} rx={headR * 0.7} ry={headR * 0.18} fill="rgba(0,0,0,0.20)" />
              <Circle cx={cx} cy={cy} r={headR} fill={color} stroke={stroke} strokeWidth={strokeW} />
              <Circle cx={cx} cy={cy} r={headR * 0.55} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={headR * 0.25} />
              <Circle cx={cx - headR * 0.34} cy={cy - headR * 0.38} r={headR * 0.26} fill="rgba(255,255,255,0.70)" />
            </G>
          ) : tokenShape === 'pawn' ? (
            // ── Pawn (chess-piece silhouette) ─────────────────────────
            <G>
              <Ellipse cx={cx} cy={cy + headR * 1.75} rx={headR * 0.9} ry={headR * 0.18} fill="rgba(0,0,0,0.20)" />
              <Path d={makePawnPath(cx, cy, headR)} fill={color} stroke={stroke} strokeWidth={strokeW} />
              <Circle cx={cx - headR * 0.30} cy={cy - headR * 0.60} r={headR * 0.22} fill="rgba(255,255,255,0.65)" />
            </G>
          ) : (
            // ── Pin (map-pin teardrop, default) ───────────────────────
            <G>
              <Ellipse cx={cx} cy={headCy + headR * 1.85} rx={headR * 0.62} ry={headR * 0.16} fill="rgba(0,0,0,0.20)" />
              <Path d={makePinPath(cx, cy, headR)} fill={color} stroke={stroke} strokeWidth={strokeW} />
              <Circle cx={cx} cy={headCy} r={headR * 0.56} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={headR * 0.28} />
              <Circle cx={cx - headR * 0.34} cy={headCy - headR * 0.40} r={headR * 0.26} fill="rgba(255,255,255,0.70)" />
            </G>
          )}
        </G>
      );
    });
  });

  // --- Won tokens in center triangles ---
  // Each player's finished tokens appear as small dots in their colored triangle
  const centerTokenR = cs * 0.14;
  const wonTokenNodes: React.ReactNode[] = [];
  const triCenters: Record<Player, { x: number; y: number }> = {
    red:    { x: 7.5 * cs, y: 7.75 * cs },
    green:  { x: 7.25 * cs, y: 7.5 * cs },
    yellow: { x: 7.5 * cs, y: 7.25 * cs },
    blue:   { x: 7.75 * cs, y: 7.5 * cs },
  };
  const wonOffsets: [number, number][] = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]];
  for (const player of ALL_PLAYERS) {
    const wonCount = state.tokens[player].filter(p => p === WIN_POS).length;
    if (wonCount === 0) continue;
    const tc = triCenters[player];
    for (let i = 0; i < wonCount; i++) {
      const ox = wonOffsets[i][0] * centerTokenR * 1.1;
      const oy = wonOffsets[i][1] * centerTokenR * 1.1;
      wonTokenNodes.push(
        <Circle
          key={`won-${player}-${i}`}
          cx={tc.x + ox} cy={tc.y + oy}
          r={centerTokenR}
          fill="white"
          stroke={PLAYER_COLORS[player]}
          strokeWidth={1.5}
          opacity={0.95}
        />
      );
    }
  }

  // --- Home-arrival sparkle ring (pulses on the newly homed player's triangle) ---
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!newlyHomedPlayer) return;
    sparkleAnim.setValue(0);
    Animated.sequence([
      Animated.timing(sparkleAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(sparkleAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [newlyHomedPlayer]);

  const AnimatedCircleSparkle = Animated.createAnimatedComponent(Circle);
  const sparkleNode = newlyHomedPlayer ? (() => {
    const tc = triCenters[newlyHomedPlayer];
    return (
      <AnimatedCircleSparkle
        cx={tc.x} cy={tc.y}
        r={cs * 0.38}
        fill="none"
        stroke="white"
        strokeWidth={2}
        opacity={sparkleAnim}
      />
    );
  })() : null;

  return (
    <View style={{
      width: size, height: size, borderRadius: 4, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
    }}>
      <Svg width={size} height={size}>
        {cells}
        {homeBases}
        {gridLines}
        {safeMarkers}
        {centerTris}
        {wonTokenNodes}
        {sparkleNode}
        {tokenNodes}
      </Svg>
    </View>
  );
}
