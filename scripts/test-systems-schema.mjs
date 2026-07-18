#!/usr/bin/env node
/**
 * test-systems-schema.mjs — negative test for the systems frontmatter extensions.
 *
 * `npm run build` only proves the CURRENT (valid) chapters parse. This proves the
 * merged schema also REJECTS malformed systems frontmatter, so the contract has
 * teeth: a chapter that mistypes scenario_ids or code_path fails CI rather than
 * silently losing the field.
 *
 *   node scripts/test-systems-schema.mjs
 */
import { researchPortfolioChapterSchema } from '@brandon_m_behring/book-scaffold-astro';
import { systemsExtensions } from '../src/schemas/systems.mjs';

const schema = researchPortfolioChapterSchema.merge(systemsExtensions);
const baseGood = { title: 'Ch', last_verified: new Date() };

const cases = [
  { name: 'minimal valid (systems fields default)', input: { ...baseGood }, expect: true },
  {
    name: 'valid with systems fields',
    input: { ...baseGood, scenario_ids: ['r1-tiny-train'], concept_ids: ['roofline'],
      measured_on: 'Tier-0 RTX 2070 SUPER', supported_versions: ['torch-2.13.0'],
      code_path: 'm1a_real.py', tests_path: 'tests/test_r1_tiny_fixture.py' },
    expect: true,
  },
  { name: 'scenario_ids as string (must fail)', input: { ...baseGood, scenario_ids: 'nope' }, expect: false },
  { name: 'concept_ids with non-string (must fail)', input: { ...baseGood, concept_ids: [1, 2] }, expect: false },
  { name: 'code_path as number (must fail)', input: { ...baseGood, code_path: 42 }, expect: false },
  { name: 'measured_on as array (must fail)', input: { ...baseGood, measured_on: ['a'] }, expect: false },
];

let failures = 0;
for (const c of cases) {
  const got = schema.safeParse(c.input).success;
  const ok = got === c.expect;
  if (!ok) failures++;
  console.log(`[${ok ? 'ok' : 'FAIL'}] ${c.name} (expected success=${c.expect}, got=${got})`);
}
// Defaults materialize on a minimal parse.
const parsed = schema.safeParse({ ...baseGood });
const defaultsOk = parsed.success &&
  Array.isArray(parsed.data.scenario_ids) && parsed.data.scenario_ids.length === 0 &&
  Array.isArray(parsed.data.supported_versions);
if (!defaultsOk) { failures++; console.log('[FAIL] array fields default to []'); }
else console.log('[ok] array fields default to []');

console.log(failures === 0 ? '\nsystems-schema test: PASS' : `\nsystems-schema test: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
