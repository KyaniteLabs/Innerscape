// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Configure workspace resolution for monorepo
config.projectRoot = __dirname;
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, "../lifeos-shared"),
  path.resolve(__dirname, "../lifeos-design-system"),
];

// Properly resolve node_modules from workspace packages
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => {
      if (target.hasOwnProperty(name)) {
        return target[name];
      }

      // Try to resolve from parent directories
      const appNodeModules = path.resolve(__dirname, "node_modules", String(name));
      const monorepoNodeModules = path.resolve(__dirname, "..", "node_modules", String(name));

      try {
        if (require.resolve(appNodeModules)) {
          return appNodeModules;
        }
      } catch {
        // Ignore
      }

      try {
        if (require.resolve(monorepoNodeModules)) {
          return monorepoNodeModules;
        }
      } catch {
        // Ignore
      }

      return path.resolve(__dirname, "node_modules", String(name));
    },
  }
);

module.exports = withNativeWind(config, { input: "./global.css" });
