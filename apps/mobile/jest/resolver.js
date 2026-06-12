const path = require('path');
const fs = require('fs');
const defaultResolver = require('jest-resolve/build/defaultResolver');

const mobileReactPath = path.resolve(__dirname, '../node_modules/react');
const mobileReactNativePath = path.resolve(__dirname, '../node_modules/react-native');

module.exports = (request, options) => {
  if (request === 'react') {
    return mobileReactPath;
  }
  if (request === 'react-native') {
    return mobileReactNativePath;
  }
  return defaultResolver.default(request, options);
};
