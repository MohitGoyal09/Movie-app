module.exports = {
  expo: {
    name: 'movie-app',
    slug: 'movie-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png'
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true
    },
    extra: {
      EXPO_PUBLIC_OMDB_API_KEY: process.env.EXPO_PUBLIC_OMDB_API_KEY,
      eas: {
        projectId: "38660b36-798f-471c-ab2b-42349e732ea1"
      }
    }
  }
};
