import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { playSound } from '../utils/soundManager';
import { showInterstitialAd } from '../utils/adService';

const { width: SW } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SW - 16, 400);
const CS = BOARD_SIZE / 10; // cell size

// ── Board layout ──────────────────────────────────────────────────────────────
// Row 9 (bottom) = cells 1-10, Row 8 = 11-20, ... Row 0 (top) = 91-100
function cellCoords(cell: number): { row: number; col: number } {
  const idx    = cell - 1;
  const rowIdx = Math.floor(idx / 10);          // 0 = bottom row
  const row    = 9 - rowIdx;                    // SVG row (0=top)
  const posInRow = idx % 10;
  const col    = rowIdx % 2 === 0 ? posInRow : 9 - posInRow;
  return { row, col };
}

function cellCenter(cell: number): { x: number; y: number } {
  const { row, col } = cellCoords(cell);
  return { x: (col + 0.5) * CS, y: (row + 0.5) * CS };
}

// ── Snakes: head → tail (slide DOWN) ─────────────────────────────────────────
const SNAKES: Record<number, number> = {
  99: 54, 94: 28, 87: 24, 64: 60, 62: 19,
  56: 53, 49: 11, 48: 26, 43: 3,  17: 7,
};

// ── Ladders: bottom → top (climb UP) ─────────────────────────────────────────
const LADDERS: Record<number, number> = {
  4: 14, 9: 31, 20: 38, 28: 84,
  40: 59, 51: 67, 63: 81, 71: 91,
};

// ── Game logic ────────────────────────────────────────────────────────────────
function applySnakeLadder(pos: number): { pos: number; type: 'snake' | 'ladder' | null } {
  if (SNAKES[pos]) return { pos: SNAKES[pos], type: 'snake' };
  if (LADDERS[pos]) return { pos: LADDERS[pos], type: 'ladder' };
  return { pos, type: null };
}

// ── Snake SVG path (smooth S-curve) ──────────────────────────────────────────
function snakePath(head: number, tail: number): string {
  const h = cellCenter(head);
  const t = cellCenter(tail);
  const mx = (h.x + t.x) / 2;
  const my = (h.y + t.y) / 2;
  const cp1x = h.x + (t.x - h.x) * 0.2 + CS * 1.5;
  const cp1y = h.y + (t.y - h.y) * 0.2;
  const cp2x = t.x + (h.x - t.x) * 0.2 - CS * 1.5;
  const cp2y = t.y + (h.y - t.y) * 0.2;
  return `M ${h.x},${h.y} C ${cp1x},${cp1y} ${mx + CS},${my} ${mx},${my} C ${mx - CS},${my} ${cp2x},${cp2y} ${t.x},${t.y}`;
}

// ── Ladder SVG (two rails + rungs) ───────────────────────────────────────────
function LadderSVG({ bottom, top }: { bottom: number; top: number }) {
  const b = cellCenter(bottom);
  const t = cellCenter(top);
  const dx = t.x - b.x;
  const dy = t.y - b.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux; // perpendicular
  const w = CS * 0.28;
  const rungs = Math.max(3, Math.round(len / CS));

  const rails: React.ReactNode[] = [
    <Line key="r1"
      x1={b.x + px * w} y1={b.y + py * w}
      x2={t.x + px * w} y2={t.y + py * w}
      stroke="#7EC8E3" strokeWidth={3} strokeLinecap="round" />,
    <Line key="r2"
      x1={b.x - px * w} y1={b.y - py * w}
      x2={t.x - px * w} y2={t.y - py * w}
      stroke="#7EC8E3" strokeWidth={3} strokeLinecap="round" />,
  ];
  const rungNodes: React.ReactNode[] = [];
  for (let i = 1; i < rungs; i++) {
    const f = i / rungs;
    const rx = b.x + dx * f;
    const ry = b.y + dy * f;
    rungNodes.push(
      <Line key={`rg${i}`}
        x1={rx + px * w} y1={ry + py * w}
        x2={rx - px * w} y2={ry - py * w}
        stroke="#7EC8E3" strokeWidth={2.5} strokeLinecap="round" />
    );
  }
  return <G>{rails}{rungNodes}</G>;
}

// ── Token pin (same map-pin shape as Ludo) ────────────────────────────────────
function makePinPath(cx: number, cy: number, r: number): string {
  const hcy = cy - r * 0.12;
  const sx  = r * 0.88;
  const sy  = hcy + r * 0.52;
  const py  = hcy + r * 1.78;
  return `M ${cx - sx},${sy} A ${r} ${r} 0 1 1 ${cx + sx},${sy} L ${cx},${py} Z`;
}

