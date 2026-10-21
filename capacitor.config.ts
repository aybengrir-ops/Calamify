import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calamify.app',
  appName: 'Calamify',
  webDir: 'out',
  server: {
    url: 'https://calamifyy.vercel.app', // 👈 LINK DYAL SITE DYALK F VERCEL
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;