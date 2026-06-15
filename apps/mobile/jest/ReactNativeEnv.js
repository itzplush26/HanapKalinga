const path = require('path');

const resolveJestEnv = () => {
  const candidates = [
    path.resolve(__dirname, '../node_modules/jest-environment-node'),
    path.resolve(__dirname, '../../node_modules/jest-environment-node'),
    path.resolve(__dirname, '../../../node_modules/jest-environment-node'),
    require.resolve('jest-environment-node'),
  ];
  for (const c of candidates) {
    try { return require(c).TestEnvironment; } catch { /* try next */ }
  }
  throw new Error('jest-environment-node not found');
};

const NodeEnv = resolveJestEnv();

module.exports = class ReactNativeEnv extends NodeEnv {
  customExportConditions = ['require', 'react-native'];
};
