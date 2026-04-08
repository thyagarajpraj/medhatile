const { isMetroRunning, isPortOpen, metroPort, spawnCli, waitForExit, waitForMetro } = require("./metro");
const { ensureReactNativeNodeModules } = require("./ensure-react-native-deps");

async function main() {
  ensureReactNativeNodeModules();

  if (await isMetroRunning(metroPort)) {
    throw new Error(
      `A Metro server is already running on port ${metroPort}. Stop it first, then rerun npm run start so this project can boot with a fresh cache.`,
    );
  }

  if (await isPortOpen(metroPort)) {
    throw new Error(
      `Port ${metroPort} is already in use by a non-Metro process. Stop that process or free the port, then rerun npm run start.`,
    );
  }

  console.log(`Starting Metro on port ${metroPort} with a clean cache...`);
  const metroProcess = spawnCli(["start", "--port", String(metroPort), "--reset-cache", "--no-interactive"]);

  try {
    await waitForMetro(metroPort, 60000);
    console.log("Metro is running. Press Ctrl+C to stop it.");
  } catch (error) {
    metroProcess.kill("SIGINT");
    throw error;
  }

  const exitCode = await waitForExit(metroProcess);
  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
