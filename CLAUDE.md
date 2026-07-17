# transformer-systems — AI authoring guide

This book is built with `@brandon_m_behring/book-scaffold-astro` (research-portfolio profile, v5.2.0).

**Where things live:**

- Chapters: `src/content/chapters/*.mdx` — frontmatter follows the research-portfolio schema
- Components, layouts, default routes: `@brandon_m_behring/book-scaffold-astro/components/...`
- Style customizations: `src/styles/` (overrides package styles)
- Bibliography: `bibliography.bib` (academic) → `src/data/references.json` via `npm run build:bib`
- Cross-references: ids on `<Theorem>` / `<Figure>` → `src/data/labels.json` via `npm run build:labels`
- Decision log: `decisions/` — numbered ADRs (see `decisions/README.md`); record significant choices here

**Toolkit reference:** [PACKAGE_DESIGN.md](https://github.com/brandon-behring/book-scaffold-astro/blob/v5.2.0/PACKAGE_DESIGN.md) — single source of truth for the API. File issues at https://github.com/brandon-behring/book-scaffold-astro/issues with label `consumer:transformer-systems`.
