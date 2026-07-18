#!/usr/bin/env node
/**
 * crosslink-check.mjs — cross-guide reference integrity gate.
 *
 * Chapters may reference the sibling formal guide via `[[formal:<id>]]` or
 * `<XRef concept="formal:<id>">`. This checker validates every `formal:<id>` against
 * the FROZEN contract docs/contracts/formal-guide-labels.json (the formal guide's
 * label set, snapshotted so a rename there can't silently break links here). Refs to
 * other guides (e.g. `docai:<id>`) are recorded as informational until their contract
 * lands. Within-guide `[[slug]]` refs are the concern of concept-registry.mjs, not here.
 *
 *   node scripts/crosslink-check.mjs             # validate
 *   node scripts/crosslink-check.mjs --self-test # unit-test
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const CONTRACT = 'docs/contracts/formal-guide-labels.json';

// A cross-guide ref is `<guide>:<id>` inside [[...]] or <XRef concept="...">.
export function crossGuideRefs(text) {
  const refs = new Set();
  for (const m of text.matchAll(/\[\[([a-z0-9]+:[a-z0-9:-]+)\]\]/gi)) refs.add(m[1]);
  for (const m of text.matchAll(/<XRef\b[^>]*\bconcept="([a-z0-9]+:[a-z0-9:-]+)"/gi)) refs.add(m[1]);
  return [...refs];
}

export function checkRefs(files, formalIds) {
  const formal = new Set(formalIds);
  const problems = [];
  const informational = new Set();
  for (const { path, text } of files) {
    for (const ref of crossGuideRefs(text)) {
      const [guide, id] = [ref.slice(0, ref.indexOf(':')), ref.slice(ref.indexOf(':') + 1)];
      if (guide === 'formal') {
        if (!formal.has(id)) problems.push(`${path}: dangling formal ref "${ref}" (id "${id}" not in ${CONTRACT})`);
      } else {
        informational.add(ref); // e.g. docai:* — no frozen contract yet
      }
    }
  }
  return { problems, informational: [...informational] };
}

function walk(dir) {
  const out = [];
  let entries; try { entries = readdirSync(dir); } catch { return out; }
  for (const n of entries) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.mdx', '.md'].includes(extname(p))) out.push({ path: relative('.', p), text: readFileSync(p, 'utf8') });
  }
  return out;
}

if (process.argv.includes('--self-test')) {
  const formalIds = ['def-attention', 'cor-equal-exponent-allocation'];
  const files = [
    { path: 'ok.mdx', text: 'see [[formal:def-attention]] and <XRef concept="formal:cor-equal-exponent-allocation" />' },
    { path: 'bad.mdx', text: 'see [[formal:ghost-theorem]] plus [[docai:layout-object]]' },
  ];
  const r = checkRefs(files, formalIds);
  const dangling = r.problems.some((p) => p.includes('ghost-theorem'));
  const validKept = !r.problems.some((p) => p.includes('def-attention'));
  const docaiInfo = r.informational.includes('docai:layout-object');
  const ok = dangling && validKept && docaiInfo && r.problems.length === 1;
  console.log(`[${dangling ? 'ok' : 'FAIL'}] dangling formal ref caught`);
  console.log(`[${validKept ? 'ok' : 'FAIL'}] valid formal refs pass`);
  console.log(`[${docaiInfo ? 'ok' : 'FAIL'}] docai ref recorded as informational`);
  console.log(ok ? '\ncrosslink-check self-test: PASS' : '\ncrosslink-check self-test: FAIL');
  process.exit(ok ? 0 : 1);
}

const contract = JSON.parse(readFileSync(CONTRACT, 'utf8'));
const { problems, informational } = checkRefs(walk('src/content'), contract.labelIds);
for (const p of problems) console.error(p);
console.log(`crosslink-check: ${contract.labelIds.length} formal ids (scaffold ${contract.formalScaffoldVersion}), ${informational.length} informational cross-guide refs, ${problems.length} problems`);
process.exit(problems.length > 0 ? 1 : 0);
