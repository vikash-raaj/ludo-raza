/**
 * Generates simple WAV sound effects for LudoRaza.
 * Run once with:  node generate-sounds.js
 */
const fs = require('fs');

const SR = 22050; // sample rate (Hz)

// ── WAV encoder ──────────────────────────────────────────────────────────────
function toWav(samples) {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
    pcm.writeInt16LE(s, i * 2);
  }
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0);
  hdr.writeUInt32LE(36 + pcm.length, 4);
  hdr.write('WAVE', 8);
  hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16);    // PCM subchunk size
  hdr.writeUInt16LE(1, 20);     // PCM format
  hdr.writeUInt16LE(1, 22);     // mono
  hdr.writeUInt32LE(SR, 24);
  hdr.writeUInt32LE(SR * 2, 28); // byte rate
  hdr.writeUInt16LE(2, 32);      // block align
  hdr.writeUInt16LE(16, 34);     // bits/sample
  hdr.write('data', 36);
  hdr.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([hdr, pcm]);
}

const TAU = Math.PI * 2;

// ── Sound definitions ─────────────────────────────────────────────────────────

// 1. dice_roll – white-noise burst that decays quickly (300 ms)
const diceRoll = (() => {
  const n = Math.round(SR * 0.30);
  return Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const env = Math.exp(-t * 14);           // fast decay
    return env * 0.55 * (Math.random() * 2 - 1);
  });
})();

// 2. token_move – soft click: quick 880 Hz tone with sharp decay (120 ms)
const tokenMove = (() => {
  const n = Math.round(SR * 0.12);
  return Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const env = Math.exp(-t * 55);
    return env * 0.45 * Math.sin(TAU * 880 * t);
  });
})();

// 3. token_exit – exciting two-step rise: C5 → G5 (280 ms)
const tokenExit = (() => {
  const n = Math.round(SR * 0.28);
  return Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    // C5 first note
    const e1 = Math.exp(-t * 22);
    s += e1 * 0.42 * Math.sin(TAU * 523 * t);
    // G5 comes in at 110 ms
    if (t >= 0.11) {
      const t2 = t - 0.11;
      const e2 = Math.exp(-t2 * 18);
      s += e2 * 0.50 * Math.sin(TAU * 784 * t);
    }
    return s;
  });
})();

// 4. token_capture – descending frequency sweep 700 → 220 Hz (350 ms)
const tokenCapture = (() => {
  const dur = 0.35;
  const n   = Math.round(SR * dur);
  let phase = 0;
  return Array.from({ length: n }, (_, i) => {
    const t    = i / SR;
    const freq = 700 - (700 - 220) * (t / dur);
    phase += TAU * freq / SR;
    const env = Math.exp(-t * 9);
    return env * 0.50 * Math.sin(phase);
  });
})();

// 5. win – ascending arpeggio C5 → E5 → G5 → C6 (900 ms)
const win = (() => {
  const notes    = [523, 659, 784, 1047]; // C5 E5 G5 C6
  const stepDur  = 0.17;
  const totalDur = notes.length * stepDur + 0.28; // last note lingers
  const n        = Math.round(SR * totalDur);
  return Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    notes.forEach((freq, idx) => {
      const start = idx * stepDur;
      const isLast = idx === notes.length - 1;
      const end = isLast ? totalDur : start + stepDur + 0.08;
      if (t >= start && t < end) {
        const tNote    = t - start;
        const noteDur  = end - start;
        const attack   = Math.min(tNote * 50, 1);
        const release  = isLast ? Math.max(1 - (tNote / noteDur), 0) : 1;
        s += attack * release * 0.38 * Math.sin(TAU * freq * t);
        // Add a soft harmonic for warmth
        s += attack * release * 0.12 * Math.sin(TAU * freq * 2 * t);
      }
    });
    return s;
  });
})();

// 6. game_start – Candy Crush-style fanfare: drum pop + 5-note C-major ascent (1.3 s)
const gameStart = (() => {
  const totalDur = 1.30;
  const n = Math.round(SR * totalDur);
  // ascending C major pentatonic: C5 E5 G5 C6 E6
  const melody = [
    { freq: 523,  start: 0.06, dur: 0.18 },
    { freq: 659,  start: 0.20, dur: 0.18 },
    { freq: 784,  start: 0.34, dur: 0.18 },
    { freq: 1047, start: 0.48, dur: 0.25 },
    { freq: 1319, start: 0.68, dur: 0.62 }, // E6 rings out
  ];
  return Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    // Opening drum pop (0–60 ms): noise burst + low thump
    if (t < 0.06) {
      const env = Math.exp(-t * 80);
      s += env * 0.35 * (Math.random() * 2 - 1);           // snare noise
      s += Math.exp(-t * 40) * 0.5 * Math.sin(TAU * 120 * t); // kick thump
    }
    // Melody notes
    melody.forEach(({ freq, start, dur }) => {
      if (t >= start && t < start + dur) {
        const tn  = t - start;
        const att = Math.min(tn * 80, 1);
        const rel = Math.max(1 - tn / dur, 0);
        s += att * rel * 0.38 * Math.sin(TAU * freq * t);
        s += att * rel * 0.14 * Math.sin(TAU * freq * 2 * t); // octave
        s += att * rel * 0.07 * Math.sin(TAU * freq * 3 * t); // warmth
      }
    });
    return Math.max(-1, Math.min(1, s));
  });
})();

// 7. countdown_beep – sharp 1 kHz tick for 3-2-1 countdown (200 ms)
const countdownBeep = (() => {
  const n = Math.round(SR * 0.20);
  return Array.from({ length: n }, (_, i) => {
    const t   = i / SR;
    const att = Math.min(t * 200, 1);
    const rel = Math.exp(-t * 18);
    return att * rel * 0.55 * Math.sin(TAU * 1000 * t);
  });
})();

// 8. countdown_go – punchy "GO!" hit: drum crack + C5 chord stab (500 ms)
const countdownGo = (() => {
  const n = Math.round(SR * 0.50);
  const chord = [523, 659, 784]; // C5 E5 G5
  return Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    // crack
    if (t < 0.03) s += Math.exp(-t * 150) * 0.5 * (Math.random() * 2 - 1);
    chord.forEach(freq => {
      const rel = Math.exp(-t * 7);
      s += rel * 0.25 * Math.sin(TAU * freq * t);
    });
    return Math.max(-1, Math.min(1, s));
  });
})();

// ── Write files ───────────────────────────────────────────────────────────────
const out = './assets/sounds';
fs.mkdirSync(out, { recursive: true });

const files = { dice_roll: diceRoll, token_move: tokenMove, token_exit: tokenExit, token_capture: tokenCapture, win, game_start: gameStart, countdown_beep: countdownBeep, countdown_go: countdownGo };

for (const [name, samples] of Object.entries(files)) {
  const buf  = toWav(samples);
  const path = `${out}/${name}.wav`;
  fs.writeFileSync(path, buf);
  console.log(`✓  ${path}  (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log('\nDone! All sounds written to assets/sounds/');
