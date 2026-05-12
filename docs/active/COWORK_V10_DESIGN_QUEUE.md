# Cowork V10 — Design polish queue (post-push)

> Said's redesign asks from browser-audit 2026-05-12 (screenshots at 5:04 + 5:07). Bundle into V10 prompts for Cowork after the Wave 2 push lands. Each item below becomes its own Cowork prompt with the standard PROMPT 0 + PRE-FLIGHT v2 framing.

---

## V10-1 — About page redesign (wave background, spread layout, no back button)

**Page**: `ui/src/pages/About.tsx`
**Current screenshot**: 2026-05-12 at 5:07 — content is in a narrow centered column on a flat tan background. Page looks like a phone-on-laptop layout. Back button at top is unnecessary (sidebar handles navigation).

**Redesign asks**:
1. **Wave background** — a subtle animated wave / fluid gradient across the entire viewport behind the content. NOT loud — Stripe-level calm. Research-grade: should feel like a research-platform homepage, not a kid's app. Suggested approaches to research:
   - SVG path with `framer-motion` `<motion.path>` animating `d` attribute over a sine-wave parameterization
   - Three.js / OGL water-surface shader (too heavy — reject)
   - CSS-only gradient with `@keyframes` + `mask-image` for wavy edge (lightweight winner)
   - Reference: Vercel landing pages, Linear marketing pages, RCSB PDB hero waves
2. **Kill the back button** at the top of the page — sidebar handles navigation already.
3. **Spread the layout** — use the full viewport width with a generous max-w-5xl or max-w-6xl content frame. Right now content is squeezed center while the background floats only in the middle, creating the "phone on laptop" effect Said called out.
4. **Hero treatment** — "Peptide Visual Lab" should feel like a hero, not a card title. Larger typography, the wave background, the DESY · Landau Group subtitle as a quiet pill.
5. **Credits section** — the existing 3-up grid (Said / Peleg / Alex) is fine structurally; live it up with subtle hover states, ORCID badges as proper Badge components, lab-affiliation pills.
6. **Predictor providers footnote** — keep but de-emphasize. Don't compete with credits visually.

**Discipline**:
- PRE-FLIGHT mandatory: existing `About.tsx` is the target. REFACTOR in place, do NOT create a parallel `AboutV2.tsx`.
- Wave background should be a NEW reusable component (`ui/src/components/WaveBackground.tsx`) since it's a primitive we'll reuse on Help, Landing, possibly Results hero.
- Mobile responsive at 375px — wave must not break the layout on narrow screens.
- Light + dark mode both render.
- No new npm deps without flagging T1.

**Acceptance test (Said browser eyes)**:
- /about renders with full-width wave background
- "Peptide Visual Lab" feels hero-scale
- No back button at top of page
- Credits remain 3-up, readable, with ORCID links
- Said's title says "Lead developer" (already fixed in commit 0145c3a — preserve this)

---

## V10-2 — DrillDown slide-over polish (give the panel life)

**Component**: `ui/src/components/drilldown/DrillDown.tsx` + its inspector children (`SimilarPeptidesInspector.tsx`, `MetricInspector.tsx`, `PeptideInspector.tsx`, `ChartInspector.tsx`)
**Current screenshot**: 2026-05-12 at 5:04 — panel works but feels dead. Empty-state copy is plain. Header has a single icon (Share) + the close X. Footer is two muted disabled buttons (SVG, CSV).

**Redesign asks**:
1. **Better empty state** for SimilarPeptidesInspector — when no results, show a friendly "Index not populated yet — run `make reindex-lance`" with an inline command or even an action button. Not just a magnifying-glass icon and gray text.
2. **Header polish** — title typography, subtle gradient or accent line under the title, badge showing the inspector mode ("Similar" / "Metric" / "Chart" / "Peptide").
3. **Animation on open** — Sheet already slides; add a brief stagger on the inner content (header → results → footer) using framer-motion `staggerChildren`.
4. **Loading state** — skeleton rows that match the actual result row shape (avatar + sequence + distance bar), not a generic spinner.
5. **Result row hover** — subtle scale or border accent on hover; clear "click to switch" affordance.
6. **Footer SVG + CSV buttons** — currently disabled in DrillDown.tsx footer. Either wire them OR remove them. They look unfinished as disabled.

