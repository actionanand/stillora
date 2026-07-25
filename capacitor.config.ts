import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.actionanand.stillora.app',
  appName: 'Stillora',
  webDir: 'dist/stillora/browser',
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#07140e' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#07140e',
      showSpinner: false,
    },
  },
};

export default config;
