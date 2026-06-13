const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const rootNodeModules = path.resolve(projectRoot, '..', '..', 'node_modules');
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');

// Monorepo workaround: mobile (Expo 54 / React 19) and web (Next.js / React 18)
// share a root node_modules. Hoisted packages like @react-navigation/core resolve
// React 18 from the root, causing "Invalid hook call" errors.
// We intercept and redirect these modules to mobile's React 19 copy.
const REDIRECT = {
  react: path.join(mobileNodeModules, 'react', 'index.js'),
  scheduler: path.join(rootNodeModules, 'scheduler', 'index.js'),
  'use-sync-external-store': path.join(rootNodeModules, 'use-sync-external-store', 'index.js'),
};

const config = getDefaultConfig(projectRoot);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (REDIRECT[moduleName]) {
    return { type: 'sourceFile', filePath: REDIRECT[moduleName] };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
