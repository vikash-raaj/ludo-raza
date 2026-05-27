import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export type SoundEvent =
  | 'dice_roll'
  | 'token_move'
  | 'token_exit'
  | 'token_capture'
  | 'win'
  | 'game_start';

// ── Audio sources ─────────────────────────────────────────────────────────────
const SOUND_SOURCES: Record<SoundEvent, number> = {
  dice_roll:     require('../../assets/sounds/dice_roll.wav'),
  token_move:    require('../../assets/sounds/token_move.wav'),
  token_exit:    require('../../assets/sounds/token_exit.wav'),
  token_capture: require('../../assets/sounds/token_capture.wav'),
  win:           require('../../assets/sounds/win.wav'),
  game_start:    require('../../assets/sounds/game_start.wav'),
};

// ── Haptic patterns (fire alongside audio) ────────────────────────────────────
const HAPTICS: Record<SoundEvent, () => void> = {
  dice_roll:     () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  token_move:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  token_exit:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  token_capture: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  win:           () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  game_start:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};

// ── Preloaded sound objects ───────────────────────────────────────────────────
let _pool: Partial<Record<SoundEvent, Audio.Sound>> = {};
let _ready = false;

// Call once at app start (e.g. in App.tsx useEffect).
// Preloading keeps playback latency near zero during the game.
export async function initSounds(): Promise<void> {
  if (_ready) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });
    await Promise.all(
      (Object.entries(SOUND_SOURCES) as [SoundEvent, number][]).map(async ([key, src]) => {
        const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
        _pool[key] = sound;
      })
    );
    _ready = true;
  } catch (e) {
    // Audio unavailable (e.g. simulator without audio) — haptics still work
    console.warn('[soundManager] init failed:', e);
  }
}

// Release all audio resources (call when leaving the game screen, optional).
export async function unloadSounds(): Promise<void> {
  await Promise.all(
    (Object.values(_pool) as Audio.Sound[]).map(s => s.unloadAsync().catch(() => {}))
  );
  _pool  = {};
  _ready = false;
}

// Fire audio + haptic for a game event.  Non-blocking; errors are swallowed.
export function playSound(event: SoundEvent): void {
  // Haptic fires synchronously for the fastest tactile response
  try { HAPTICS[event](); } catch {}

  // Audio playback (rewind to start then play, so rapid re-triggers work)
  const sound = _pool[event];
  if (sound) {
    sound
      .setPositionAsync(0)
      .then(() => sound.playAsync())
      .catch(() => {});
  }
}
