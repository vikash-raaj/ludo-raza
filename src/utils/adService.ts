import {
  AppOpenAd,
  InterstitialAd,
  AdEventType,
  MobileAds,
} from 'react-native-google-mobile-ads';

const APP_OPEN_UNIT_ID     = 'ca-app-pub-2133408429040664/4963163585';
const INTERSTITIAL_UNIT_ID = 'ca-app-pub-2133408429040664/6906270418';

// ── Initialization ─────────────────────────────────────────────────────────────

export async function initAds() {
  await MobileAds().initialize();
  createAppOpenAd();
  createInterstitialAd();
}

// ── App Open Ad ────────────────────────────────────────────────────────────────

let appOpenAd: AppOpenAd | null = null;

function createAppOpenAd() {
  appOpenAd = AppOpenAd.createForAdRequest(APP_OPEN_UNIT_ID);
  appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
    appOpenAd?.show();
  });
  appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
    createAppOpenAd();
  });
  appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
    setTimeout(createAppOpenAd, 30_000);
  });
  appOpenAd.load();
}

// ── Interstitial Ad ────────────────────────────────────────────────────────────

let interstitialAd: InterstitialAd | null = null;
let interstitialReady = false;

function createInterstitialAd() {
  interstitialReady = false;
  interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID);
  interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
    interstitialReady = true;
  });
  interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    createInterstitialAd();
  });
  interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
    setTimeout(createInterstitialAd, 30_000);
  });
  interstitialAd.load();
}

export function showInterstitialAd() {
  if (interstitialReady && interstitialAd) {
    interstitialAd.show();
  }
}
