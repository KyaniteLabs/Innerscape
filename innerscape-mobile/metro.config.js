// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Configure watchFolders for monorepo packages
// Note: We only watch the src folders, not node_modules
config.watchFolders = [
  projectRoot,
  path.resolve(monorepoRoot, "lifeos-shared/src"),
  path.resolve(monorepoRoot, "lifeos-design-system"),
];

// Block lifeos-shared/node_modules from being processed
config.resolver.blockList = [
  /lifeos-shared\/node_modules\/.*/,
  /lifeos-design-system\/node_modules\/.*/,
];

// Configure extraNodeModules for monorepo resolution
// Use a Proxy to ensure all dependencies resolve from this app's node_modules
config.resolver.extraNodeModules = new Proxy(
  {
    "@lifeos/shared": path.resolve(monorepoRoot, "lifeos-shared/src"),
  },
  {
    get: (target, name) => {
      if (target.hasOwnProperty(name)) {
        return target[name];
      }
      // Resolve all other modules from this app's node_modules only
      return path.resolve(projectRoot, "node_modules", String(name));
    },
  }
);

// Only use this project's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
];

// Add Skia asset extensions
config.resolver.assetExts.push('sksl');

module.exports = config;