**Discipline**:
- PRE-FLIGHT mandatory: target existing files, refactor in place.
- The double-X close button bug already fixed in `0145c3a` — preserve the SheetContent built-in close.
- No emojis in production copy (per AGENTS.md).

**Acceptance test (Said browser eyes)**:
- Open Find Similar on any peptide → panel feels alive (animated entrance, polished header, clear loading skeleton)
- Empty state has actionable copy + visible CTA
- Hover over a result row → clear visual response
- Footer buttons either work or are gone

---

## V10-3 — Scroll-triggered card animations across the app (future, lower priority)

**Scope**: app-wide
**Said's exact ask**: *"when we scroll each card makes animation when we reach it only not all at once etc and we should make this really very good to use."*

**Approach**:
1. **Standard intersection-observer hook** — `ui/src/hooks/useInView.ts` (research existing — react-intersection-observer is well-maintained, ~12kb; or hand-rolled IntersectionObserver in ~30 lines is simpler and dep-free).
2. **Animation primitive** — `framer-motion` `<motion.div>` with `whileInView` + `initial={{ opacity: 0, y: 20 }}` + `viewport={{ once: true, amount: 0.2 }}`. This is the industry-standard pattern (Vercel, Linear, Stripe use this).
3. **Apply selectively** — KPI cards on Results, peptide rows in PeptideTable, chart cards in ResultsCharts. NOT page-level (avoid jank). NOT modals or always-visible chrome.
4. **Performance** — `once: true` so animations don't re-fire on scroll back. `amount: 0.2` triggers when 20% visible. Test on mobile.

**Discipline**:
- Each animated component pattern should live in ONE reusable wrapper: `ui/src/components/animations/AnimateOnView.tsx`. Don't sprinkle framer-motion hooks across every component.
- Light + dark mode behavior identical.
- Respects `prefers-reduced-motion` — when set, animations turn into instant fade (no movement).

**Acceptance test (Said browser eyes)**:
- Scroll down /results — each KPI card / chart / peptide row animates in once as it enters view
- Scroll back up — already-animated cards don't re-animate (jarring)
- On a mid-2020 MacBook Pro, the animations should be 60fps smooth — no jank
- If you've toggled "Reduce motion" in macOS preferences, animations become instant

---

## V10-4 — Transition + smoothness audit (future, with V10-3)

**Scope**: route transitions + scroll behavior

1. **Route-change transition** — existing `PageTransition.tsx` is fine, but tune the timing to feel less like "fade-and-swap" and more like a calm push.
2. **Smooth scroll** — `html { scroll-behavior: smooth; }` is set somewhere; verify and tune. When clicking an anchor link from STATUS / About / Help, scroll should feel calm (~400-600ms ease-out).
3. **Anchor jump cards** — when clicking a peptide in the table, the detail page should already be at scrollTop=0 (verify ScrollToTop component works for query-param-only navigation too).
4. **Loading transitions** — when navigating between pages, the Suspense fallback (the centered spinner) should fade in/out, not flash.

**Discipline**:
- This is purely a polish round — no new architecture, no new components, just tuning existing motion.
- Use `prefers-reduced-motion` everywhere.

---

## Trigger conditions

- All four V10-N items wait for the v0.2.0-rc1 push to land + Said's first browser-audit feedback.
- Pick order when ready: **V10-1 (About page) → V10-2 (DrillDown polish) → V10-3 (scroll animations) → V10-4 (transitions)**.
- Each is its own atomic Cowork prompt with PROMPT 0 + PRE-FLIGHT v2 framing.

T1 writes the V10-N prompts when triggered. Cowork executes one at a time. T1 reviews + commits.
