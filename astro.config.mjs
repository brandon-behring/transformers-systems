// @ts-check
/**
 * astro.config.mjs — book-scaffold-astro consumer config (v4 API).
 *
 * Built-in styles ship one per preset. To customize, define your own style
 * in shared/styles/ (workspace pattern) or publish it as an npm package,
 * then compose: `styles: [researchPortfolioStyle, myCustomStyle]`.
 *
 * See recipes/15-defining-styles.md for the full pattern catalog.
 */
import { defineBookConfig, researchPortfolioStyle } from '@brandon_m_behring/book-scaffold-astro';

export default await defineBookConfig({
  styles: [researchPortfolioStyle],
  site: 'https://guides.brandon-behring.dev',
  // Deploy under the family hub at /transformers-systems/ (slug-aligned with the repo).
  base: '/transformers-systems/',
  // This scaffold owns src/pages/index.astro, so disable the package landing
  // route explicitly. Astro plans to make duplicate static routes a hard error.
  routes: { landing: false },
});
