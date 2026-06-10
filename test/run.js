// Runs all test files in this directory in sequence.
// Each test file exits 1 on failure; we propagate the overall status.

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter(f => /^test-.+\.js$/.test(f))
  .sort();

let failed = 0;
for (const f of files) {
  console.log("\n========== " + f + " ==========");
  const r = spawnSync(process.execPath, [path.join(dir, f)], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}
console.log("\n" + (failed ? `✗ ${failed} test file(s) failed` : "✓ all test files passed"));
process.exit(failed ? 1 : 0);
