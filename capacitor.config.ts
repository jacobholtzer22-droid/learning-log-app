import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.learninglog.app',
  appName: 'learning-log-app',
  server: {
    url: 'https://learning-log-app.vercel.app',
    cleartext: true,
  },
};

export default config;
