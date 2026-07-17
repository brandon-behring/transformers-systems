# Reference-Model Family Contract — v0 (FROZEN 2026-07-17)

**Status.** **FROZEN v0 — signed off 2026-07-17.** This is the **constitution**: every chapter's
labs, every scenario record, every benchmark number, and the golden tests derive from the values fixed here.
Nothing downstream may silently contradict it. Changes after freeze require a **semver bump + a numbers-composition
review** (see the plan §5b).

**Staging note.** Drafted at `~/Claude/transformer-systems-staging/`; moves to the repo root at M0 scaffold time.

---

## 1. The family DAG (there is no R4)

```
R0  data & interface contract  (NOT a model — the frozen substrate)
     └─ R1  dense text LM  (the spine)
          ├─ R2  MoE variant                 (introduced at Scale/EP)
          └─ R3  dense document-AI VLM        (the document-AI north star; + optional R3-MoE)

Q(·)  deployment profile  = a served/quantized *projection* applicable to R1 / R2 / R3
                            (component-wise precision, calibration, SLO) — NOT a child model
```

Rationale (Codex #3): R2 does not gate R3 (establish a *dense* doc-VLM first so multimodal regressions stay
separable from routing/expert-parallel failures); Q(·) is a deployment matrix, not "a quantized model = production."

---

## 2. R0 — data & interface contract  *(the most load-bearing freeze)*

### 2.1 Corpus & document inventory
- **Text corpus (R1/R2):** a pinned public snapshot (default: a fixed **FineWeb-Edu** sample; license: ODC-By).
  Record the exact snapshot id + row count + a content hash. **Splits:** train / val / a held-out contamination
  probe; splits are by document id, frozen, hashed. **Contamination rule:** the val + probe doc-ids are excluded
  from train by hash; any eval corpus is n-gram-decontaminated against train.
- **Document corpus (R3):** a pinned set of rendered documents with ground-truth markup (default: a small
  **arXiv/PMC** LaTeX-source sample rendered to page images; license per source, recorded per-doc). Splits by
  document id; **born-digital vs scanned** flagged per doc; **embedded-PDF-text leakage** is prohibited in the
  input path (render to image only; never read the source text layer at inference).

### 2.2 Text normalization & dedup
- Unicode NFC; whitespace/newline canonicalization pinned; no lowercasing.
- Dedup: exact (hash) + **MinHash-LSH** near-dup (5-gram shingles, threshold 0.8) at corpus build; parameters
  recorded. Dedup runs *before* the split so no near-dup crosses train/val.

### 2.3 Tokenizer  *(freeze point = HERE in R0; referenced by M1a)*
- **BPE**, byte-level, trained on the pinned text snapshot. **Pilot vocab = 8192**; family target 32k.
  Record the tokenizer artifact + **SHA-256** + training config.
- **Document-markup / control vocabulary (R3):** a small versioned set of structural tokens —
  `<page>` `</page>` `<region>` `<table>` `<tr>` `<td>` `<formula>` `$…$` delimiters, `<eos_doc>` — appended
  **without changing existing token IDs**. Embedding rows for new tokens are initialized from the mean embedding
  + small noise (seed-fixed); migration policy recorded. **Reuse R1's tokenizer, extended — not a separate VLM
  tokenizer** unless an experiment demonstrates it fails on structured-document markup.

### 2.4 Document rendering contract (deterministic; CPU/Tier-0)
- **Library: `pypdfium2`** (PDFium; permissive license), **version-pinned**. Fixed **DPI = 200** (zoom matrix),
  fixed rotation = 0, fixed anti-aliasing flags, **embedded-font policy** with a pinned deterministic fallback
  font set. Corrupted-file policy: fail-closed with a recorded error class (never silently emit a blank page).
  Multi-page: one image per page, page order preserved and recorded.
- Determinism guarantee is *"identical output given identical PDFium version + inputs"*; the contract pins both
  the version and the font set (the two real drift risks).

### 2.5 Structured-output grammar & invalid-output policy
- Target markup = a **subset grammar** (balanced math delimiters, `\begin{}…\end{}` environment matching, HTML/
  Markdown table cell structure) — **not full LaTeX** (ambiguous / near-Turing-complete). Grammar file is versioned.
- **Canonicalization:** outputs normalized (whitespace, delimiter form, table cell trimming) before scoring;
  formula/markup equivalence is **render/structure-aware, not string equality** (see the doc-AI eval suite).
- **Invalid output:** constrained decoding (XGrammar) enforces grammar validity; a post-hoc validator + repair
  policy handles residual invalidity, and *valid ≠ correct* is scored separately.

### 2.6 Family tensor/interface contracts
- Token id space, special-token ids, image-token placeholder id, the visual-token count (**256**), the
  decoder `d_model`, and the projector input/output dims are fixed here so R1/R2/R3 compose without surprises.

---

## 3. R1 — dense text LM (spine)

**Architecture (family):** decoder-only, **pre-norm RMSNorm**, **RoPE**, **SwiGLU** FFN, **GQA**. Context
2k→32k (family); AdamW + **WSD** schedule; scale points ~0.1B → ~1B, larger via extrapolation.

**Pilot `R1-tiny` (concrete — this is what M1a freezes):**