function Token({ cx, cy, color, label }: { cx: number; cy: number; color: string; label: string }) {
  const r = CS * 0.28;
  const hcy = cy - r * 0.12;
  return (
    <G>
      <Ellipse cx={cx} cy={hcy + r * 1.85} rx={r * 0.6} ry={r * 0.16} fill="rgba(0,0,0,0.2)" />
      <Path d={makePinPath(cx, cy, r)} fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth={1.2} />
      <Circle cx={cx} cy={hcy} r={r * 0.56} fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth={r * 0.28} />
      <Circle cx={cx - r * 0.34} cy={hcy - r * 0.4} r={r * 0.26} fill="rgba(255,255,255,0.7)" />
    </G>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { onHome: () => void }

type Phase = 'idle' | 'rolling' | 'moving' | 'gameover';

export default function SnakeLadderScreen({ onHome }: Props) {
  const [positions, setPositions] = useState<[number, number]>([0, 0]); // [you, com], 0=start
  const [turn, setTurn]       = useState<0 | 1>(0);   // 0=You, 1=Com
  const [dice, setDice]       = useState<number | null>(null);
  const [phase, setPhase]     = useState<Phase>('idle');
  const [winner, setWinner]   = useState<0 | 1 | null>(null);
  const [message, setMessage] = useState('Your turn — tap ROLL!');
  const [visPos, setVisPos]   = useState<[number, number]>([0, 0]); // animated positions

  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const diceAnim      = useRef(new Animated.Value(1)).current;

  // ── Step animation ──────────────────────────────────────────────────────────
  function animateMove(
    playerIdx: 0 | 1,
    fromPos: number,
    toPos: number,
    onDone: () => void,
  ) {
    setPhase('moving');
    const steps: number[] = [];
    for (let p = fromPos + 1; p <= toPos; p++) steps.push(p);
    if (steps.length === 0) { onDone(); return; }

    const STEP_MS = 160;
    steps.forEach((pos, i) => {
      setTimeout(() => {
        setVisPos(prev => playerIdx === 0 ? [pos, prev[1]] : [prev[0], pos]);
        playSound('token_move');
        if (i === steps.length - 1) setTimeout(onDone, STEP_MS);
      }, i * STEP_MS);
    });
  }

  // ── Roll logic ──────────────────────────────────────────────────────────────
  const doRoll = useCallback((playerIdx: 0 | 1) => {
    if (phase === 'moving' || phase === 'gameover') return;
    setPhase('rolling');

    // Dice animation
    diceAnim.setValue(0.7);
    Animated.spring(diceAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }).start();

    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);
    playSound('dice_roll');

    const currentPos = positions[playerIdx];
    let newPos = currentPos + roll;
    if (newPos > 100) newPos = currentPos; // can't go past 100

    // Animate movement
    animateMove(playerIdx, currentPos, newPos, () => {
      // Check snake/ladder
      const { pos: finalPos, type } = applySnakeLadder(newPos);

      if (type === 'snake') {
        playSound('token_capture');
        setMessage(playerIdx === 0 ? '🐍 Oops! Snake bites you!' : '🐍 Computer hit a snake!');
        animateMove(playerIdx, newPos, finalPos, () => {
          setPositions(prev => playerIdx === 0 ? [finalPos, prev[1]] : [prev[0], finalPos]);
          finishTurn(playerIdx, finalPos);
        });
      } else if (type === 'ladder') {
        playSound('token_exit');
        setMessage(playerIdx === 0 ? '🪜 Lucky! Ladder up!' : '🪜 Computer climbs a ladder!');
        animateMove(playerIdx, newPos, finalPos, () => {
          setPositions(prev => playerIdx === 0 ? [finalPos, prev[1]] : [prev[0], finalPos]);
          finishTurn(playerIdx, finalPos);
        });
      } else {
        setPositions(prev => playerIdx === 0 ? [newPos, prev[1]] : [prev[0], newPos]);
        finishTurn(playerIdx, newPos);
      }
    });
  }, [phase, positions]);

  function finishTurn(playerIdx: 0 | 1, finalPos: number) {
    if (finalPos >= 100) {
      playSound('win');
      setWinner(playerIdx);
      setPhase('gameover');
      setMessage(playerIdx === 0 ? '🏆 You Win!' : '🤖 Computer Wins!');
      Animated.spring(celebrateAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 5 }).start();
      setTimeout(() => showInterstitialAd(), 2000);
      return;
    }
    const next = playerIdx === 0 ? 1 : 0;
    setTurn(next as 0 | 1);
    setPhase('idle');
    setMessage(next === 0 ? 'Your turn — tap ROLL!' : 'Computer is thinking...');
  }

  // ── AI auto-play ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (turn !== 1 || phase !== 'idle') return;
    const t = setTimeout(() => doRoll(1), 1200 + Math.random() * 600);
    return () => clearTimeout(t);
  }, [turn, phase]);

  // ── Human roll ───────────────────────────────────────────────────────────────
  const handleRoll = () => {
    if (turn !== 0 || phase !== 'idle') return;
    doRoll(0);
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPositions([0, 0]);
    setVisPos([0, 0]);
    setTurn(0);
    setDice(null);
    setPhase('idle');
    setWinner(null);
    setMessage('Your turn — tap ROLL!');
    celebrateAnim.setValue(0);
  };

  // ── Board render ─────────────────────────────────────────────────────────────
  const cells: React.ReactNode[] = [];
  for (let cell = 1; cell <= 100; cell++) {
    const { row, col } = cellCoords(cell);
    const isSnakeHead   = !!SNAKES[cell];
    const isLadderBottom = !!LADDERS[cell];
    const fill = isSnakeHead ? '#FFCDD2' : isLadderBottom ? '#C8E6C9'
      : (row + col) % 2 === 0 ? '#F5F0E8' : '#EDE0D0';
    cells.push(
      <Rect key={`c${cell}`}
        x={col * CS} y={row * CS} width={CS} height={CS}
        fill={fill} stroke="#C0A882" strokeWidth={0.5}
      />
    );
    cells.push(
      <SvgText key={`t${cell}`}
        x={col * CS + CS * 0.5} y={row * CS + CS * 0.22}
        fontSize={CS * 0.22} fill="#5D4037"
        textAnchor="middle" fontWeight="bold"
      >
        {cell}
      </SvgText>
    );
  }

  // Snakes
  const snakeNodes = Object.entries(SNAKES).map(([head, tail]) => (
    <G key={`snake${head}`}>
      {/* Snake body */}
      <Path
        d={snakePath(Number(head), tail)}
        stroke="#4CAF50" strokeWidth={CS * 0.18}
        fill="none" strokeLinecap="round"
        opacity={0.85}
      />
      {/* Snake body overlay (texture) */}
      <Path
        d={snakePath(Number(head), tail)}
        stroke="#81C784" strokeWidth={CS * 0.10}
        fill="none" strokeLinecap="round"
        strokeDasharray={`${CS * 0.15},${CS * 0.15}`}
        opacity={0.7}
      />
      {/* Snake head circle */}
      <Circle
        cx={cellCenter(Number(head)).x}
        cy={cellCenter(Number(head)).y}
        r={CS * 0.18} fill="#388E3C" stroke="#1B5E20" strokeWidth={1.5}
      />
      {/* Snake eyes */}
      <Circle cx={cellCenter(Number(head)).x - CS * 0.07} cy={cellCenter(Number(head)).y - CS * 0.05} r={CS * 0.05} fill="#F44336" />
      <Circle cx={cellCenter(Number(head)).x + CS * 0.07} cy={cellCenter(Number(head)).y - CS * 0.05} r={CS * 0.05} fill="#F44336" />
    </G>
  ));

  // Ladders
  const ladderNodes = Object.entries(LADDERS).map(([bottom, top]) => (
    <LadderSVG key={`ladder${bottom}`} bottom={Number(bottom)} top={top} />
  ));

  // Player tokens
  const [youPos, comPos] = visPos;
  const youCoords = youPos > 0 ? cellCenter(Math.min(youPos, 100)) : null;
  const comCoords = comPos > 0 ? cellCenter(Math.min(comPos, 100)) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#7B1FA2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onHome} style={styles.backBtn}>
          <Text style={styles.backTxt}>← Menu</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🐍 Snakes & Ladders</Text>
        <TouchableOpacity onPress={handleReset} style={styles.backBtn}>
          <Text style={styles.backTxt}>↺ New</Text>
        </TouchableOpacity>
      </View>

      {/* Message bar */}
      <View style={[styles.msgBar, { backgroundColor: turn === 0 ? '#1565C0' : '#6A1B9A' }]}>
        <Text style={styles.msgTxt}>{message}</Text>
      </View>

      {/* Board */}
      <View style={styles.boardWrap}>
        <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
          {/* Background */}
          <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="#F5F0E8" />
          {cells}
          {ladderNodes}
          {snakeNodes}
          {/* Grid border */}
          <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="none" stroke="#795548" strokeWidth={3} />
          {/* Tokens */}
          {comCoords && (
            <Token cx={comCoords.x + CS * 0.15} cy={comCoords.y + CS * 0.05} color="#E53935" label="C" />
          )}
          {youCoords && (
            <Token cx={youCoords.x - CS * 0.15} cy={youCoords.y + CS * 0.05} color="#1565C0" label="Y" />
          )}
        </Svg>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* You panel */}
        <View style={[styles.playerPanel, turn === 0 && phase !== 'gameover' && styles.activePanel]}>
          <Text style={styles.playerPinEmoji}>📍</Text>
          <Text style={[styles.playerLabel, { color: '#1565C0' }]}>YOU</Text>
          <Text style={styles.playerPos}>{youPos > 0 ? youPos : 'Start'}</Text>
        </View>

        {/* Dice */}
        <TouchableOpacity
          onPress={handleRoll}
          disabled={turn !== 0 || phase !== 'idle'}
          activeOpacity={0.8}
        >
          <Animated.View style={[
            styles.diceBox,
            { transform: [{ scale: diceAnim }] },
            (turn !== 0 || phase !== 'idle') && styles.diceDisabled,
          ]}>
            <Text style={styles.diceEmoji}>
              {dice ? ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][dice] : '🎲'}
            </Text>
            <Text style={styles.diceLabel}>
              {turn === 0 && phase === 'idle' ? 'ROLL' : dice ? `${dice}` : '···'}
            </Text>
          </Animated.View>
        </TouchableOpacity>

        {/* Computer panel */}
        <View style={[styles.playerPanel, turn === 1 && phase !== 'gameover' && styles.activePanel]}>
          <Text style={styles.playerPinEmoji}>📍</Text>
          <Text style={[styles.playerLabel, { color: '#C62828' }]}>COM</Text>
          <Text style={styles.playerPos}>{comPos > 0 ? comPos : 'Start'}</Text>
        </View>
      </View>

      {/* Win banner */}
      {winner !== null && (
        <Animated.View style={[styles.winBanner, {
          opacity: celebrateAnim,
          transform: [{ scale: celebrateAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
        }]}>
          <Text style={styles.winText}>{winner === 0 ? '🏆 YOU WIN! 🎉' : '🤖 Computer Wins!'}</Text>
          <TouchableOpacity onPress={handleReset} style={styles.playAgainBtn}>
            <Text style={styles.playAgainTxt}>PLAY AGAIN</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#4A148C' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  backBtn: { padding: 6 },
  backTxt: { color: '#CE93D8', fontSize: 13, fontWeight: '700' },
  title:   { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  msgBar: {
    paddingVertical: 6, paddingHorizontal: 16, marginHorizontal: 12, borderRadius: 20,
    marginBottom: 8,
  },
  msgTxt: { color: 'white', textAlign: 'center', fontWeight: '700', fontSize: 13 },

  boardWrap: {
    alignSelf: 'center',
    borderRadius: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 10,
    borderWidth: 3, borderColor: '#795548',
  },

  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 16, paddingVertical: 10, marginTop: 8,
  },

  playerPanel: {
    alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', minWidth: 80,
  },
  activePanel: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2, borderColor: '#FFD600',
    shadowColor: '#FFD600', shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
  },
  playerPinEmoji: { fontSize: 22 },
  playerLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  playerPos:   { fontSize: 18, fontWeight: '900', color: 'white' },

  diceBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  diceDisabled: { opacity: 0.55 },
  diceEmoji:   { fontSize: 32 },
  diceLabel:   { fontSize: 11, fontWeight: '900', color: '#4A148C', letterSpacing: 1 },

  winBanner: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: 'white', borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 14,
    shadowColor: '#FFD600', shadowOpacity: 0.7, shadowRadius: 20, elevation: 16,
  },
  winText:      { fontSize: 24, fontWeight: '900', color: '#1A237E', textAlign: 'center' },
  playAgainBtn: {
    backgroundColor: '#FFD600', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 30,
  },
  playAgainTxt: { fontSize: 16, fontWeight: '900', color: '#1A237E', letterSpacing: 1.5 },
});
