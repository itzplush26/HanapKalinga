const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const rootNodeModules = path.resolve(projectRoot, '..', '..', 'node_modules');
const mobileNodeModules = path.resolve(projectRoot, 'node_modules');
const mobileReactDir = path.join(mobileNodeModules, 'react');

// Monorepo workaround: mobile (Expo 54 / React 19) and web (Next.js / React 18)
// share a root node_modules. Hoisted packages like @react-navigation/core resolve
// React 18 from the root, causing "Invalid hook call" errors.
// We intercept and redirect these modules to mobile's React 19 copy.
const REDIRECT = {
  'use-sync-external-store': path.join(rootNodeModules, 'use-sync-external-store', 'index.js'),
};

const config = getDefaultConfig(projectRoot);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react and all react/* subpath imports to mobile's React 19
  if (moduleName === 'react') {
    return { type: 'sourceFile', filePath: path.join(mobileReactDir, 'index.js') };
  }
  if (moduleName.startsWith('react/')) {
    // Use Node's module resolution which respects package.json exports (React 19
    // uses exports: { "./jsx-dev-runtime": "./jsx-dev-runtime.js", ... })
    const resolvedPath = require.resolve(moduleName, { paths: [mobileReactDir] });
    return { type: 'sourceFile', filePath: resolvedPath };
  }
  if (REDIRECT[moduleName]) {
    return { type: 'sourceFile', filePath: REDIRECT[moduleName] };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
