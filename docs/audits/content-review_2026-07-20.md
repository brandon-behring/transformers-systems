# Whole-book adversarial content review — 2026-07-20

## Scope and method

All 32 chapters, reviewed for what the five mechanical gates cannot check: synthesis accuracy
against sources, code–prose agreement with the lab repo, contract fidelity, I/R/V provenance
discipline, and the IP firewall. Three rounds to convergence:

1. **Round 1 — 8 part-scoped finder agents** (one per part), each re-deriving arithmetic from the
   frozen config, diffing prose against the lab code it narrates, and spot-checking ~10 cited
   claims per part against the strict-live dossier evidence on disk (~80 source checks total).
2. **Round 2 — independent codex verification** of the 14 quantitative/source findings
   (12 CONFIRM, 2 ADJUST, 0 REFUTE — the adjustments corrected the GQA total-byte saving to ~15%
   at full context and pinned the over-parameterization basis), plus conclusive greps for every
   fabrication-class finding (all empty where the book claimed artifacts existed).
3. **Fix wave — 8 part-scoped fix agents + orchestrator**, anchored to
   `decisions/0002-pilot-deviations-register.md` (new), followed by **round 3 — codex sanity
   review of the full diff: NO BLOCKERS** (all corrected constants re-derive; no introduced
   contradictions; MDX clean).

## Findings: 9 critical / 41 major / 48 minor — all fixed or honestly scoped

**The systemic defect (majority of criticals):** Renewable (measured-provenance) blocks narrated
the frozen contract's *intent* as measured fact where the pilot under-implements it. As-built
truth now stated everywhere, with contract targets labeled design-forward per ADR 0002:
pure **fp32** AdamW (not bf16 + master; the identical 16 B/param total was a units collision),
**DCP on replicated state** (not FSDP2), **no data splits or contamination probe**, a **jointly
trained** VLM spike (nothing frozen) consuming a **seeded random tensor** (not a rendered page),
and a claimed golden data test that did not exist (now it does: `tests/test_r0_batches.py`,
green, in CI, plus `tests/test_paged_kv.py`).

**Quantitative corrections (codex-verified):** the weight stream — not the KV cache — dominates
R1-tiny decode traffic (16× at 512 ctx, ~200× at the narrated run; GQA saves ~15%/~1% of total
decode bytes, not 4×); the pilot's T=24 prefill is memory-bound (AI ≈ 12 < ridge ≈ 20); ch09's
sizing story was backwards (≈11× over-parameterized for its ≈3.9×10¹³ FLOPs; 8 GB never binds at
6.3M params — the size is a pilot-scoping choice); the 403 MB activation estimate is superseded
by the measured 1.17 GB peak; throughput is 81,029 tok/s single-run (was quoted "~82,000");
per-layer checkpointing is Θ(L), the √L schedule is Chen et al.'s; caching does not make total
generation linear; vLLM admits on prompt-fit, not prompt+expected-generation; paging promises
greedy token-ID parity, not bitwise logits; 1024²→256 requires a 16× compression stage after
patch-16; LoRA's vocab-matrix factor is 31× (cap 32), about twice the square projection's 16×.

**Source fixes:** arXiv 2101.00027 is The Pile, not GPT-2 (GPT-2 cited via its OpenAI report);
the two-layer MLP connector is LLaVA-1.5 (2310.03744, added), the original LLaVA projector is a
single linear layer; Micikevicius 1710.03740 carried no determinism claim (dropped for the
PyTorch randomness notes); the Kosec packing citation argued the opposing method (concat-slice
reattributed to the GPT-2/3 lineage); DPO holds two resident models absent precomputed reference
log-probs; RLVR removes the learned reward model, not the Goodhart surface.

**Cross-chapter unification:** train state (101.2 MB = weights+grads+moments) vs optimizer state
(the two moments, 50.6 MB, under the fp32 pilot ledger 4+4+4+4) now consistent across ch01/03/14;
the sizing causal story consistent across ch09/10/11.

## Verification after the wave

`npm run build` (37 pages) + validate ✓ 32 chapters + all five gates
(`check:{concepts,freshness,versions,schema,crosslinks}`) green; IP grep (`mathpix|supernet`) = 0;
codex diff review clean. Lab: `test_r0_batches.py` passes against the real artifact;
`test_paged_kv.py` wraps the parity gate (loud skip off-GPU); README/manifest corrected.

## Deliberately not done

FSDP2 integration, a bf16 mixed-precision run, WSD scheduling, R0 splits/dedup/NFC/revision-pin,
the render contract, encoder freezing, and a serving scenario record remain open lab work — the
register in `decisions/0002-pilot-deviations-register.md` is their canonical tracking point; the
book now describes them as design-forward rather than done.
