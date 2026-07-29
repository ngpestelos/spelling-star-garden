#!/usr/bin/env node
/**
 * Headless runner for public/ssg-tests.js (same suites as test.html).
 * Usage: node scripts/run-tests.mjs
 * Exit 0 on ALL PASSED, 1 on failure.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

function loadScript(filename, context) {
  const full = path.join(publicDir, filename);
  const code = fs.readFileSync(full, "utf8");
  vm.runInContext(code, context, { filename: full });
}

const context = vm.createContext({
  console,
  Math,
  Set,
  Map,
  Array,
  Object,
  String,
  Number,
  Boolean,
  JSON,
  RegExp,
  Error,
  globalThis: undefined,
});
/* words.js / ssg-tests.js attach to globalThis or window */
context.globalThis = context;
context.window = context;

loadScript("words.js", context);
loadScript("ssg-tests.js", context);

if (typeof context.runSsgTests !== "function") {
  console.error("runSsgTests not found after loading ssg-tests.js");
  process.exit(1);
}

const result = context.runSsgTests();
for (const line of result.lines) {
  console.log(line);
}

if (result.fail !== 0) {
  process.exit(1);
}
process.exit(0);
