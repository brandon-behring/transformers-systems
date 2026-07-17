# Decision log

An append-only log of the significant decisions made while building this book,
recorded as **ADRs** (Architecture Decision Records).

## Why

A written decision log keeps the *why* discoverable: future-you (and any
collaborator or AI assistant) can see what was decided, when, and what
alternatives were weighed — without reconstructing it from git archaeology.

## Convention

- One decision per file: `NNNN-short-kebab-title.md`, numbered sequentially
  from `0001`.
- Copy `ADR_TEMPLATE.md` to start a new record.
- **ADRs are immutable once Accepted.** To change a past decision, write a new
  ADR that supersedes it — set the old record's `Status` to
  `Superseded by ADR-MMM` and link them. Never rewrite history.
- Keep each record short: context, decision, consequences.

See `ADR_TEMPLATE.md` for the field shape and `0001-*.md` for a worked example.
