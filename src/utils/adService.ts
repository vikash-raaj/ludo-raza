import {
  AppOpenAd,
  InterstitialAd,
  AdEventType,
  MobileAds,
  AdsConsent,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';
import { AppState, AppStateStatus } from 'react-native';

const APP_OPEN_UNIT_ID     = 'ca-app-pub-2133408429040664/4963163585';
const INTERSTITIAL_UNIT_ID = 'ca-app-pub-2133408429040664/6906270418';

// ── Consent (UMP / GDPR) ───────────────────────────────────────────────────────

async function requestConsent(): Promise<void> {
  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();
    if (
      consentInfo.isConsentFormAvailable &&
      consentInfo.status === AdsConsentStatus.REQUIRED
    ) {
      await AdsConsent.showForm();
    }
  } catch {
    // Consent errors must not block ad initialization
  }
}

// ── Initialization ─────────────────────────────────────────────────────────────

export async function initAds() {
  try {
    await requestConsent();
    await MobileAds().initialize();
    setupAppOpenAd();
    createInterstitialAd();
  } catch {
    // Ad SDK failures must never crash the app
  }
}

// ── App Open Ad ────────────────────────────────────────────────────────────────

let appOpenAd: AppOpenAd | null = null;
let appOpenAdLoaded = false;
let isShowingAppOpenAd = false;

function loadAppOpenAd() {
  appOpenAdLoaded = false;
  appOpenAd = AppOpenAd.createForAdRequest(APP_OPEN_UNIT_ID);

  appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
    appOpenAdLoaded = true;
  });
  appOpenAd.addAdEventListener(AdEventType.OPENED, () => {
    isShowingAppOpenAd = true;
  });
  appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
    isShowingAppOpenAd = false;
    loadAppOpenAd();
  });
  appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
    appOpenAdLoaded = false;
    setTimeout(loadAppOpenAd, 30_000);
  });

  appOpenAd.load();
}

function setupAppOpenAd() {
  loadAppOpenAd();

  // Track previous state so we only react to background → active transitions.
  // The app starts in 'active', so the first CHANGE event fires when the user
  // backgrounds the app — meaning cold-launch is intentionally excluded.
  let previousState: AppStateStatus = AppState.currentState;

  AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (previousState !== 'active' && nextState === 'active' && !isShowingAppOpenAd) {
      if (appOpenAdLoaded && appOpenAd) {
        appOpenAd.show();
      }
    }
    previousState = nextState;
  });
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
