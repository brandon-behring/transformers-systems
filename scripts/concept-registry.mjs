#!/usr/bin/env node
/**
 * concept-registry.mjs — the guide's concept-ID registry + within-guide integrity gate.
 *
 * Chapters DECLARE the concepts they define via a `concept_ids: [a, b]` frontmatter list and
 * REFERENCE others via `[[slug]]` or `<XRef concept="slug">`. This builds the registry (writing
 * docs/concept-registry.json), fails on (a) a concept id declared in two chapters and (b) a
 * reference to an undeclared concept. Cross-guide refs (`formal:slug`, `docai:slug`) are recorded
 * separately for the future cross-guide checker rather than treated as dangling.
 *
 *   node scripts/concept-registry.mjs             # build + validate
 *   node scripts/concept-registry.mjs --self-test # unit-test
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

function declaredIds(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return [];
  const m = fm[1].match(/^concept_ids:\s*\[([^\]]*)\]/m);
  if (!m) return [];
  return m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
}

function references(text) {
  const refs = new Set();
  for (const m of text.matchAll(/\[\[([a-z0-9:-]+)\]\]/gi)) refs.add(m[1]);
  for (const m of text.matchAll(/<XRef\b[^>]*\bconcept="([a-z0-9:-]+)"/gi)) refs.add(m[1]);
  return [...refs];
}

export function buildRegistry(files) {
  const registry = {};           // id -> chapter
  const problems = [];
  const crossGuide = new Set();
  for (const { path, text } of files) {
    for (const id of declaredIds(text)) {
      if (registry[id]) problems.push(`duplicate concept id "${id}" (in ${registry[id]} and ${path})`);
      else registry[id] = path;
    }
  }
  for (const { path, text } of files) {
    for (const ref of references(text)) {
      if (ref.includes(":")) { crossGuide.add(ref); continue; }   // formal:/docai: — cross-guide
      if (!registry[ref]) problems.push(`${path}: reference to undeclared concept "${ref}"`);
    }
  }
  return { registry, problems, crossGuide: [...crossGuide] };
}

function walk(dir) {
  const out = [];
  let e; try { e = readdirSync(dir); } catch { return out; }
  for (const n of e) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if ([".mdx", ".md"].includes(extname(p))) out.push({ path: relative(".", p), text: readFileSync(p, "utf8") });
  }
  return out;
}

if (process.argv.includes("--self-test")) {
  const files = [
    { path: "a.mdx", text: '---\nconcept_ids: [roofline, ridge-point]\n---\nsee [[roofline]] and [[formal:def-cost-eq]]' },
    { path: "b.mdx", text: '---\nconcept_ids: [mfu]\n---\n<XRef concept="ridge-point" /> and <XRef concept="ghost" />' },
  ];
  const r = buildRegistry(files);
  const uniq = Object.keys(r.registry).length === 3;
  const dangling = r.problems.some((p) => p.includes("ghost"));
  const cross = r.crossGuide.includes("formal:def-cost-eq");
  const ok = uniq && dangling && cross && !r.problems.some((p) => p.includes("roofline"));
  console.log(`[${uniq ? "ok" : "FAIL"}] 3 unique concepts registered`);
  console.log(`[${dangling ? "ok" : "FAIL"}] dangling ref (ghost) caught`);
  console.log(`[${cross ? "ok" : "FAIL"}] cross-guide ref (formal:) recorded, not flagged`);
  console.log(ok ? "\nconcept-registry self-test: PASS" : "\nconcept-registry self-test: FAIL");
  process.exit(ok ? 0 : 1);
}

const r = buildRegistry(walk("src/content"));
mkdirSync("docs", { recursive: true });
writeFileSync("docs/concept-registry.json", JSON.stringify(
  { registry: r.registry, crossGuide: r.crossGuide }, null, 2) + "\n");
for (const p of r.problems) console.error(p);
console.log(`concept-registry: ${Object.keys(r.registry).length} concepts, ${r.crossGuide.length} cross-guide refs, ${r.problems.length} problems`);
process.exit(r.problems.length > 0 ? 1 : 0);
