/**
 * src/schemas/systems.mjs — systems-engineering frontmatter extensions.
 *
 * Merged onto researchPortfolioChapterSchema in content.config.ts so chapters can
 * bind to the numbers contract (scenarios/labs) and the concept registry. Kept in a
 * standalone .mjs (not inline in content.config.ts) so it is importable by BOTH the
 * Astro build AND the standalone negative test (scripts/test-systems-schema.mjs)
 * without pulling `astro:content`. `astro/zod` is the same Zod instance the scaffold
 * schema is built with, so `.merge()` composes cleanly.
 */
import { z } from 'astro/zod';

export const systemsExtensions = z.object({
  // Links into the numbers contract: scenarios/<id>.yml the chapter's numbers come from.
  scenario_ids: z.array(z.string()).default([]),
  // Concept-ID registry (also read by scripts/concept-registry.mjs); first-class here.
  concept_ids: z.array(z.string()).default([]),
  // Hardware/provenance: where a Renewable measurement in the chapter was taken.
  measured_on: z.string().optional(),
  // Version-matrix keys this chapter's numbers were measured against (scripts/version-matrix.mjs).
  supported_versions: z.array(z.string()).default([]),
  // Lab-repo companions surfaced via CodeBlock "View on GitHub" / companion links.
  code_path: z.string().optional(),
  tests_path: z.string().optional(),
  notebook_path: z.string().optional(),
});
