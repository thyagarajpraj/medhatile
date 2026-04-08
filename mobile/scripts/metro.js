const http = require("http");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const metroPort = 8081;
const cliExecutable =
  process.platform === "win32"
    ? path.join(projectRoot, "node_modules", ".bin", "rnc-cli.CMD")
    : path.join(projectRoot, "node_modules", ".bin", "rnc-cli");

/**
 * Checks whether a local TCP port is already accepting connections.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

/**
 * Detects whether the process listening on the Metro port is actually Metro.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isMetroRunning(port) {
  return new Promise((resolve) => {
    const request = http.get(
      {
        host: "127.0.0.1",
        port,
        path: "/status",
        timeout: 2000,
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve(response.statusCode === 200 && body.includes("packager-status:running"));
        });
      },
    );

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });

    request.on("error", () => {
      resolve(false);
    });
  });
}

/**
 * Waits for Metro to begin responding on the configured port.
 * @param {number} port
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
async function waitForMetro(port, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isMetroRunning(port)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Metro did not become ready on port ${port} within ${timeoutMs}ms.`);
}

/**
 * Spawns the local React Native CLI with inherited terminal output.
 * @param {string[]} args
 * @returns {import("child_process").ChildProcess}
 */
function spawnCli(args) {
  return spawn(cliExecutable, args, {
    cwd: projectRoot,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
}

/**
 * Awaits a child process exit and resolves with its numeric exit code.
 * @param {import("child_process").ChildProcess} child
 * @returns {Promise<number>}
 */
function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 0));
  });
}

module.exports = {
  cliExecutable,
  isMetroRunning,
  isPortOpen,
  metroPort,
  projectRoot,
  spawnCli,
  waitForExit,
  waitForMetro,
};
