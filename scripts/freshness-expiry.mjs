#!/usr/bin/env node
/**
 * freshness-expiry.mjs — CI gate for the I/R/V provenance model.
 *
 * Scans chapter MDX for <Renewable last_measured="…"> and <Versioned as_of="…"> blocks and
 * fails (exit 1) when any is older than its TTL — so stale measured constants or framework
 * commands can't silently rot in the guide. Invariant blocks have no expiry.
 *
 *   node scripts/freshness-expiry.mjs            # scan src/content, fail on any expired
 *   node scripts/freshness-expiry.mjs --warn     # report only, never fail
 *   node scripts/freshness-expiry.mjs --self-test # unit-test the scanner
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const TTL_DAYS = { renewable: 365, versioned: 90 };
const PATTERNS = {
  renewable: /<Renewable\b[^>]*\blast_measured="(\d{4}-\d{2}-\d{2})"/g,
  versioned: /<Versioned\b[^>]*\bas_of="(\d{4}-\d{2}-\d{2})"/g,
};

/** Return an array of {kind, date, ageDays, ttl} for blocks past their TTL. */
export function scanText(text, now = new Date()) {
  const findings = [];
  for (const [kind, re] of Object.entries(PATTERNS)) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const ageDays = Math.floor((now - new Date(m[1] + "T00:00:00Z")) / 86_400_000);
      if (ageDays > TTL_DAYS[kind]) findings.push({ kind, date: m[1], ageDays, ttl: TTL_DAYS[kind] });
    }
  }
  return findings;
}

function walkMdx(dir) {
  const out = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walkMdx(p));
    else if ([".mdx", ".md"].includes(extname(p))) out.push(p);
  }
  return out;
}

function selfTest() {
  const now = new Date("2026-07-17T00:00:00Z");
  const cases = [
    ['<Renewable last_measured="2026-06-01">x</Renewable>', 0, "fresh renewable"],
    ['<Renewable last_measured="2024-01-01">x</Renewable>', 1, "stale renewable"],
    ['<Versioned as_of="2026-01-01" version="t">x</Versioned>', 1, "stale versioned (>90d)"],
    ['<Versioned as_of="2026-06-20" version="t">x</Versioned>', 0, "fresh versioned"],
    ['<Invariant>x</Invariant>', 0, "invariant never expires"],
  ];
  let ok = true;
  for (const [text, want, label] of cases) {
    const got = scanText(text, now).length;
    const pass = got === want;
    ok &&= pass;
    console.log(`[${pass ? "ok" : "FAIL"}] ${label}: expired=${got} (want ${want})`);
  }
  console.log(ok ? "\nfreshness-expiry self-test: PASS" : "\nfreshness-expiry self-test: FAIL");
  process.exit(ok ? 0 : 1);
}

if (process.argv.includes("--self-test")) selfTest();

const warnOnly = process.argv.includes("--warn");
const root = "src/content";
const now = new Date();
let expired = 0;
for (const file of walkMdx(root)) {
  for (const f of scanText(readFileSync(file, "utf8"), now)) {
    expired++;
    console.error(
      `${relative(".", file)}: ${f.kind} block dated ${f.date} is ${f.ageDays}d old (TTL ${f.ttl}d) — re-verify`
    );
  }
}
if (expired === 0) console.log("freshness-expiry: all I/R/V blocks within TTL.");
process.exit(expired > 0 && !warnOnly ? 1 : 0);
