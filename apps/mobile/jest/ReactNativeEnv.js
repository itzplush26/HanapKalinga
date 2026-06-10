const path = require('path');

// Force resolution to mobile's own jest-environment-node v30
const NodeEnv = require(path.resolve(__dirname, '../node_modules/jest-environment-node')).TestEnvironment;

module.exports = class ReactNativeEnv extends NodeEnv {
  customExportConditions = ['require', 'react-native'];
};
