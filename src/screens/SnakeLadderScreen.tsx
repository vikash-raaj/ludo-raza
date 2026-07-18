import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Defs, Ellipse, G, Line, LinearGradient as SvgLinearGradient,
  Path, RadialGradient, Rect, Stop, Text as SvgText,
} from 'react-native-svg';

import ThinkingDots from '../components/ThinkingDots';
import LessonModal from '../components/LessonModal';
import MathChallengeModal from '../components/MathChallengeModal';
import WinOverlay from '../components/WinOverlay';

import { AppTheme } from '../constants/themes';
import { PLAYER_GLOSS, shade } from '../constants/gloss';
import { WIN_TIPS, LOSS_TIPS } from '../constants/learningContent';
import { playSound } from '../utils/soundManager';
import { showInterstitialAd } from '../utils/adService';
import { recordSnakeLoss, incrementMathCorrect } from '../utils/storage';

const { width: SW } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SW - 16, 400);
const CS = BOARD_SIZE / 10;

// ── Board layout ───────────────────────────────────────────────────────────────
function cellCoords(cell: number): { row: number; col: number } {
  const idx = cell - 1;
  const rowIdx = Math.floor(idx / 10);
  const row    = 9 - rowIdx;
  const posInRow = idx % 10;
  const col  = rowIdx % 2 === 0 ? posInRow : 9 - posInRow;
  return { row, col };
}
function cellCenter(cell: number): { x: number; y: number } {
  const { row, col } = cellCoords(cell);
  return { x: (col + 0.5) * CS, y: (row + 0.5) * CS };
}

const SNAKES: Record<number, number> = {
  99: 54, 94: 28, 87: 24, 64: 60, 62: 19,
  56: 53, 49: 11, 48: 26, 43: 3,  17: 7,
};
const LADDERS: Record<number, number> = {
  4: 14, 9: 31, 20: 38, 28: 84,
  40: 59, 51: 67, 63: 81, 71: 91,
};

function applySnakeLadder(pos: number): { pos: number; type: 'snake' | 'ladder' | null } {
  if (SNAKES[pos]) return { pos: SNAKES[pos], type: 'snake' };
  if (LADDERS[pos]) return { pos: LADDERS[pos], type: 'ladder' };
  return { pos, type: null };
}

// ── Snake SVG ─────────────────────────────────────────────────────────────────
function snakePath(head: number, tail: number): string {
  const h = cellCenter(head), t = cellCenter(tail);
  const mx = (h.x + t.x) / 2, my = (h.y + t.y) / 2;
  const cp1x = h.x + (t.x - h.x) * 0.2 + CS * 1.5;
  const cp1y = h.y + (t.y - h.y) * 0.2;
  const cp2x = t.x + (h.x - t.x) * 0.2 - CS * 1.5;
  const cp2y = t.y + (h.y - t.y) * 0.2;
  return `M ${h.x},${h.y} C ${cp1x},${cp1y} ${mx + CS},${my} ${mx},${my} C ${mx - CS},${my} ${cp2x},${cp2y} ${t.x},${t.y}`;
}

// ── Ladder SVG ────────────────────────────────────────────────────────────────
function LadderSVG({ bottom, top }: { bottom: number; top: number }) {
  const b = cellCenter(bottom), t = cellCenter(top);
  const dx = t.x - b.x, dy = t.y - b.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const w = CS * 0.28;
  const rungs = Math.max(3, Math.round(len / CS));
  const rails = [
    <Line key="r1" x1={b.x + px * w} y1={b.y + py * w} x2={t.x + px * w} y2={t.y + py * w} stroke="#7EC8E3" strokeWidth={3} strokeLinecap="round" />,
    <Line key="r2" x1={b.x - px * w} y1={b.y - py * w} x2={t.x - px * w} y2={t.y - py * w} stroke="#7EC8E3" strokeWidth={3} strokeLinecap="round" />,
  ];
  const rungNodes = Array.from({ length: rungs - 1 }, (_, i) => {
    const f = (i + 1) / rungs;
    return <Line key={i} x1={b.x + dx * f + px * w} y1={b.y + dy * f + py * w} x2={b.x + dx * f - px * w} y2={b.y + dy * f - py * w} stroke="#7EC8E3" strokeWidth={2.5} strokeLinecap="round" />;
  });
  return <G>{rails}{rungNodes}</G>;
}

