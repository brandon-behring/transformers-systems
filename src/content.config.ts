/**
 * src/content.config.ts — Content collections.
 *
 * defineBookSchemas() (research-portfolio preset) wires `chapters` +
 * auto-detected collateral collections (sources/changelog/questions/glossary/…).
 * We spread its collections and OVERRIDE `chapters` with the research-portfolio
 * chapter schema merged with our systems-engineering extensions (numbers-contract
 * + concept-registry fields). This is the documented consumer-extension pattern
 * (PACKAGE_DESIGN §5: object spread + Zod merge).
 */
import { defineBookSchemas } from '@brandon_m_behring/book-scaffold-astro/schemas';
import { researchPortfolioChapterSchema } from '@brandon_m_behring/book-scaffold-astro';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { systemsExtensions } from './schemas/systems.mjs';

const base = defineBookSchemas();

const chapters = defineCollection({
  loader: glob({
    pattern: ['**/*.{md,mdx}', '!**/_*'],
    base: './src/content/chapters',
  }),
  schema: researchPortfolioChapterSchema.merge(systemsExtensions),
});

export const collections = { ...base.collections, chapters };
