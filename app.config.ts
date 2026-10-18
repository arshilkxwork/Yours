import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Whisper',
  slug: 'whisper-couples',
  extra: {
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});