// ── Glossy board gradients ────────────────────────────────────────────────────
// Static defs — no runtime props — so they're built once and shared by every
// cell / token drawn on the board.
const BOARD_DEFS = (
  <Defs>
    <RadialGradient id="tokenYou" cx="32%" cy="26%" r="78%">
      <Stop offset="0%" stopColor={PLAYER_GLOSS.blue.light} />
      <Stop offset="50%" stopColor={PLAYER_GLOSS.blue.base} />
      <Stop offset="100%" stopColor={PLAYER_GLOSS.blue.dark} />
    </RadialGradient>
    <RadialGradient id="tokenCom" cx="32%" cy="26%" r="78%">
      <Stop offset="0%" stopColor={PLAYER_GLOSS.red.light} />
      <Stop offset="50%" stopColor={PLAYER_GLOSS.red.base} />
      <Stop offset="100%" stopColor={PLAYER_GLOSS.red.dark} />
    </RadialGradient>
    <SvgLinearGradient id="cellLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor="#FBF6EC" />
      <Stop offset="100%" stopColor="#F0E6D2" />
    </SvgLinearGradient>
    <SvgLinearGradient id="cellDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor="#EDE0CC" />
      <Stop offset="100%" stopColor="#DFCBAA" />
    </SvgLinearGradient>
    <RadialGradient id="cellSnake" cx="35%" cy="30%" r="80%">
      <Stop offset="0%" stopColor="#FFCDD2" />
      <Stop offset="100%" stopColor="#EF9A9A" />
    </RadialGradient>
    <RadialGradient id="cellLadder" cx="35%" cy="30%" r="80%">
      <Stop offset="0%" stopColor="#C8E6C9" />
      <Stop offset="100%" stopColor="#A5D6A7" />
    </RadialGradient>
  </Defs>
);

// ── Token pin ──────────────────────────────────────────────────────────────────
function makePinPath(cx: number, cy: number, r: number): string {
  const hcy = cy - r * 0.12;
  const sx  = r * 0.88, sy  = hcy + r * 0.52, py  = hcy + r * 1.78;
  return `M ${cx - sx},${sy} A ${r} ${r} 0 1 1 ${cx + sx},${sy} L ${cx},${py} Z`;
}
function Token({ cx, cy, gradId }: { cx: number; cy: number; gradId: 'tokenYou' | 'tokenCom' }) {
  const r = CS * 0.28, hcy = cy - r * 0.12;
  return (
    <G>
      <Ellipse cx={cx} cy={hcy + r * 1.9} rx={r * 0.64} ry={r * 0.18} fill="rgba(0,0,0,0.28)" />
      <Path d={makePinPath(cx, cy, r)} fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.3)" strokeWidth={1.2} />
      <Circle cx={cx} cy={hcy} r={r * 0.56} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth={r * 0.22} />
      <Circle cx={cx - r * 0.34} cy={hcy - r * 0.4} r={r * 0.26} fill="rgba(255,255,255,0.55)" />
    </G>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  onHome: () => void;
  playerName: string;
  player2Name?: string;
  theme: AppTheme;
  soundOn?: boolean;
  mathMode?: boolean;
  twoPlayer?: boolean;
  onWin?: () => void;
}

type Phase = 'idle' | 'rolling' | 'moving' | 'gameover' | 'math';

