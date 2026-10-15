import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dandali.connect',
  appName: 'Dandali Connect',
  webDir: 'public',
  server: {
    url: 'https://dandali-connect-gu5z.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#120E0C',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
};

export default config;
