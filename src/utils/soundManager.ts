import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export type SoundEvent =
  | 'dice_roll'
  | 'token_move'
  | 'token_exit'
  | 'token_capture'
  | 'win'
  | 'game_start'
  | 'countdown_beep'
  | 'countdown_go';

const SOUND_SOURCES: Record<SoundEvent, number> = {
  dice_roll:      require('../../assets/sounds/dice_roll.wav'),
  token_move:     require('../../assets/sounds/token_move.wav'),
  token_exit:     require('../../assets/sounds/token_exit.wav'),
  token_capture:  require('../../assets/sounds/token_capture.wav'),
  win:            require('../../assets/sounds/win.wav'),
  game_start:     require('../../assets/sounds/game_start.wav'),
  countdown_beep: require('../../assets/sounds/countdown_beep.wav'),
  countdown_go:   require('../../assets/sounds/countdown_go.wav'),
};

const HAPTICS: Record<SoundEvent, () => void> = {
  dice_roll:      () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  token_move:     () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  token_exit:     () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  token_capture:  () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  win:            () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  game_start:     () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  countdown_beep: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  countdown_go:   () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};

let _pool: Partial<Record<SoundEvent, Audio.Sound>> = {};
let _ready = false;
let _hapticsOn = true;

export function setHapticsEnabled(on: boolean): void { _hapticsOn = on; }

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
    console.warn('[soundManager] init failed:', e);
  }
}

export async function unloadSounds(): Promise<void> {
  await Promise.all(
    (Object.values(_pool) as Audio.Sound[]).map(s => s.unloadAsync().catch(() => {}))
  );
  _pool  = {};
  _ready = false;
}

export function playSound(event: SoundEvent): void {
  if (_hapticsOn) { try { HAPTICS[event](); } catch {} }
  const sound = _pool[event];
  if (sound) {
    sound.setPositionAsync(0).then(() => sound.playAsync()).catch(() => {});
  }
}