| Field | Value | | Field | Value |
|---|---|---|---|---|
| `d_model` | 256 | | `vocab_size` | 8192 |
| `n_layers` | 6 | | `context_len` (pilot) | 512 |
| `n_heads` | 8 | | RoPE `theta` | 10000 |
| `n_kv_heads` (GQA) | 2 | | RMSNorm `eps` | 1e-5 |
| `head_dim` | 32 | | tie embeddings | true |
| `d_ff` (SwiGLU) | 704 (=11·64 ≈ 8/3·d_model) | | init std | 0.02 (seed 0) |

**Optimizer:** AdamW, peak `lr` 3e-4, `betas` (0.9, 0.95), `weight_decay` 0.1, `eps` 1e-8, **grad-clip** 1.0.
**Schedule (WSD):** warmup 100 steps → stable → linear decay over the final 20% to 0.1·peak.
**Precision:** bf16 compute, **fp32 master weights**, fp32 optimizer state, **fp32 reductions/accumulation**.
**Batch (pilot):** micro-batch × seq 512; global batch = 32 sequences (16 384 tokens); grad-accum as needed.
**Masking:** causal; padding masked and excluded from loss; special-token behavior recorded.
**Generation semantics (golden):** greedy + temperature (τ recorded); reference outputs stored for the golden test.

---

## 4. R2 — MoE variant

R1 + expert MLP layers (top-2 routing, capacity factor recorded), introduced at **Scale/EP**. Shares R1's
tokenizer, attention, and precision. Routing/imbalance params live in the relevant **scenario record** (they
change the FLOP/byte/memory accounting). Does **not** block R3.

---

## 5. R3 — document-AI VLM (north star)

- **Vision encoder (frozen):** GOT-style SAM/VitDet (~80M, native **1024²→256 visual tokens**) *or*
  SigLIP2-So400m/NaFlex (HF-native, strong OCRBench). Choice recorded per experiment; 256-token budget is fixed
  (small-glyph survival).
- **Connector:** **2-layer MLP projector** (LLaVA stage-1: encoder + decoder frozen, projector trained), maps
  256 visual tokens → decoder `d_model`. (Taxonomy ↔ formal ch20 `connectors-resamplers`.)
- **Decoder:** an R1 member. **Tier-0: ≤~3B** (pilot spike uses R1-tiny or Qwen2.5-0.5B; QLoRA to ~3B).
  **Tier-1: 7B-class** (Qwen2.5-VL-7B / olmOCR-2 scale).
- **Decoding:** XGrammar subset grammar (§2.5).
- **Tier boundary (from Iteration-2 research):** Tier-0 proves the *interface* (frozen enc → projector → small
  decoder → valid markup, overfit 1 doc). **Forces Tier-1:** 7B decoder (~18 GB), multi-page 8K context, high-res
  tiling (→ thousands of tokens), batch > 1, real-dataset training.

---

## 6. Q(·) — deployment profile matrix

A projection over R1/R2/R3 fixing: **component-wise precision** (encoder / connector / decoder / KV /
structured-decoding may each differ), calibration dataset, **quality budget** (max accuracy drop vs the fp16
baseline), throughput/latency targets (TTFT/TPOT/MBU), fallback behavior, and artifact provenance. Each named
profile is a scenario record.

---

## 7. Hardware tiers & frozen benchmark/TCO denominators

- **Tier-0 = this machine (verified):** 1× **RTX 2070 SUPER, 8 GB, Turing sm_75**, 128 CPU cores; `torch`+`triton`
  to be installed. Roles: correctness/parity, **gloo multi-rank FSDP2 + DCP** reshard simulation, **Triton FA
  correctness-only** (no tensor-core perf / FA2-3 / FP8).
- **Tier-1 = scale-tier machine:** *design-for, do NOT build the real code yet.* Real 8-GPU throughput/MFU, FA2/3,
  7B-VLM, Blackwell paths. Specs TBD (Brandon to supply when we reach Tier-1 work).
- **Frozen benchmark/TCO denominators** (so Tier-0/Tier-1 numbers stay comparable): hw/sw manifest (GPU, driver,
  CUDA, `torch`/`triton` versions), workload shape (batch, seq, model member), warmup steps, measurement window,
  utilization definition (MFU vs MBU), price timestamp + `$/GPU-hr` source, allocation method, uncertainty interval.
  Every measured number carries a **`measured-on:`** provenance tag and is an **R-block**.

---

## 8. Scenario-record & calculation-fixture schema  *(not a scalar ledger — Codex #3)*

Each **scenario record** (`scenarios/<id>.yml`) fixes, for one named configuration:
`id · description · owner · units & counting conventions (FLOP/byte inclusions & exclusions) · tensor shapes &
padding · precision & optimizer state · activation-checkpointing policy · topology & collective model · MoE
capacity/imbalance (if any) · image resolution & visual-token budget (if VLM) · measurement boundaries &
uncertainty · expected values (with formula refs)`.

Each **calculation fixture** (`fixtures/<id>.py`) is *runnable* code that computes the scenario's numbers
(params, `6ND` FLOPs, activation/optimizer/KV memory) from the record — imported by both chapters and tests, so
a producer chapter and a consumer chapter can never disagree. The **numbers-composition review** runs over every
producer/consumer pair before the general integrator.

---

## 9. Versioning & change policy
- v0 frozen on Brandon's sign-off. Semver: patch = wording/clarification · minor = a new member/scenario or a
  relaxed field · major = a changed frozen value (arch dim, tokenizer, precision, denominator).
- Any change to a frozen value triggers a numbers-composition review of every scenario that consumes it.