export default function SnakeLadderScreen({ onHome, playerName, player2Name, theme, soundOn = true, mathMode = false, twoPlayer = false, onWin }: Props) {
  const [positions, setPositions] = useState<[number, number]>([0, 0]);
  const [turn,    setTurn]    = useState<0 | 1>(0);
  const [dice,    setDice]    = useState<number | null>(null);
  const [phase,   setPhase]   = useState<Phase>('idle');
  const [winner,  setWinner]  = useState<0 | 1 | null>(null);
  const [message, setMessage] = useState('Your turn — tap ROLL!');
  const [visPos,  setVisPos]  = useState<[number, number]>([0, 0]);

  const p2Label = player2Name || 'Player 2';

  // Lesson modal state
  const [lessonVisible, setLessonVisible] = useState(false);
  const [lessonType,    setLessonType]    = useState<'snake' | 'ladder' | null>(null);
  const [lessonCell,    setLessonCell]    = useState(0);
  const lessonCb = useRef<(() => void) | null>(null);

  // Win tip
  const [winTip, setWinTip] = useState('');

  const diceAnim = useRef(new Animated.Value(1)).current;

  // ── Step animation ──────────────────────────────────────────────────────────
  function animateMove(playerIdx: 0 | 1, fromPos: number, toPos: number, onDone: () => void) {
    setPhase('moving');
    const steps: number[] = [];
    for (let p = fromPos + 1; p <= toPos; p++) steps.push(p);
    if (steps.length === 0) { onDone(); return; }

    const STEP_MS = 160;
    steps.forEach((pos, i) => {
      setTimeout(() => {
        setVisPos(prev => playerIdx === 0 ? [pos, prev[1]] : [prev[0], pos]);
        if (soundOn) playSound('token_move');
        if (i === steps.length - 1) setTimeout(onDone, STEP_MS);
      }, i * STEP_MS);
    });
  }

  // ── Dice spin animation ────────────────────────────────────────────────────
  const [isDiceSpinning, setIsDiceSpinning] = useState(false);

  // ── Roll logic ─────────────────────────────────────────────────────────────
  const doRoll = useCallback((playerIdx: 0 | 1) => {
    if (phase === 'moving' || phase === 'gameover') return;
    setPhase('rolling');
    setIsDiceSpinning(true);

    diceAnim.setValue(0.7);
    Animated.spring(diceAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }).start();
    if (soundOn) playSound('dice_roll');

    setTimeout(() => {
      setIsDiceSpinning(false);
      const roll = Math.floor(Math.random() * 6) + 1;
      setDice(roll);

      const currentPos = positions[playerIdx];
      let newPos = currentPos + roll;
      if (newPos > 100) newPos = currentPos;

      animateMove(playerIdx, currentPos, newPos, () => {
        const { pos: finalPos, type } = applySnakeLadder(newPos);

        const afterLesson = () => {
          if (type === 'snake') {
            if (soundOn) playSound('token_capture');
            setMessage(playerIdx === 0 ? '🐍 Oops! Snake bites you!' : '🐍 Computer hit a snake!');
            animateMove(playerIdx, newPos, finalPos, () => {
              setPositions(prev => playerIdx === 0 ? [finalPos, prev[1]] : [prev[0], finalPos]);
              finishTurn(playerIdx, finalPos);
            });
          } else if (type === 'ladder') {
            if (soundOn) playSound('token_exit');
            setMessage(playerIdx === 0 ? '🪜 Lucky! Ladder up!' : '🪜 Computer climbs a ladder!');
            animateMove(playerIdx, newPos, finalPos, () => {
              setPositions(prev => playerIdx === 0 ? [finalPos, prev[1]] : [prev[0], finalPos]);
              finishTurn(playerIdx, finalPos);
            });
          } else {
            setPositions(prev => playerIdx === 0 ? [newPos, prev[1]] : [prev[0], newPos]);
            finishTurn(playerIdx, newPos);
          }
        };

        if (type && playerIdx === 0) {
          // Show lesson before moving on snake/ladder
          setLessonCell(newPos);
          setLessonType(type);
          lessonCb.current = afterLesson;
          setLessonVisible(true);
        } else {
          afterLesson();
        }
      });
    }, 550);
  }, [phase, positions, soundOn]);

  function finishTurn(playerIdx: 0 | 1, finalPos: number) {
    if (finalPos >= 100) {
      if (soundOn) playSound('win');
      setWinner(playerIdx);
      setPhase('gameover');
      setMessage(playerIdx === 0 ? '🏆 You Win!' : '🤖 Computer Wins!');
      if (playerIdx === 0) {
        setWinTip(WIN_TIPS[Math.floor(Math.random() * WIN_TIPS.length)]);
        onWin?.();
      } else {
        setWinTip(LOSS_TIPS[Math.floor(Math.random() * LOSS_TIPS.length)]);
        if (!twoPlayer) recordSnakeLoss().catch(() => {});
      }
      setTimeout(() => showInterstitialAd(), 2000);
      return;
    }
    const next = playerIdx === 0 ? 1 : 0;
    setTurn(next as 0 | 1);
    setPhase('idle');
    const nextLabel = twoPlayer
      ? (next === 0 ? `${playerName || 'Player 1'}'s turn!` : `${p2Label}'s turn!`)
      : (next === 0 ? 'Your turn — tap ROLL!' : 'Computer is thinking...');
    setMessage(nextLabel);
  }

  // AI (skip in 2-player mode)
  useEffect(() => {
    if (twoPlayer || turn !== 1 || phase !== 'idle') return;
    const t = setTimeout(() => doRoll(1), 1200 + Math.random() * 600);
    return () => clearTimeout(t);
  }, [turn, phase, twoPlayer]);

  const handleRoll = () => {
    // In 2-player mode, either player can press roll on their turn
    const isMyTurn = twoPlayer ? phase === 'idle' : (turn === 0 && phase === 'idle');
    if (!isMyTurn) return;
    const rollingPlayer = twoPlayer ? turn : 0;
    if (mathMode && rollingPlayer === 0) {
      // Roll the dice now but hold it behind the math modal
      setIsDiceSpinning(true);
      diceAnim.setValue(0.7);
      Animated.spring(diceAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }).start();
      if (soundOn) playSound('dice_roll');
      setTimeout(() => {
        setIsDiceSpinning(false);
        const roll = Math.floor(Math.random() * 6) + 1;
        setDice(roll);
        pendingRoll.current = roll;
        setPhase('math');
        setShowMath(true);
      }, 550);
    } else {
      doRoll(rollingPlayer);
    }
  };

  const handleLessonClose = () => {
    setLessonVisible(false);
    lessonCb.current?.();
    lessonCb.current = null;
  };

  const handleReset = () => {
    setPositions([0, 0]);
    setVisPos([0, 0]);
    setTurn(0);
    setDice(null);
    setPhase('idle');
    setWinner(null);
    setMessage('Your turn — tap ROLL!');
    setLessonVisible(false);
  };

  // Quit guard
  const handleHome = () => {
    if (phase === 'gameover') { onHome(); return; }
    Alert.alert('Exit Game', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Exit', style: 'destructive', onPress: onHome },
    ]);
  };

  // ── Board render ────────────────────────────────────────────────────────────
  const cells: React.ReactNode[] = [];
  for (let cell = 1; cell <= 100; cell++) {
    const { row, col } = cellCoords(cell);
    const isSnakeHead    = !!SNAKES[cell];
    const isLadderBottom = !!LADDERS[cell];
    const fill = isSnakeHead ? 'url(#cellSnake)' : isLadderBottom ? 'url(#cellLadder)'
      : (row + col) % 2 === 0 ? 'url(#cellLight)' : 'url(#cellDark)';
    cells.push(
      <Rect key={`c${cell}`} x={col * CS} y={row * CS} width={CS} height={CS}
        fill={fill} stroke={theme.gridStroke} strokeWidth={0.5} />
    );
    cells.push(
      <SvgText key={`t${cell}`}
        x={col * CS + CS * 0.5} y={row * CS + CS * 0.22}
        fontSize={CS * 0.22} fill="#5D4037" textAnchor="middle" fontWeight="bold">
        {cell}
      </SvgText>
    );
  }

  const [youPos, comPos] = visPos;
  const youCoords = youPos > 0 ? cellCenter(Math.min(youPos, 100)) : null;
  const comCoords = comPos > 0 ? cellCenter(Math.min(comPos, 100)) : null;

  const youName = playerName || 'YOU';

  // Math challenge state — shown before the roll resolves
  const [showMath,   setShowMath]   = useState(false);
  const pendingRoll  = useRef<number | null>(null);

  const handleMathResult = useCallback((correct: boolean) => {
    setShowMath(false);
    if (correct) incrementMathCorrect().catch(() => {});
    if (!correct) {
      // Wrong answer — skip turn
      setPhase('idle');
      setTurn(1);
      setDice(null);
      setMessage('Computer is thinking...');
    } else if (pendingRoll.current !== null) {
      // Correct — execute the roll that was computed while modal was open
      const roll = pendingRoll.current;
      pendingRoll.current = null;
      const currentPos = positions[0];
      let newPos = currentPos + roll;
      if (newPos > 100) newPos = currentPos;
      animateMove(0, currentPos, newPos, () => {
        const { pos: finalPos, type } = applySnakeLadder(newPos);
        const afterLesson = () => {
          if (type === 'snake') {
            if (soundOn) playSound('token_capture');
            setMessage('🐍 Oops! Snake bites you!');
            animateMove(0, newPos, finalPos, () => {
              setPositions(prev => [finalPos, prev[1]]);
              finishTurn(0, finalPos);
            });
          } else if (type === 'ladder') {
            if (soundOn) playSound('token_exit');
            setMessage('🪜 Lucky! Ladder up!');
            animateMove(0, newPos, finalPos, () => {
              setPositions(prev => [finalPos, prev[1]]);
              finishTurn(0, finalPos);
            });
          } else {
            setPositions(prev => [newPos, prev[1]]);
            finishTurn(0, newPos);
          }
        };
        if (type) {
          setLessonCell(newPos); setLessonType(type);
          lessonCb.current = afterLesson;
          setLessonVisible(true);
        } else { afterLesson(); }
      });
    }
  }, [positions, soundOn]);

  // Dice display for SnakeLadder uses the same Dice-like emoji approach
  const diceEmoji = dice ? ['','⚀','⚁','⚂','⚃','⚄','⚅'][dice] : '🎲';

  return (
    <LinearGradient colors={theme.gradient as any} style={styles.fill}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHome} style={styles.backBtn} activeOpacity={0.75}>
            <Text style={styles.backTxt}>← Menu</Text>
          </TouchableOpacity>
          <View style={styles.titleBadge}>
            <Text style={styles.title}>🐍 Snakes & Ladders</Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.backBtn} activeOpacity={0.75}>
            <Text style={styles.backTxt}>↺ New</Text>
          </TouchableOpacity>
        </View>

        {/* Message bar */}
        <LinearGradient
          colors={turn === 0
            ? [shade('#1565C0', 22), '#1565C0', shade('#1565C0', -22)]
            : [shade('#6A1B9A', 22), '#6A1B9A', shade('#6A1B9A', -22)]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.msgBar}
        >
          <View style={styles.msgSheen} pointerEvents="none" />
          <Text style={styles.msgTxt}>{message}</Text>
          {turn === 1 && phase === 'idle' && <ThinkingDots color="rgba(255,255,255,0.8)" />}
        </LinearGradient>

        {/* Board */}
        <View style={styles.boardWrap}>
          <Svg width={BOARD_SIZE} height={BOARD_SIZE}>
            {BOARD_DEFS}
            <Rect x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} fill="#F5F0E8" />
            {cells}
            {/* Ladders */}
            {Object.entries(LADDERS).map(([b, t]) => (
              <LadderSVG key={`l${b}`} bottom={Number(b)} top={t} />
            ))}
            {/* Snakes */}
            {Object.entries(SNAKES).map(([head, tail]) => (
              <G key={`s${head}`}>
                <Path d={snakePath(Number(head), tail)} stroke="#4CAF50" strokeWidth={CS * 0.18} fill="none" strokeLinecap="round" opacity={0.85} />
                <Path d={snakePath(Number(head), tail)} stroke="#81C784" strokeWidth={CS * 0.10} fill="none" strokeLinecap="round" strokeDasharray={`${CS * 0.15},${CS * 0.15}`} opacity={0.7} />
                <Circle cx={cellCenter(Number(head)).x} cy={cellCenter(Number(head)).y} r={CS * 0.18} fill="#388E3C" stroke="#1B5E20" strokeWidth={1.5} />
                <Circle cx={cellCenter(Number(head)).x - CS * 0.07} cy={cellCenter(Number(head)).y - CS * 0.05} r={CS * 0.05} fill="#F44336" />
                <Circle cx={cellCenter(Number(head)).x + CS * 0.07} cy={cellCenter(Number(head)).y - CS * 0.05} r={CS * 0.05} fill="#F44336" />
              </G>
            ))}
            <Rect x={1} y={1} width={BOARD_SIZE - 2} height={BOARD_SIZE - 2} fill="none" stroke={theme.boardBorder} strokeWidth={4} rx={6} />
            <Rect x={5} y={5} width={BOARD_SIZE - 10} height={BOARD_SIZE - 10} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.5} rx={3} />
            {comCoords && <Token cx={comCoords.x + CS * 0.15} cy={comCoords.y + CS * 0.05} gradId="tokenCom" />}
            {youCoords && <Token cx={youCoords.x - CS * 0.15} cy={youCoords.y + CS * 0.05} gradId="tokenYou" />}
          </Svg>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={[styles.playerPanel, turn === 0 && phase !== 'gameover' && styles.activePanel]}>
            <LinearGradient
              colors={[PLAYER_GLOSS.blue.light, PLAYER_GLOSS.blue.base, PLAYER_GLOSS.blue.dark]}
              start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.playerAvatar}
            >
              <View style={styles.avatarSheen} />
              <Text style={styles.playerPinEmoji}>📍</Text>
            </LinearGradient>
            <Text style={[styles.playerLabel, { color: '#1565C0' }]}>{youName.toUpperCase()}</Text>
            <Text style={styles.playerPos}>{youPos > 0 ? youPos : 'Start'}</Text>
          </View>

          <TouchableOpacity onPress={handleRoll} disabled={phase !== 'idle'} activeOpacity={0.8}>
            <Animated.View style={[
              { transform: [{ scale: diceAnim }] },
              phase !== 'idle' && styles.diceDisabled,
            ]}>
              <LinearGradient colors={['#FFFFFF', '#F3F4FA', '#DCE0F0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.diceBox}>
                <View style={styles.diceSheen} pointerEvents="none" />
                <Text style={styles.diceEmoji}>{isDiceSpinning ? (dice ? diceEmoji : '🎲') : diceEmoji}</Text>
                <Text style={styles.diceLabel}>
                  {phase === 'idle' ? 'ROLL' : dice ? `${dice}` : '···'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <View style={[styles.playerPanel, turn === 1 && phase !== 'gameover' && styles.activePanel]}>
            <LinearGradient
              colors={[PLAYER_GLOSS.red.light, PLAYER_GLOSS.red.base, PLAYER_GLOSS.red.dark]}
              start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.playerAvatar}
            >
              <View style={styles.avatarSheen} />
              <Text style={styles.playerPinEmoji}>📍</Text>
            </LinearGradient>
            <Text style={[styles.playerLabel, { color: '#C62828' }]}>
              {twoPlayer ? p2Label.toUpperCase() : 'COM 🤖'}
            </Text>
            <Text style={styles.playerPos}>{comPos > 0 ? comPos : 'Start'}</Text>
          </View>
        </View>

        {/* Math challenge (mathMode, human turn only) */}
        <MathChallengeModal
          visible={showMath}
          diceValue={dice}
          onResult={handleMathResult}
        />

        {/* Lesson modal */}
        <LessonModal
          visible={lessonVisible}
          type={lessonType}
          cell={lessonCell}
          onClose={handleLessonClose}
        />

        {/* Win overlay */}
        {winner !== null && (
          <WinOverlay
            winnerName={winner === 0 ? (playerName || 'You') : 'Computer'}
            winnerColor={winner === 0 ? '#1565C0' : '#E53935'}
            isHuman={winner === 0}
            tip={winTip}
            onPlayAgain={handleReset}
            onMenu={onHome}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  backBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  backTxt: { color: '#CE93D8', fontSize: 13, fontWeight: '700' },
  titleBadge: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14,
    backgroundColor: 'rgba(255,214,0,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,214,0,0.35)',
  },
  title: {
    color: '#FFD600', fontSize: 14, fontWeight: '900', letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },

  msgBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 7, paddingHorizontal: 16, marginHorizontal: 12, borderRadius: 20,
    marginBottom: 8, overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  msgSheen: {
    position: 'absolute', top: 2, left: '10%', right: '10%', height: '45%',
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)',
  },
  msgTxt: { color: 'white', fontWeight: '700', fontSize: 13 },

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
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', minWidth: 80, gap: 4,
  },
  activePanel: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2, borderColor: '#FFD600',
    shadowColor: '#FFD600', shadowOpacity: 0.5, shadowRadius: 8, elevation: 4,
  },
  playerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarSheen: {
    position: 'absolute', top: -8, left: -6, width: 30, height: 18,
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ rotate: '-20deg' }],
  },
  playerPinEmoji: { fontSize: 15 },
  playerLabel:    { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  playerPos:      { fontSize: 18, fontWeight: '900', color: 'white' },

  diceBox: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  diceSheen: {
    position: 'absolute', top: 4, left: 8, right: 8, height: '40%',
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.5)',
  },
  diceDisabled: { opacity: 0.55 },
  diceEmoji:    { fontSize: 32 },
  diceLabel:    { fontSize: 11, fontWeight: '900', color: '#4A148C', letterSpacing: 1 },
});
