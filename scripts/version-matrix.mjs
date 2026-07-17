#!/usr/bin/env node
/**
 * version-matrix.mjs — CI gate: every `<Versioned version="pkg==X …">` in the guide must pin a
 * version listed in supported-versions.json. A version bumped in prose without being added to the
 * tested matrix trips CI (complements freshness-expiry: that gate is age, this one is support).
 *
 *   node scripts/version-matrix.mjs             # scan src/content, fail on unsupported pins
 *   node scripts/version-matrix.mjs --self-test # unit-test the scanner
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const VERSIONED = /<Versioned\b[^>]*\bversion="([^"]*)"/g;
const PIN = /([a-z0-9][a-z0-9_.-]*)==([0-9][^\s·,;]*)/gi;

export function unsupportedPins(text, matrix) {
  const bad = [];
  VERSIONED.lastIndex = 0;
  let v;
  while ((v = VERSIONED.exec(text)) !== null) {
    PIN.lastIndex = 0;
    let p;
    while ((p = PIN.exec(v[1])) !== null) {
      const [pkg, ver] = [p[1].toLowerCase(), p[2]];
      const ok = Array.isArray(matrix[pkg]) && matrix[pkg].includes(ver);
      if (!ok) bad.push({ pkg, ver, listed: matrix[pkg] || null });
    }
  }
  return bad;
}

function walk(dir) {
  const out = [];
  let e;
  try { e = readdirSync(dir); } catch { return out; }
  for (const n of e) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if ([".mdx", ".md"].includes(extname(p))) out.push(p);
  }
  return out;
}

if (process.argv.includes("--self-test")) {
  const matrix = { torch: ["2.13.0"], triton: ["3.7.1"] };
  const good = unsupportedPins('<Versioned version="torch==2.13.0 · triton==3.7.1">x</Versioned>', matrix);
  const bad = unsupportedPins('<Versioned version="torch==2.99.0">x</Versioned>', matrix);
  const ok = good.length === 0 && bad.length === 1 && bad[0].pkg === "torch";
  console.log(`[${good.length === 0 ? "ok" : "FAIL"}] supported pins pass`);
  console.log(`[${bad.length === 1 ? "ok" : "FAIL"}] unsupported pin (torch==2.99.0) caught`);
  console.log(ok ? "\nversion-matrix self-test: PASS" : "\nversion-matrix self-test: FAIL");
  process.exit(ok ? 0 : 1);
}

const matrix = JSON.parse(readFileSync("supported-versions.json", "utf8"));
let bad = 0;
for (const f of walk("src/content")) {
  for (const b of unsupportedPins(readFileSync(f, "utf8"), matrix)) {
    bad++;
    console.error(`${relative(".", f)}: ${b.pkg}==${b.ver} not in supported matrix (listed: ${JSON.stringify(b.listed)})`);
  }
}
if (bad === 0) console.log("version-matrix: all Versioned pins are in the supported matrix.");
process.exit(bad > 0 && !process.argv.includes("--warn") ? 1 : 0);
