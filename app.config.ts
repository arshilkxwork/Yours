import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Yours',
  slug: 'yours',
  extra: {
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});

