# ADR 0002 — Pilot deviations register (as-built vs the frozen contract v0)

**Status:** accepted · 2026-07-20
**Context:** the 32-chapter content review (8 finder agents + codex verification) found the book's
Renewable blocks repeatedly narrating `reference-model.md` (frozen v0) *intent* as measured fact.
The pilot deliberately under-implements the contract in places; that is fine — but provenance
blocks must describe what ran. This ADR is the canonical list of as-built deviations. Chapters
reference it instead of silently paper-covering a gap. Resolving any item updates both the lab and
this register.

## Deviations (contract § → as-built)

1. **Precision (§3).** Contract: bf16 compute + fp32 master weights + fp32 optimizer state.
   As-built: **pure fp32 AdamW** (`m1a_real.py`; report `workload_shape: "R1-tiny fp32 AdamW"`).
   The measured 16 B/param train state decomposes 4+4+4+4 (weight+grad+m+v) — NOT the contract's
   2+2+4+4+4; a contract-conformant run with fp32 grads would be 18 B/param. The two totals
   collide at 16 by coincidence; the units hash (`bench/contract.py`) records the fp32 ledger.
2. **Batch & schedule (§3).** Contract: global batch 32×512, WSD schedule. As-built: measured run
   is bs=8×512, constant LR (no scheduler exists in the lab).
3. **R0 corpus (§2.1–2.2).** As-built r0 has: no build-time dedup (inherits FineWeb-Edu's upstream
   per-dump MinHash only), no Unicode normalization step (UTF-8 decode only — "NFC" is a target,
   not implied by UTF-8), **no train/val/contamination-probe splits**, no upstream dataset
   `revision=` pin (streamed head of `sample-10BT`), and unpinned `tokenizers`/`datasets` libs.
   Checksums make divergence *detectable*, not re-derivable.
4. **Tokenizer specials (§2.3).** Contract: doc-control vocabulary appended to R1's tokenizer with
   mean-init embedding migration. As-built: 10 specials **reserved up-front** (ids 0–9) at
   tokenizer training time; the `$…$` math-delimiter tokens are not reserved. Only `</page>` has a
   reserved closing tag; other closers encode as plain byte-BPE text.
5. **Document side (§2.4–2.6, §5).** Render contract (pypdfium2, DPI 200) is **unexercised**: the
   VLM spike consumes a *seeded random tensor* stand-in, not a rendered page. The spike trains
   encoder+projector+decoder **jointly** (nothing frozen). No `<eos_doc>` termination logic (fixed
   n-step generation). No coordinate tokens exist in the vocabulary and no box productions in the
   grammar. Visual tokens in the spike: 16 (32² image, patch 8), vs the contract's 1024²→256
   budget (which itself requires a ~16× compression stage after patch-16, GOT-OCR2.0-style).
6. **Distribution (§7).** FSDP2 is **not integrated**. Gate A (bitwise resume) runs on **CPU with
   `torch.use_deterministic_algorithms(True)`** — deterministic kernels are a load-bearing
   precondition; GPU nondeterminism is a Tier-1 concern. Gate B exercises DCP save/load +
   cross-world-size reshard of **replicated plain-module state** (exact `torch.equal`), not
   sharded FSDP2 state.
7. **Serving.** No serving scenario record exists (`scenarios/` holds only `r1-tiny-train`); KV
   byte-math has no calculation fixture. The paged-KV parity gate is the script's own exit code,
   run locally on Tier-0 — hosted CI runs only the stdlib tests.
8. **Measured constants.** Single run, no spread: 81,029.2 tok/s (bs=8), loss 9.065 → 6.264
   (trailing-10 mean), peak memory 1,171,365,888 B. Quote as ≈81,000 tok/s; never "82,000".

## Policy

- **Renewable blocks narrate as-built runs**; contract targets are labeled design-forward with a
  reference to this ADR.
- The numbers contract hashes as-built units; a precision change (deviation 1) is a semver event
  for `reference-model.md` §3 *and* this register.
