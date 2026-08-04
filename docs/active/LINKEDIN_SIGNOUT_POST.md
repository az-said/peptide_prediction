# LinkedIn Signout Post — Draft

## Post (280 words)

After 11 months of building PePFibPred from scratch, I'm stepping into a founder-oversight role as the tool heads toward publication in Nucleic Acids Research.

PePFibPred is an open-source web server that predicts which short peptides can form α-helical fibrils and undergo secondary structure switching — a question that matters for understanding amyloid diseases, designing antimicrobial peptides, and engineering functional biomaterials.

What we built: a full-stack scientific platform combining three biophysical prediction engines (TANGO β-aggregation, S4PRED secondary structure, and a custom fibril-forming helix classifier) with interactive visualization, batch analysis, and a 4-class classification system grounded in the Landau lab's experimental framework.

The numbers: 600+ automated tests, 13 Methods sections verified against code, 5 execution surfaces (web, REST API, Python package, CLI, and the first-ever MCP server for peptide prediction), a provider cache that drops repeat analyses from 420ms to 6ms, and a 90-page operator handbook so the tool runs without me.

Aleksandr Golubev at DESY-CSSB is taking over as Primary Responder — a transition we designed from Day 1 with a full handoff playbook, ownership matrix, and operator cookbook. The science was led by Dr. Peleg Ragonis-Bachar at Technion, with oversight from Prof. Meytal Landau.

The repo is public, the tool is live, and the Zenodo DOI mints on our next tagged release.

If you work on peptide aggregation, structural switching, or fibril formation — or if you're building scientific web tools and want to compare notes — I'd welcome the conversation.

GitHub: github.com/az-said/peptide_prediction
Live: pepfibpred.desy.de (production instance)

#Bioinformatics #WebServer #PeptideScience #OpenSource #FullStack #React #FastAPI #DESY #Technion #MIT #AmyloidResearch #StructuralBiology

---

## 5-Slide Carousel Outline

### Slide 1: Title
**Headline:** PePFibPred — Predicting fibril-forming peptides, end to end
**Body:** Open-source web server · 11 months · heading to Nucleic Acids Research
**Visual concept:** App landing page screenshot with the purple-gradient hero

### Slide 2: The Problem
**Headline:** No single tool combines aggregation + structure + fibril classification
**Body:**
- Researchers use 5+ separate tools (TANGO, AGGRESCAN, Waltz, S4PRED, PyMOL)
- Results live in disconnected CSVs and static PNGs
- No reproducibility — no permalinks, no version tracking
**Visual concept:** Split screen: left = messy spreadsheet chaos, right = clean PePFibPred dashboard

### Slide 3: The Stack
**Headline:** React + FastAPI + 3 biophysical engines
**Body:**
- TANGO: β-aggregation propensity (Fernandez-Escamilla 2004)
- S4PRED: secondary structure — 5-model BiLSTM ensemble (Moffat & Jones 2021)
- FF-Helix: custom Chou-Fasman fibril classifier + SSW axiom (OR-union)
- Biochemistry: Fauchère-Pliska hydrophobicity, Eisenberg μH
**Visual concept:** Architecture diagram showing the three engines feeding into the 4-class Venn

### Slide 4: What We Shipped
**Headline:** From zero to production in 11 months
**Body:**
- Public repo: github.com/az-said/peptide_prediction
- Live production app on Hetzner Cloud
- Zenodo DOI (mints on v1.0.0)
- Paper submitted to NAR Web Server Issue
- 5 surfaces: web · API · Python · CLI · MCP
- 600+ automated tests, CI/CD, Sentry monitoring
**Visual concept:** Results dashboard screenshot showing the 4-class Venn + ranked table

### Slide 5: Team + What's Next
**Headline:** Built for handoff, not for solo-owning
**Body:**
- Science: Dr. Peleg Ragonis-Bachar (Technion)
- Oversight: Prof. Meytal Landau (Technion / EMBL / CSSB)
- Primary Responder: Aleksandr Golubev (DESY-CSSB)
- Next: Zenodo DOI → bio.tools registration → JOSS paper
**Visual concept:** Team photos or institutional logos (DESY, Technion, EMBL)

---

## Tag Suggestions
- DESY (company page)
- Technion — Israel Institute of Technology
- MIT (if applicable to your profile)
- Peleg Ragonis-Bachar (personal LinkedIn)
- Meytal Landau (personal LinkedIn)
- Aleksandr Golubev (personal LinkedIn, if he has one)
