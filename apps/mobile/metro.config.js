const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo/AppEntry') {
    return context.resolveRequest(context, 'expo-router/entry', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
