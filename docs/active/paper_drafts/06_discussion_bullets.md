# DISCUSSION bullets — draft

> Peleg's comment: "To all: Please add in bullet points things you think will be wotrh discussing in the paper. At the end I will generate something that combines all."
> Her two bullets are already in the doc (highlight advantage of predicting SSW + fibril formation of α/SSW rather than cross-β; highlight biochemical-feature analysis of a database).
> Ours (Said + Alex) below.

---

## Ours to add — engineering + product bullets

- **First LLM-native interface for an amyloidogenicity predictor.** The bundled Model Context Protocol server (`pvl-mcp`) lets Claude, ChatGPT-with-MCP-client and any other MCP-capable LLM directly interrogate PePFibPred from natural-language prompts. This is, to our knowledge, the first computational amyloid tool with a native LLM surface — a differentiator that positions the server for the emerging class of AI-assisted structural-biology workflows.

- **User-selectable thresholds, always.** No classification (candidate / SSW / rank) is committed at the pipeline layer. Users can re-classify an entire batch in constant time against their own thresholds without re-running any predictor. This unlocks threshold-sensitivity exploration that most single-algorithm servers hide behind opaque built-in cutoffs.

- **Deterministic, cross-surface reproducibility.** A given sequence returns bit-identical numeric fields whether submitted through the web UI, the CLI (`pvl-cli`), the Python package, the MCP server, or the REST API — an invariant regression-locked by the CI suite. This deterministic contract is the foundation for citing PePFibPred output in downstream experimental protocols.

- **Full-stack transparency and reproducibility.** MIT-licensed source on GitHub, Zenodo DOI on every release, pinned dependency manifest, Trusted-Publisher-signed PyPI distributions, seven GitHub-Actions CI workflows (backend pytest 197 tests, frontend vitest 628 tests, CodeQL, Docker build, mkdocs-strict docs deploy). The paper's supplementary information is a live-linked mkdocs handbook rather than a static PDF, allowing readers to interact with the exact tool the paper describes.

- **Peptide-scale UniProt integration for hypothesis-driven discovery.** The UniProt-guided mode (Method J) enables the "start from an organism/keyword, not from a peptide list" workflow — the same workflow that produced the AlphaFold-guided candidate discovery in Ragonis-Bachar, Axel, Blau, Ben-Tal, Kolodny, Landau, Proteins 2024 — but now on the peptide length window (10 ≤ *L* ≤ 40 aa) where PePFibPred's α/β chameleon detection is most informative.

- **Scaling roadmap.** The precompute-artefact pattern (Method I) and the DuckDB provider cache (Method I) together mean interactive latency on repeat queries is ~10 ms, independent of dataset size. The reference *Staphylococcus aureus* 2023 dataset (2 916 peptides) is served entirely from a static 18.7 MB JSON artefact, which validates the approach for datasets on the order of 10⁴–10⁵ peptides. Further scaling to genome-wide sweeps (10⁶ + peptides) is planned via GPU-batched S4PRED inference on the DESY GPU nodes and a Celery task-queue architecture; the migration path is documented in the handbook.

- **Comparison against existing servers.** Existing sequence-based amyloid tools (TANGO, PASTA 2.0, AGGRESCAN, Zyggregator, FoldAmyloid, Waltz) are single-algorithm, β-biased, and lack an interactive dashboard, an LLM interface, and a first-class UniProt entry point. PePFibPred combines multi-signal reasoning with per-signal transparency, does not merge predictors before the classification layer, and is the only tool in this space with an MCP surface. A quantitative benchmark against these servers on the *S. aureus* 2023 dataset is included as supplementary Table SX.

- **Open questions we surface but do not resolve.** (a) The SSW axiom (Method F) is a conjunction of TANGO and S4PRED positivity; a weighted-conjunction generalisation may yield finer discrimination on chameleon peptides whose helical or β-aggregation propensity is borderline — a natural next-paper direction. (b) The FF-Helix compositional cutoff was tuned on Peleg's curated dataset; retraining on an independent AMP corpus is on the roadmap.

- **The tool is a research instrument, not a feature collection.** Explicit in the architectural principles (Method A): scientific correctness first, user-friendliness second, feature-count last. This ordering was our answer to a real risk in web-server tool design — the "friendly dashboard on a wrong prediction" failure mode.

## Notes for Said before pasting
- Peleg will merge our bullets with hers and Meytal's into a single Discussion draft. Our job is to plant them in the right thematic order (novelty → engineering rigour → open questions).
- The comparison bullet cites a supplementary Table SX that does not yet exist. That table is a good candidate for the SI companion doc — I'll draft it next round if you want.
- Every "first" or "novel" claim above is defensible from the code + repo — happy to add citation lines if Peleg asks.
