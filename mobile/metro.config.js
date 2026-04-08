const fs = require("fs");
const { builtinModules } = require("module");
const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const sharedRoot = path.resolve(workspaceRoot, "shared");
const pnpmStoreRoot = path.resolve(workspaceRoot, "node_modules", ".pnpm");
const reactNativePackageRoot = fs.realpathSync(path.resolve(projectRoot, "node_modules", "react-native"));
const reactNativeStoreNodeModules = path.dirname(reactNativePackageRoot);
const projectNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");
const nodeBuiltinModules = new Set(builtinModules.flatMap((moduleName) => [moduleName, `node:${moduleName}`]));

function uniquePaths(pathsToDeduplicate) {
  return [...new Set(pathsToDeduplicate.filter(Boolean))];
}

function resolveBareModuleFromOrigin(originModulePath, moduleName) {
  if (
    !originModulePath ||
    moduleName.startsWith(".") ||
    path.isAbsolute(moduleName) ||
    nodeBuiltinModules.has(moduleName)
  ) {
    return null;
  }

  const originDirectory = path.dirname(originModulePath);
  const resolvedOriginDirectory = fs.existsSync(originDirectory)
    ? fs.realpathSync(originDirectory)
    : originDirectory;

  try {
    return require.resolve(moduleName, {
      paths: uniquePaths([
        resolvedOriginDirectory,
        originDirectory,
        reactNativeStoreNodeModules,
        projectNodeModules,
        workspaceNodeModules,
      ]),
    });
  } catch {
    return null;
  }
}

/**
 * Keep Metro aware of the workspace root so the mobile app can resolve the shared packages
 * published from this monorepo.
 *
 * @type {import("@react-native/metro-config").MetroConfig}
 */
const config = {
  watchFolders: [sharedRoot, pnpmStoreRoot, reactNativeStoreNodeModules],
  resolver: {
    disableHierarchicalLookup: true,
    unstable_enableSymlinks: true,
    extraNodeModules: {
      react: path.resolve(projectRoot, "node_modules", "react"),
      "react-native": path.resolve(projectRoot, "node_modules", "react-native"),
    },
    nodeModulesPaths: [
      reactNativeStoreNodeModules,
      projectNodeModules,
      workspaceNodeModules,
    ],
    resolveRequest(context, moduleName, platform) {
      try {
        return context.resolveRequest(context, moduleName, platform);
      } catch (error) {
        const resolvedDependency = resolveBareModuleFromOrigin(context.originModulePath, moduleName);

        if (resolvedDependency) {
          return {
            filePath: resolvedDependency,
            type: "sourceFile",
          };
        }

        throw error;
      }
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
