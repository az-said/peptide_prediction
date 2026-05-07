# Research Briefs — Index

Living index of all research briefs produced by T-RES (research terminal). Each brief is a structured comparative analysis of a strategic decision PVL is making.

**Format**: `RB-NNN_topic-slug.md` (sequential numbering, kebab-case slug)
**Template**: `_TEMPLATE.md`
**Decision protocol**: T-RES writes brief → T1 reviews → Said + T1 decide → T1 commits approved changes to canonical docs (ROADMAP, DECISIONS, TECH_PLATFORM_VISION, MASTER_PUSH_PLAN).

---

## Briefs (newest first)

| ID | Date | Topic | Status | Recommendation | Affects |
|---|---|---|---|---|---|
| _none yet — T-RES will populate as missions complete_ | | | | | |

---

## Pending mission queue (T-RES picks one at a time)

These are the first 5 missions Said + T1 set for T-RES on 2026-05-08. T-RES picks one, completes it, indexes it here, then moves to the next.

### M-001 — MCP alternatives + competitive landscape
- **Question**: Is Anthropic's MCP genuinely the best AI-tool-calling protocol for PVL, or are there better options (LangGraph state machines, OpenAI Tool Calling, Cohere agents, IBM Granite, emerging open standards)?
- **Why now**: ADR-009 marks MCP as PROPOSED based on T1's synthesis, not comparative research. Wave 2 G1 builds on this assumption.
- **Decision impact**: confirms or supersedes ADR-009; affects Phase G1 scope.

### M-002 — Hosting platforms for scientific ML APIs
- **Question**: Which platform should host PVL's MCP server + future Phase I multi-predictor service for global low-latency access? Options: Modal, Replicate, HuggingFace Inference, Fly.io, Cloudflare Workers AI, Vercel, Render, Railway. Plus DESY K8s as the bare-metal option.
- **Why now**: Wave 2 ships MCP server; needs a hosting story beyond `localhost:8765`. Wave 5 K8s is blocked on DESY.
- **Decision impact**: new ADR for hosting strategy; affects Phase E + Phase O.

### M-003 — Vector store evaluation
- **Question**: For PVL's similar-peptides search feature, which vector store has the best fit? Chroma local, Qdrant, pgvector, Pinecone managed, Weaviate, Turbopuffer.
- **Why now**: Wave 2 Section D (vector embedding similarity search) is being implemented.
- **Decision impact**: new ADR for vector store; affects implementation in T2-INSTRUCTIONS Section D.

### M-004 — Peptide-domain embeddings
- **Question**: For computing peptide similarity, which embedding model gives best results? Generic (sentence-transformers all-MiniLM, Anthropic embeddings, OpenAI ada-002), or protein-domain-specific (ESM-2, ProtBert, ProtGPT, ESM-1b)? Cost vs quality vs ops burden.
- **Why now**: Wave 2 vector search needs an embedding choice. Generic might miss biological meaning; domain-specific might be too heavy for solo ops.
- **Decision impact**: implementation detail in Wave 2 Section D; possible new ADR if domain-specific chosen.

### M-005 — Adoption playbook for scientific OSS tools
- **Question**: What concrete tactics worked for analogous scientific OSS tools (cellxgene, BioPython, Mol\*, AlphaFold DB, Galaxy)? Beyond what's in TOP_CEO_RECOMMENDATIONS — actionable adoption funnels, citation accumulation, lab partnerships, conference strategies.
- **Why now**: PVL's adoption matters for sustainability. v0.1 is shipped on GitHub; what next?
- **Decision impact**: extends Phase H roadmap; possibly new sub-phases.

---

## Recurring missions (T-RES runs these on schedule)

### M-WEEKLY — Competitive scan
**Frequency**: weekly Sunday.
**Scope**: any new releases, papers, blog posts, or tool launches in: peptide aggregation prediction, secondary structure, fibril formation, AI-platform-for-science, MCP ecosystem, AlphaFold DB, Mol\*. Output: `RB-NNN_weekly-scan-YYYY-MM-DD.md` brief if anything notable; otherwise short index entry.

### M-QUARTERLY — Tech radar review
**Frequency**: quarterly (3 months).
**Scope**: re-evaluate every entry in `TECH_PLATFORM_VISION.md` §2 Technology Radar (adopt-now / plan-next / parked). Has anything moved? New tech to add? Output: `RB-NNN_tech-radar-review-YYYY-Q.md` with proposed radar moves.

### M-ANNUAL — Vision recheck
**Frequency**: annual.
**Scope**: re-evaluate `TECH_PLATFORM_VISION.md` §0 success criteria. Has the vision shifted? Are we still building toward the same target?

---

## How T-RES uses this index

1. On each session start, T-RES reads `_INDEX.md` to know what's been done and what's queued.
2. Picks the next mission in order (or one Said specifies).
3. Reads relevant docs (`MASTER_PUSH_PLAN.md`, `TECH_PLATFORM_VISION.md`, `DECISIONS.md`, `ROADMAP.md`).
4. Researches via WebSearch + WebFetch.
5. Writes `RB-NNN_topic-slug.md` using `_TEMPLATE.md`.
6. Updates this index with the new entry.
7. Stops. T1 reviews + summarizes for Said.

T-RES never commits directly to canonical docs. All proposed changes are in the brief; T1 + Said decide what to commit.
