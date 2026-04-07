import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Unique app bundle ID — follows reverse-DNS convention
  appId: 'co.bullish.stealthfinder',
  appName: 'Stealth Finder',

  // Vite builds to 'dist/' — Capacitor copies this into the iOS project
  webDir: 'dist',

  server: {
    // In development, point to the local Vite dev server so you can
    // hot-reload inside Xcode Simulator without rebuilding.
    // Comment this out for production builds (App Store / TestFlight).
    // url: 'http://localhost:3000',
    // cleartext: true,
  },

  ios: {
    // Scheme used by WKWebView — determines the app:// URL origin
    scheme: 'StealthFinder',

    // Allow non-HTTPS requests to Railway in dev. Remove for App Store.
    // allowsLinkPreview: false,

    // Hides the native status bar area (we style our own top padding)
    contentInset: 'automatic',
  },

  plugins: {
    SplashScreen: {
      // Dark navy background — matches the app's loading state
      backgroundColor: '#020A52',
      launchShowDuration: 1200,
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      // Light status bar text (white clock/battery) on the dark nav background
      style: 'LIGHT',
      backgroundColor: '#020A52',
    },
  },
};

export default config;
