#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const JS_DIR = path.join(ROOT, "js");

function listJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listJsFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function main() {
  const files = listJsFiles(JS_DIR);
  const failed = [];
  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    try {
      new vm.Script(code, { filename: rel(file) });
    } catch (error) {
      failed.push({ file: rel(file), error: error.message });
    }
  }

  if (failed.length > 0) {
    console.error(`[FAIL] Runtime syntax validation failed (${failed.length})`);
    for (const item of failed) {
      console.error(`- ${item.file}: ${item.error}`);
    }
    process.exit(1);
  }

  console.log(`[PASS] Runtime syntax validation passed (${files.length} files)`);
}

main();
