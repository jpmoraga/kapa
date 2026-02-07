/* eslint-disable no-console */
const { spawnSync } = require("child_process");
const path = require("path");

const runner = process.platform === "win32" ? "npx.cmd" : "npx";
const scriptPath = path.join(__dirname, "price-source-test.ts");

const result = spawnSync(
  runner,
  ["tsx", "-r", "dotenv/config", scriptPath],
  { stdio: "inherit" }
);

if (result.error) {
  console.error("Failed to run price source tests:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
