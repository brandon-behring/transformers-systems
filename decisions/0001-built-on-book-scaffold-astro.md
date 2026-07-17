# ADR-0001: Build "transformer-systems" on book-scaffold-astro

- **Status**: Accepted
- **Date**: (set to scaffold date)
- **Deciders**: (you)

## Context

"transformer-systems" is a long-form book that needs MDX authoring, a content schema,
print/PDF output, full-text search, and a citation/reference pipeline. Building
that chrome from scratch is high-effort and easy to get subtly wrong
(accessibility, SEO, dark mode, print CSS).

## Decision

We will build "transformer-systems" as a consumer of
`@brandon_m_behring/book-scaffold-astro` (research-portfolio profile, v5.2.0),
not a bespoke Astro project. The toolkit owns layouts, components, default
routes, styles, and the validate/build scripts; this repo owns content.

## Consequences

- Upgrades flow in via the npm dependency — we inherit fixes and features but
  track the toolkit's release cadence and any breaking changes.
- Customization happens through documented escape hatches (`src/styles/`
  overrides, `extraStyles`, route toggles), not by forking the toolkit.
- This decision log starts here so subsequent choices stay traceable.

## Supersedes / Superseded-by

None (initial decision).
