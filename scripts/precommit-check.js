const fs = require("fs");
const path = require("path");

console.log("Running custom pre-commit checks...\n");

/**
 * Returns all file paths within a directory recursively.
 */
function getAllFiles(dir, files = []) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
      return;
    }

    files.push(fullPath);
  });

  return files;
}

/**
 * Blocks commits when web source files still include console.log statements.
 */
function checkConsoleLogs() {
  const sourceDir = path.resolve(__dirname, "..", "web", "src");
  const files = getAllFiles(sourceDir);

  const hasConsoleLog = files.some((file) => {
    const content = fs.readFileSync(file, "utf8");
    return content.includes("console.log");
  });

  if (hasConsoleLog) {
    console.error("Remove console.log before committing.");
    process.exit(1);
  }
}

/**
 * Enforces a minimum web coverage threshold using the Vitest summary output.
 */
function checkCoverage() {
  const coverageFile = path.resolve(__dirname, "..", "web", "coverage", "coverage-summary.json");

  if (!fs.existsSync(coverageFile)) {
    console.warn("Coverage report not found, skipping coverage threshold check.");
    return;
  }

  const coverage = JSON.parse(fs.readFileSync(coverageFile, "utf8"));
  const lineCoverage = coverage.total.lines.pct;

  if (lineCoverage < 85) {
    console.error(`Coverage is ${lineCoverage}%. Must be >= 85%.`);
    process.exit(1);
  }
}

checkConsoleLogs();
checkCoverage();

console.log("All pre-commit checks passed.\n");
