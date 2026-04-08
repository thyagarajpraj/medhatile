const { isMetroRunning, isPortOpen, metroPort, spawnCli, waitForExit, waitForMetro } = require("./metro");
const { ensureReactNativeNodeModules } = require("./ensure-react-native-deps");

/**
 * Runs the Android install flow while reusing the Metro server already running on port 8081.
 * @returns {Promise<number>}
 */
async function runAndroid() {
  const androidProcess = spawnCli(["run-android", "--no-packager"]);
  return waitForExit(androidProcess);
}

async function main() {
  ensureReactNativeNodeModules();

  let metroProcess = null;
  const metroAlreadyRunning = await isMetroRunning(metroPort);

  if (metroAlreadyRunning) {
    throw new Error(
      `A Metro server is already running on port ${metroPort}. Stop it first, then rerun npm run dev so the mobile app can start with a fresh cache.`,
    );
  } else {
    const portOccupied = await isPortOpen(metroPort);

    if (portOccupied) {
      throw new Error(
        `Port ${metroPort} is already in use by a non-Metro process. Stop that process or free the port, then rerun npm run dev.`,
      );
    }

    console.log(`Starting Metro on port ${metroPort} with a clean cache...`);
    metroProcess = spawnCli(["start", "--port", String(metroPort), "--reset-cache", "--no-interactive"]);

    try {
      await waitForMetro(metroPort, 60000);
    } catch (error) {
      metroProcess.kill("SIGINT");
      throw error;
    }
  }

  const stopMetro = () => {
    if (metroProcess && !metroProcess.killed) {
      metroProcess.kill("SIGINT");
    }
  };

  process.on("SIGINT", () => {
    stopMetro();
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    stopMetro();
    process.exit(143);
  });

  const androidExitCode = await runAndroid();

  if (androidExitCode !== 0) {
    stopMetro();
    process.exit(androidExitCode);
  }

  if (!metroProcess) {
    return;
  }

  console.log("Android app launched. Metro is still running in this terminal. Press Ctrl+C to stop it.");

  const metroExitCode = await waitForExit(metroProcess);
  process.exit(metroExitCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
