const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "..");
const reactNativePath = path.resolve(projectRoot, "node_modules", "react-native");
const localNodeModulesRoot = path.resolve(projectRoot, "node_modules");
const localReactNativeNodeModules = path.join(reactNativePath, "node_modules");
const reactNativeVersion = readReactNativeVersion();

/**
 * Ensures Metro can resolve React Native's own transitive dependencies under pnpm on Windows.
 * pnpm stores those dependencies next to the package in the .pnpm store, but Metro looks for
 * them under mobile/node_modules/react-native/node_modules when bundling from the symlinked path.
 */
function ensureReactNativeNodeModules() {
  if (!fs.existsSync(reactNativePath)) {
    return;
  }

  const storeNodeModules = resolveStoreNodeModules();

  if (!storeNodeModules) {
    return;
  }

  const expectedInvariantPath = path.join(storeNodeModules, "invariant");

  if (!fs.existsSync(expectedInvariantPath)) {
    return;
  }

  let shouldRelink = !fs.existsSync(localReactNativeNodeModules);

  if (!shouldRelink) {
    const localInvariantPath = path.join(localReactNativeNodeModules, "invariant");
    shouldRelink = !fs.existsSync(localInvariantPath);
  }

  if (!shouldRelink) {
    return;
  }

  if (fs.existsSync(localReactNativeNodeModules)) {
    fs.rmSync(localReactNativeNodeModules, { recursive: true, force: true });
  }

  if (process.platform === "win32") {
    execFileSync(
      path.join(process.env.SystemRoot || "C:\\Windows", "System32", "cmd.exe"),
      ["/c", `mklink /J "${localReactNativeNodeModules}" "${storeNodeModules}"`],
      { stdio: "ignore" },
    );
  } else {
    fs.symlinkSync(storeNodeModules, localReactNativeNodeModules, "dir");
  }

  ensureTopLevelReactNativeDependencies(storeNodeModules);
}

function resolveStoreNodeModules() {
  const resolvedReactNativePath = fs.realpathSync(reactNativePath);
  const inferredStoreNodeModules = path.dirname(resolvedReactNativePath);

  if (fs.existsSync(path.join(inferredStoreNodeModules, "invariant"))) {
    return inferredStoreNodeModules;
  }

  const pnpmStoreRoot = path.join(workspaceRoot, "node_modules", ".pnpm");

  if (!fs.existsSync(pnpmStoreRoot)) {
    return null;
  }

  const candidate = fs
    .readdirSync(pnpmStoreRoot)
    .find((entry) => entry.startsWith(`react-native@${reactNativeVersion}_`) || entry === `react-native@${reactNativeVersion}`);

  if (!candidate) {
    return null;
  }

  const candidateNodeModules = path.join(pnpmStoreRoot, candidate, "node_modules");

  if (!fs.existsSync(path.join(candidateNodeModules, "invariant"))) {
    return null;
  }

  return candidateNodeModules;
}

function readReactNativeVersion() {
  if (!fs.existsSync(reactNativePath)) {
    return null;
  }

  try {
    const packageJsonPath = path.join(reactNativePath, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return typeof packageJson.version === "string" ? packageJson.version : null;
  } catch {
    return null;
  }
}

function ensureTopLevelReactNativeDependencies(storeNodeModules) {
  const dependencyNames = fs
    .readdirSync(storeNodeModules)
    .filter((entry) => entry !== "react-native");

  for (const dependencyName of dependencyNames) {
    const sourcePath = path.join(storeNodeModules, dependencyName);
    const destinationPath = path.join(localNodeModulesRoot, dependencyName);

    if (fs.existsSync(destinationPath) || !fs.existsSync(sourcePath)) {
      continue;
    }

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    if (process.platform === "win32") {
      execFileSync(
        path.join(process.env.SystemRoot || "C:\\Windows", "System32", "cmd.exe"),
        ["/c", `mklink /J "${destinationPath}" "${sourcePath}"`],
        { stdio: "ignore" },
      );
    } else {
      fs.symlinkSync(sourcePath, destinationPath, "dir");
    }
  }
}

module.exports = {
  ensureReactNativeNodeModules,
};
