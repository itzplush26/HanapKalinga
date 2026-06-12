const path = require('path');

module.exports = {
  preset: 'react-native',
  testEnvironment: path.resolve(__dirname, 'jest/ReactNativeEnv.js'),
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@hanapkalinga/shared/(.*)$':
      '<rootDir>/../../packages/shared/src/$1',
    '^react$': '<rootDir>/node_modules/react',
    '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|expo|@expo|@unimodules|unimodules|expo-asset|expo-constants|expo-font|expo-linking|expo-secure-store|expo-splash-screen|expo-status-bar|expo-router|@react-navigation|@supabase|react-native-url-polyfill|lucide-react-native)/)',
  ],
};
