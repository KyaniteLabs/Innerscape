// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Configure watchFolders for monorepo packages
config.watchFolders = [
  projectRoot,
  path.resolve(monorepoRoot, "lifeos-shared"),
  path.resolve(monorepoRoot, "lifeos-design-system"),
];

// Configure extraNodeModules for monorepo resolution
// This tells Metro where to find packages from the monorepo root
config.resolver.extraNodeModules = {
  "@lifeos/shared": path.resolve(monorepoRoot, "lifeos-shared"),
  "@lifeos/design-system": path.resolve(monorepoRoot, "lifeos-design-system"),
};

module.exports = config;
