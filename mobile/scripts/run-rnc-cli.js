const path = require("path");
const { spawn } = require("child_process");
const { ensureReactNativeNodeModules } = require("./ensure-react-native-deps");

const projectRoot = path.resolve(__dirname, "..");
const cliExecutable =
  process.platform === "win32"
    ? path.join(projectRoot, "node_modules", ".bin", "rnc-cli.CMD")
    : path.join(projectRoot, "node_modules", ".bin", "rnc-cli");

const args = process.argv.slice(2);

ensureReactNativeNodeModules();

const child = spawn(cliExecutable, args, {
  cwd: projectRoot,
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
