# transformer-systems

Built with [`@brandon_m_behring/book-scaffold-astro`](https://github.com/brandon-behring/book-scaffold-astro) (research-portfolio profile, v5.2.0).

## Getting started

```bash
npm install
npm run dev    # http://localhost:4321
npm run pdf    # build + preview + render dist-pdf/book.pdf
```

## Authoring

Chapters live under `src/content/chapters/*.mdx`. The starter `week01-hello-world.mdx` shows the frontmatter shape and basic component usage.

Available components are documented in the toolkit's [PACKAGE_DESIGN.md §10](https://github.com/brandon-behring/book-scaffold-astro/blob/v5.2.0/PACKAGE_DESIGN.md#10-mdx-import-patterns).

## Decision log

Significant design decisions are recorded as ADRs under `decisions/` — see `decisions/README.md` for the convention. Copy `decisions/ADR_TEMPLATE.md` to add a new one; the seed `decisions/0001-*.md` shows the format.

## Build + deploy

```bash
npm run validate    # pre-flight content checks
npm run build       # → dist/
npx wrangler pages deploy ./dist --project-name=transformer-systems
```

See `wrangler.toml` for deploy config (this scaffold uses the Cloudflare **Pages** shape — default for the research-portfolio preset).

## Licensing

Code, configuration, and scripts are MIT-licensed; authored book content and
documentation are CC BY 4.0. See `LICENSE` and `LICENSE-CONTENT`. The
generated attribution is **Brandon Behring** (set with `--author` when scaffolding).
