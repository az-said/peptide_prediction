/**
 * SetDiagram v2 — Premium interactive set/Venn/Euler diagram.
 *
 * Design decisions:
 * - Framer-motion animated circles with smooth transitions on data change
 * - Bidirectional hover highlighting between SVG regions and summary table
 * - HTML-based hover cards (not SVG tooltips) for rich region detail
 * - "Neither" rendered as a styled HTML chip (not faint SVG text)
 * - Collision-aware label placement with leader lines for overlaps
 * - Click-to-filter with scale pulse animation
 * - Scientific overlap labels ("Helix and SSW (no FF)")
 *
 * Layout algorithm:
 * 1. Primary sets (no parentSet) are arranged as overlapping circles along a horizontal axis.
 *    Overlap distance scales with actual intersection size.
 * 2. Subset circles (parentSet declared) render geometrically INSIDE their parent circle,
 *    sized proportionally to their member count relative to parent.
 * 3. All region counts are computed from a single membership pass — the same data drives
 *    both the SVG and the summary table, eliminating sync bugs by construction.
 *
 * Peleg's subset axiom: FF-SSW ⊆ SSW, FF-Helix ⊆ Helix. The `parentSet` prop enforces
 * this visually — subset circles MUST render inside their parent.
 *
 * @see docs/active/PELEG_FEEDBACK_INSTRUCTIONS.md FIX-007
 */

import { useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Public types ──

export interface SetDefinition {
  /** Unique set identifier */
  id: string;
  /** Display label (shown in legend / tooltips) */
  label: string;
  /** Member IDs belonging to this set */
  members: string[];
  /** CSS color — prefer hsl() from theme tokens. Falls back to a default palette. */
  color?: string;
  /** If set, this set is a strict subset of the parent and renders inside it. */
  parentSet?: string;
}

export interface ComputedRegion {
  /** Unique region key (e.g. "ssw-only", "ssw∩helix", "neither") */
  id: string;
  /** Human-readable label */
  label: string;
  /** Member IDs in this region */
  members: string[];
  /** Display color */
  color: string;
}

export interface SetDiagramProps {
  /** Set definitions. Supports unlimited sets and hierarchical subset relationships. */
  sets: SetDefinition[];
  /** Display mode: venn shows all 2^N regions; euler hides empty; auto picks. */
  mode?: "venn" | "euler" | "auto";
  /** Show member counts inside each region. Default true. */
  showCounts?: boolean;
  /** Callback when a region is clicked. */
  onRegionClick?: (regionId: string, members: string[]) => void;
  /** Label for items in no set. Default "Neither". */
  outsideLabel?: string;
  /** Total universe of item IDs (for computing "Neither"). If omitted, derived from all set members. */
  universe?: string[];
  /** Additional CSS class on the root div. */
  className?: string;
}

// ── Default palette (Okabe-Ito inspired, colorblind-safe) ──

const DEFAULT_COLORS = [
  "hsl(var(--ssw))",
  "hsl(var(--helix))",
  "hsl(var(--ff-ssw))",
  "hsl(var(--ff-helix))",
  "#E69F00",
  "#56B4E9",
  "#009E73",
  "#CC79A7",
];

// ── Animation constants ──

const CIRCLE_TRANSITION = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };
const PULSE_TRANSITION = { duration: 0.2, ease: "easeInOut" as const };

// ── Helpers ──

function pct(n: number, total: number): string {
  if (total === 0) return "0.0";
  return ((n / total) * 100).toFixed(1);
}

/** Intersect two string-ID sets */
function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const id of a) {
    if (b.has(id)) result.add(id);
  }
  return result;
}

/** Difference: a - b */
function difference(a: Set<string>, b: Set<string>): Set<string> {
  const result = new Set<string>();
  for (const id of a) {
    if (!b.has(id)) result.add(id);
  }
  return result;
}

// ── Region computation (single source of truth) ──

interface ComputedData {
  regions: ComputedRegion[];
  primarySets: { def: SetDefinition; memberSet: Set<string> }[];
  subsets: { def: SetDefinition; memberSet: Set<string>; parentId: string }[];
  total: number;
}

function computeRegions(
  sets: SetDefinition[],
  universe: string[] | undefined,
  outsideLabel: string
): ComputedData {
  const primaryDefs = sets.filter((s) => !s.parentSet);
  const subsetDefs = sets.filter((s) => !!s.parentSet);

  const memberSets = new Map<string, Set<string>>();
  for (const s of sets) {
    memberSets.set(s.id, new Set(s.members));
  }

  // Build universe
  const allMembers = new Set<string>();
  if (universe) {
    universe.forEach((id) => allMembers.add(id));
  }
  for (const s of sets) {
    s.members.forEach((id) => allMembers.add(id));
  }

  const total = allMembers.size;
  const regions: ComputedRegion[] = [];

  if (primaryDefs.length === 0) {
    // No primary sets — everything is "neither"
    regions.push({
      id: "neither",
      label: outsideLabel,
      members: [...allMembers],
      color: "hsl(var(--muted))",
    });
    return { regions, primarySets: [], subsets: [], total };
  }

  if (primaryDefs.length === 1) {
    // Single primary set
    const p = primaryDefs[0];
    const pSet = memberSets.get(p.id)!;
    const pColor = p.color || DEFAULT_COLORS[0];

    // Find subsets of this primary
    const childDefs = subsetDefs.filter((s) => s.parentSet === p.id);

    // Members in primary but not in any child subset
    let remaining = new Set(pSet);
    for (const child of childDefs) {
      const childSet = memberSets.get(child.id)!;
      const childOnly = intersect(childSet, pSet);
      if (childOnly.size > 0) {
        regions.push({
          id: child.id,
          label: child.label,
          members: [...childOnly],
          color: child.color || DEFAULT_COLORS[2],
        });
      }
      remaining = difference(remaining, childSet);
    }

    if (remaining.size > 0) {
      regions.push({
        id: `${p.id}-only`,
        label: `${p.label} only`,
        members: [...remaining],
        color: pColor,
      });
    }

    // Neither
    const outsideSet = difference(allMembers, pSet);
    if (outsideSet.size > 0) {
      regions.push({
        id: "neither",
        label: outsideLabel,
        members: [...outsideSet],
        color: "hsl(var(--muted-foreground))",
      });
    }

    return {
      regions,
      primarySets: [{ def: p, memberSet: pSet }],
      subsets: childDefs.map((d) => ({
        def: d,
        memberSet: memberSets.get(d.id)!,
        parentId: d.parentSet!,
      })),
      total,
    };
  }

  // Two primary sets (PVL's main case: SSW + Helix)
  const [pA, pB] = primaryDefs;
  const setA = memberSets.get(pA.id)!;
  const setB = memberSets.get(pB.id)!;
  const colorA = pA.color || DEFAULT_COLORS[0];
  const colorB = pB.color || DEFAULT_COLORS[1];

  // Children of each primary
  const childrenA = subsetDefs.filter((s) => s.parentSet === pA.id);
  const childrenB = subsetDefs.filter((s) => s.parentSet === pB.id);
  const allChildSets = [...childrenA, ...childrenB];

  // Compute primary-level regions
  const aOnly = difference(setA, setB);
  const bOnly = difference(setB, setA);
  const both = intersect(setA, setB);

  // For each primary-level region, subtract child subsets to get "plain" members
  function subtractChildren(base: Set<string>, children: typeof childrenA): Set<string> {
    let result = new Set(base);
    for (const child of children) {
      result = difference(result, memberSets.get(child.id)!);
    }
    return result;
  }

  // A-only plain (not in any child of A)
  const aOnlyPlain = subtractChildren(aOnly, childrenA);
  if (aOnlyPlain.size > 0) {
    regions.push({
      id: `${pA.id}-only`,
      label: `${pA.label} only`,
      members: [...aOnlyPlain],
      color: colorA,
    });
  }

  // B-only plain (not in any child of B)
  const bOnlyPlain = subtractChildren(bOnly, childrenB);
  if (bOnlyPlain.size > 0) {
    regions.push({
      id: `${pB.id}-only`,
      label: `${pB.label} only`,
      members: [...bOnlyPlain],
      color: colorB,
    });
  }

  // Build scientific intersection label
  const childLabels = allChildSets.map((c) => c.label);
  const intersectionLabel =
    childLabels.length > 0
      ? `${pA.label} and ${pB.label} (no ${childLabels.join(", ")})`
      : `${pA.label} and ${pB.label}`;

  // Intersection plain (both but not in any child subset)
  const bothPlain = subtractChildren(both, allChildSets);
  if (bothPlain.size > 0) {
    regions.push({
      id: `${pA.id}∩${pB.id}`,
      label: intersectionLabel,
      members: [...bothPlain],
      color: mixColors(colorA, colorB),
    });
  }

  // Child subset regions
  for (const child of allChildSets) {
    const childSet = memberSets.get(child.id)!;
    const childColor = child.color || DEFAULT_COLORS[regions.length % DEFAULT_COLORS.length];
    // Members of this child that are in both primaries vs only in parent
    const childInBoth = intersect(childSet, both);
    const childInParentOnly =
      child.parentSet === pA.id ? intersect(childSet, aOnly) : intersect(childSet, bOnly);

    // Combine — child regions shown as one (the child circle encompasses all its members)
    const allChildMembers = new Set([...childInBoth, ...childInParentOnly]);
    if (allChildMembers.size > 0) {
      regions.push({
        id: child.id,
        label: child.label,
        members: [...allChildMembers],
        color: childColor,
      });
    }
  }

  // Neither
  const inAny = new Set([...setA, ...setB]);
  const outsideSet = difference(allMembers, inAny);
  if (outsideSet.size > 0) {
    regions.push({
      id: "neither",
      label: outsideLabel,
      members: [...outsideSet],
      color: "hsl(var(--muted-foreground))",
    });
  }

  return {
    regions,
    primarySets: [
      { def: pA, memberSet: setA },
      { def: pB, memberSet: setB },
    ],
    subsets: allChildSets.map((d) => ({
      def: d,
      memberSet: memberSets.get(d.id)!,
      parentId: d.parentSet!,
    })),
    total,
  };
}

/** Simple color mixing for intersection — returns a purple-ish blend for any two hsl() strings */
function mixColors(a: string, b: string): string {
  // For theme tokens, we can't parse HSL at build time.
  // Use a dedicated intersection color that works in both themes.
  void a;
  void b;
  return "hsl(280, 40%, 55%)"; // muted purple — visually distinct from both parents
}

// ── SVG Layout ──

interface CircleLayout {
  id: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  label: string;
  count: number;
  isSubset: boolean;
  onClick?: () => void;
}

/** Label placement with optional leader line for collision avoidance */
interface LabelPlacement {
  regionId: string;
  x: number;
  y: number;
  count: number;
  label: string;
  color: string;
  /** If set, draw a leader line from (leaderFromX,leaderFromY) to (x,y) */
  leaderFromX?: number;
  leaderFromY?: number;
}

function computeLayout(data: ComputedData, W: number, H: number): CircleLayout[] {
  const { primarySets, subsets } = data;
  const layouts: CircleLayout[] = [];

  if (primarySets.length === 0) return layouts;

  const centerY = H * 0.48;

  if (primarySets.length === 1) {
    const p = primarySets[0];
    const r = Math.min(W, H) * 0.34;
    layouts.push({
      id: p.def.id,
      cx: W / 2,
      cy: centerY,
      r,
      color: p.def.color || DEFAULT_COLORS[0],
      label: p.def.label,
      count: p.memberSet.size,
      isSubset: false,
    });

    // Position subsets inside
    for (let i = 0; i < subsets.length; i++) {
      const s = subsets[i];
      if (s.parentId !== p.def.id) continue;
      const ratio = Math.max(0.2, Math.min(0.7, s.memberSet.size / Math.max(1, p.memberSet.size)));
      const sr = r * ratio * 0.7;
      const angle = (i * Math.PI) / Math.max(1, subsets.length) + Math.PI * 0.7;
      const dist = r * 0.4;
      layouts.push({
        id: s.def.id,
        cx: W / 2 + Math.cos(angle) * dist,
        cy: centerY + Math.sin(angle) * dist,
        r: Math.max(20, sr),
        color: s.def.color || DEFAULT_COLORS[i + 2],
        label: s.def.label,
        count: s.memberSet.size,
        isSubset: true,
      });
    }
    return layouts;
  }

  // Two primary sets
  const [pA, pB] = primarySets;
  const rA = Math.min(W * 0.24, H * 0.37);
  const rB = rA;

  // Overlap distance: proportion of intersection to min set size
  const intersection = intersect(pA.memberSet, pB.memberSet);
  const overlapRatio =
    Math.min(pA.memberSet.size, pB.memberSet.size) > 0
      ? intersection.size / Math.min(pA.memberSet.size, pB.memberSet.size)
      : 0;
  // Gap between centers: from 2R (no overlap) to 0 (complete overlap)
  const maxDist = rA + rB;
  const centerDist = maxDist * (1 - overlapRatio * 0.5);

  const midX = W / 2;
  const cxA = midX - centerDist / 2;
  const cxB = midX + centerDist / 2;

  layouts.push({
    id: pA.def.id,
    cx: cxA,
    cy: centerY,
    r: rA,
    color: pA.def.color || DEFAULT_COLORS[0],
    label: pA.def.label,
    count: pA.memberSet.size,
    isSubset: false,
  });

  layouts.push({
    id: pB.def.id,
    cx: cxB,
    cy: centerY,
    r: rB,
    color: pB.def.color || DEFAULT_COLORS[1],
    label: pB.def.label,
    count: pB.memberSet.size,
    isSubset: false,
  });

  // Position subsets inside their parent circle, offset from center
  for (const s of subsets) {
    const parentLayout = layouts.find((l) => l.id === s.parentId);
    if (!parentLayout) continue;

    const parentSize = s.parentId === pA.def.id ? pA.memberSet.size : pB.memberSet.size;
    const ratio = Math.max(0.15, Math.min(0.65, s.memberSet.size / Math.max(1, parentSize)));
    const sr = parentLayout.r * ratio * 0.7;

    // Position subset on the outer side of parent (away from center)
    const awayDir = parentLayout.cx < midX ? -1 : 1;
    const offsetX = parentLayout.r * 0.35 * awayDir;
    const offsetY = parentLayout.r * 0.15;

    layouts.push({
      id: s.def.id,
      cx: parentLayout.cx + offsetX,
      cy: centerY + offsetY,
      r: Math.max(18, sr),
      color: s.def.color || DEFAULT_COLORS[layouts.length % DEFAULT_COLORS.length],
      label: s.def.label,
      count: s.memberSet.size,
      isSubset: true,
    });
  }

  return layouts;
}

/** Compute label positions and add leader lines for overlapping labels */
function computeLabelPlacements(
  data: ComputedData,
  circleLayouts: CircleLayout[],
  W: number,
  _H: number
): LabelPlacement[] {
  const placements: LabelPlacement[] = [];
  const LABEL_HEIGHT = 28; // approximate height of count + label text
  const LABEL_WIDTH = 70;

  // Collect all placement candidates
  for (const c of circleLayouts) {
    const region = c.isSubset
      ? data.regions.find((r) => r.id === c.id)
      : data.regions.find((r) => r.id === `${c.id}-only`);

    if (!region || region.members.length === 0) continue;

    placements.push({
      regionId: region.id,
      x: c.cx,
      y: c.cy,
      count: region.members.length,
      label: c.isSubset ? c.label : `${c.label} only`,
      color: c.color,
    });
  }

  // Add intersection label for 2 primaries
  if (circleLayouts.length >= 2 && !circleLayouts[0].isSubset && !circleLayouts[1].isSubset) {
    const bothRegion = data.regions.find((r) => r.id.includes("∩"));
    if (bothRegion && bothRegion.members.length > 0) {
      const midX = (circleLayouts[0].cx + circleLayouts[1].cx) / 2;
      const midY = circleLayouts[0].cy;
      placements.push({
        regionId: bothRegion.id,
        x: midX,
        y: midY,
        count: bothRegion.members.length,
        label: "Both",
        color: bothRegion.color,
      });
    }
  }

  // Simple overlap detection and resolution
  const PADDING = 28;
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);

      if (dx < LABEL_WIDTH && dy < LABEL_HEIGHT) {
        // Labels overlap — move the smaller count label outside with a leader line
        const toMove = a.count < b.count ? a : b;
        const anchor = a.count < b.count ? b : a;
        const origX = toMove.x;
        const origY = toMove.y;

        // Move to the side with more room
        if (toMove.x < W / 2) {
          toMove.x = Math.max(PADDING + 30, toMove.x - 60);
        } else {
          toMove.x = Math.min(W - PADDING - 30, toMove.x + 60);
        }
        // Also shift vertically to avoid the anchor
        if (toMove.y <= anchor.y) {
          toMove.y = Math.max(PADDING + 20, toMove.y - 30);
        } else {
          toMove.y = Math.min(_H - PADDING - 20, toMove.y + 30);
        }

        toMove.leaderFromX = origX;
        toMove.leaderFromY = origY;
      }
    }
  }

  return placements;
}

/** Determine which region the mouse is over based on SVG coordinates */
function hitTestRegion(
  svgX: number,
  svgY: number,
  circleLayouts: CircleLayout[],
  data: ComputedData
): ComputedRegion | null {
  // Test subsets first (they're on top)
  const subsetLayouts = circleLayouts.filter((c) => c.isSubset);
  for (const c of subsetLayouts) {
    const dx = svgX - c.cx;
    const dy = svgY - c.cy;
    if (dx * dx + dy * dy <= c.r * c.r) {
      const region = data.regions.find((r) => r.id === c.id);
      if (region) return region;
    }
  }

  // Test primary circle intersections
  const primaries = circleLayouts.filter((c) => !c.isSubset);
  if (primaries.length >= 2) {
    const [cA, cB] = primaries;
    const inA = (svgX - cA.cx) ** 2 + (svgY - cA.cy) ** 2 <= cA.r ** 2;
    const inB = (svgX - cB.cx) ** 2 + (svgY - cB.cy) ** 2 <= cB.r ** 2;

    if (inA && inB) {
      // In intersection
      const bothRegion = data.regions.find((r) => r.id.includes("∩"));
      if (bothRegion) return bothRegion;
    }
    if (inA && !inB) {
      const aOnly = data.regions.find((r) => r.id === `${cA.id}-only`);
      if (aOnly) return aOnly;
    }
    if (!inA && inB) {
      const bOnly = data.regions.find((r) => r.id === `${cB.id}-only`);
      if (bOnly) return bOnly;
    }
  } else if (primaries.length === 1) {
    const c = primaries[0];
    const inC = (svgX - c.cx) ** 2 + (svgY - c.cy) ** 2 <= c.r ** 2;
    if (inC) {
      const region = data.regions.find((r) => r.id === `${c.id}-only`);
      if (region) return region;
    }
  }

  // Outside all circles — "neither"
  const neither = data.regions.find((r) => r.id === "neither");
  return neither || null;
}

// ── Hover Card Component ──

interface HoverCardData {
  region: ComputedRegion;
  total: number;
  x: number;
  y: number;
}

function RegionHoverCard({ region, total, x, y }: HoverCardData) {
  const examples = region.members.slice(0, 3);
  const remaining = region.members.length - examples.length;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -100%) translateY(-12px)",
      }}
    >
      <div className="bg-popover border border-border rounded-lg shadow-lg px-3.5 py-2.5 text-xs min-w-[180px] max-w-[240px]">
        <div className="font-semibold text-foreground text-[13px] mb-1 leading-tight">
          {region.label}
        </div>
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-foreground font-bold text-sm tabular-nums">
            {region.members.length}
          </span>
          <span className="text-muted-foreground">
            ({pct(region.members.length, total)}% of total)
          </span>
        </div>
        {examples.length > 0 && (
          <div className="border-t border-border/60 pt-1.5 mt-1">
            <div className="text-muted-foreground mb-0.5">Peptides:</div>
            <div className="flex flex-wrap gap-1">
              {examples.map((id) => (
                <span
                  key={id}
                  className="bg-muted/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-foreground"
                >
                  {id}
                </span>
              ))}
              {remaining > 0 && (
                <span className="text-muted-foreground text-[10px] self-center">
                  +{remaining} more
                </span>
              )}
            </div>
          </div>
        )}
        <div className="text-muted-foreground/70 text-[9px] mt-1.5 italic">
          Click to filter table
        </div>
      </div>
    </div>
  );
}

// ── Component ──

export function SetDiagram({
  sets,
  mode = "auto",
  showCounts = true,
  onRegionClick,
  outsideLabel = "Neither",
  universe,
  className,
}: SetDiagramProps) {
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [clickedRegionId, setClickedRegionId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const data = useMemo(
    () => computeRegions(sets, universe, outsideLabel),
    [sets, universe, outsideLabel]
  );

  const effectiveMode = mode === "auto" ? "euler" : mode;
  // PELEG-FIX-1-RESOLVED (2026-05-06): the summary table always shows ALL
  // configured regions — including count=0 rows — so users can verify which
  // categories produced zero peptides without inferring it from a missing
  // chip. computeRegions only emits rows for non-empty regions, so we
  // synthesise count=0 placeholders for every configured primary / subset
  // that doesn't already have one.
  const visibleRegions = useMemo<ComputedRegion[]>(() => {
    const seenIds = new Set(data.regions.map((r) => r.id));
    const placeholders: ComputedRegion[] = [];
    for (const p of sets.filter((s) => !s.parentSet)) {
      const onlyId = `${p.id}-only`;
      if (!seenIds.has(onlyId)) {
        placeholders.push({
          id: onlyId,
          label: `${p.label} only`,
          members: [],
          color: p.color || "hsl(var(--muted-foreground))",
        });
      }
    }
    for (const s of sets.filter((s) => !!s.parentSet)) {
      if (!seenIds.has(s.id)) {
        placeholders.push({
          id: s.id,
          label: s.label,
          members: [],
          color: s.color || "hsl(var(--muted-foreground))",
        });
      }
    }
    return [...data.regions, ...placeholders];
  }, [data.regions, sets]);
  // Track which CONFIGURED set IDs are empty (no members at all in this
  // dataset) so circle rendering can suppress them.
  const emptySetIds = useMemo(
    () =>
      new Set(
        sets.filter((s) => !s.members || s.members.length === 0).map((s) => s.id)
      ),
    [sets]
  );
  // Region IDs whose summary row is a synthesised count=0 placeholder.
  const emptyRegionIds = useMemo(
    () => new Set(visibleRegions.filter((r) => r.members.length === 0).map((r) => r.id)),
    [visibleRegions]
  );

  const W = 560;
  const H = 380;
  const circleLayouts = useMemo(() => computeLayout(data, W, H), [data]);

  const labelPlacements = useMemo(
    () => computeLabelPlacements(data, circleLayouts, W, H),
    [data, circleLayouts]
  );

  const handleClick = useCallback(
    (region: ComputedRegion) => {
      if (onRegionClick && region.members.length > 0) {
        onRegionClick(region.id, region.members);
        // Trigger pulse animation
        setClickedRegionId(region.id);
        setTimeout(() => setClickedRegionId(null), 250);
      }
    },
    [onRegionClick]
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const svgX = (e.clientX - rect.left) * scaleX;
      const svgY = (e.clientY - rect.top) * scaleY;

      const region = hitTestRegion(svgX, svgY, circleLayouts, data);
      setHoveredRegionId(region?.id || null);

      // Position hover card relative to container
      if (svgContainerRef.current) {
        const containerRect = svgContainerRef.current.getBoundingClientRect();
        setHoverPos({
          x: e.clientX - containerRect.left,
          y: e.clientY - containerRect.top,
        });
      }
    },
    [circleLayouts, data]
  );

  const handleSvgMouseLeave = useCallback(() => {
    setHoveredRegionId(null);
    setHoverPos(null);
  }, []);

  const handleTableRowHover = useCallback((regionId: string | null) => {
    setHoveredRegionId(regionId);
  }, []);

  const total = data.total;
  const neither = data.regions.find((r) => r.id === "neither");
  const hoveredRegion = hoveredRegionId ? data.regions.find((r) => r.id === hoveredRegionId) : null;

  /** Determine if a circle should be highlighted based on hovered region */
  const getCircleOpacity = useCallback(
    (circleId: string, isSubset: boolean) => {
      if (!hoveredRegionId) return { fill: isSubset ? 0.25 : 0.12, stroke: 0.4 };

      // Check if the hovered region is related to this circle
      const isRelated =
        hoveredRegionId === circleId ||
        hoveredRegionId === `${circleId}-only` ||
        hoveredRegionId.includes(circleId) ||
        // For subsets, highlight when their circle is hovered
        (isSubset && hoveredRegionId === circleId);

      if (isRelated) {
        return { fill: isSubset ? 0.4 : 0.22, stroke: 0.7 };
      }
      return { fill: isSubset ? 0.12 : 0.06, stroke: 0.2 };
    },
    [hoveredRegionId]
  );

  /** Get scale for click pulse animation */
  const getClickScale = useCallback(
    (circleId: string) => {
      if (!clickedRegionId) return 1;
      if (
        clickedRegionId === circleId ||
        clickedRegionId === `${circleId}-only` ||
        clickedRegionId.includes(circleId)
      ) {
        return 1.05;
      }
      return 1;
    },
    [clickedRegionId]
  );

  return (
    <div className={`${className || ""}`}>
      {/* SVG Diagram Container (relative for absolute hover overlay) */}
      <div className="flex justify-center" ref={svgContainerRef} style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="select-none w-full h-auto max-w-[560px]"
          role="img"
          aria-label="Set diagram showing classification overlaps"
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          <defs>
            {/* Clip path for intersection highlight */}
            {circleLayouts.length >= 2 &&
              !circleLayouts[0].isSubset &&
              !circleLayouts[1].isSubset && (
                <clipPath id="set-clip-a">
                  <circle
                    cx={circleLayouts[0].cx}
                    cy={circleLayouts[0].cy}
                    r={circleLayouts[0].r}
                  />
                </clipPath>
              )}
          </defs>

          {/* Universe rectangle */}
          <rect
            x={16}
            y={16}
            width={W - 32}
            height={H - 32}
            rx={10}
            fill="currentColor"
            fillOpacity={0.03}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={1.5}
            strokeDasharray="6 3"
            className={
              onRegionClick && neither && neither.members.length > 0 ? "cursor-pointer" : ""
            }
            onClick={() => neither && handleClick(neither)}
          />
          <text x={W - 24} y={34} textAnchor="end" fontSize={10} className="fill-muted-foreground">
            All: {total}
          </text>

          {/* Primary circles (rendered first, below subsets) — animated.
              PELEG-FIX-1-RESOLVED: skip circles for sets that have zero
              members in this dataset so they do not float in the diagram.
              The summary table still lists them with count=0 so the category
              is not silently hidden. */}
          {circleLayouts
            .filter((c) => !c.isSubset && c.count > 0 && !emptySetIds.has(c.id))
            .map((c) => {
              const opacities = getCircleOpacity(c.id, false);
              const scale = getClickScale(c.id);
              return (
                <g key={c.id}>
                  <motion.circle
                    animate={{
                      cx: c.cx,
                      cy: c.cy,
                      r: c.r,
                      fillOpacity: opacities.fill,
                      strokeOpacity: opacities.stroke,
                    }}
                    transition={CIRCLE_TRANSITION}
                    fill={c.color}
                    stroke={c.color}
                    strokeWidth={2}
                    className={onRegionClick ? "cursor-pointer" : ""}
                    style={{
                      transformOrigin: `${c.cx}px ${c.cy}px`,
                      scale,
                      transition: "scale 0.2s ease-in-out",
                    }}
                  />
                  {/* Set label at top of circle */}
                  <motion.text
                    animate={{ x: c.cx, y: c.cy - c.r - 10 }}
                    transition={CIRCLE_TRANSITION}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={c.color}
                    className="select-none"
                  >
                    {c.label} ({c.count})
                  </motion.text>
                </g>
              );
            })}

          {/* Overlap region for two primaries — animated */}
          {circleLayouts.length >= 2 &&
            !circleLayouts[0].isSubset &&
            !circleLayouts[1].isSubset && (
              <motion.circle
                animate={{
                  cx: circleLayouts[1].cx,
                  cy: circleLayouts[1].cy,
                  r: circleLayouts[1].r,
                  fillOpacity: hoveredRegionId?.includes("∩") ? 0.25 : 0.12,
                }}
                transition={CIRCLE_TRANSITION}
                clipPath="url(#set-clip-a)"
                fill={mixColors("", "")}
                className={onRegionClick ? "cursor-pointer" : ""}
              />
            )}

          {/* Subset circles (rendered on top) — animated */}
          {/* PELEG-FIX-1-RESOLVED: skip subset circles with count=0 too. */}
          {circleLayouts
            .filter((c) => c.isSubset && c.count > 0 && !emptySetIds.has(c.id))
            .map((c) => {
              const opacities = getCircleOpacity(c.id, true);
              const scale = getClickScale(c.id);
              return (
                <g key={c.id}>
                  <motion.circle
                    animate={{
                      cx: c.cx,
                      cy: c.cy,
                      r: c.r,
                      fillOpacity: opacities.fill,
                      strokeOpacity: opacities.stroke,
                    }}
                    transition={CIRCLE_TRANSITION}
                    fill={c.color}
                    stroke={c.color}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    className={onRegionClick ? "cursor-pointer" : ""}
                    style={{
                      transformOrigin: `${c.cx}px ${c.cy}px`,
                      scale,
                      transition: "scale 0.2s ease-in-out",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const region = data.regions.find((r) => r.id === c.id);
                      if (region) handleClick(region);
                    }}
                  />
                </g>
              );
            })}

          {/* Leader lines for displaced labels */}
          {showCounts &&
            labelPlacements
              .filter((lp) => lp.leaderFromX !== undefined)
              .map((lp) => (
                <line
                  key={`leader-${lp.regionId}`}
                  x1={lp.leaderFromX!}
                  y1={lp.leaderFromY!}
                  x2={lp.x}
                  y2={lp.y}
                  stroke="currentColor"
                  strokeOpacity={0.25}
                  strokeWidth={1}
                  strokeDasharray="3 2"
                />
              ))}

          {/* Count + label text at computed placements.
              PELEG-FIX-1-RESOLVED: skip placements for empty regions so the
              "Neither" / empty-set chip disappears with its circle. */}
          {showCounts &&
            labelPlacements
              .filter((lp) => !emptyRegionIds.has(lp.regionId))
              .map((lp) => {
                const isHovered = hoveredRegionId === lp.regionId;
                return (
                  <g
                    key={`label-${lp.regionId}`}
                    className={onRegionClick ? "cursor-pointer" : ""}
                    onClick={() => {
                      const region = data.regions.find((r) => r.id === lp.regionId);
                      if (region) handleClick(region);
                    }}
                  >
                    <text
                      x={lp.x}
                      y={lp.y - 4}
                      textAnchor="middle"
                      fontSize={isHovered ? 17 : 16}
                      fontWeight={700}
                      className="fill-foreground select-none"
                      style={{ transition: "font-size 0.15s ease" }}
                    >
                      {lp.count}
                    </text>
                    <text
                      x={lp.x}
                      y={lp.y + 10}
                      textAnchor="middle"
                      fontSize={10}
                      className="fill-muted-foreground select-none"
                    >
                      {lp.label} ({pct(lp.count, total)}%)
                    </text>
                  </g>
                );
              })}

          {/* Empty state */}
          {circleLayouts.length === 0 && (
            <text
              x={W / 2}
              y={H / 2}
              textAnchor="middle"
              fontSize={13}
              className="fill-muted-foreground"
            >
              No classification predictions detected
            </text>
          )}
        </svg>

        {/* "Neither" chip — HTML overlay, top-right corner */}
        {neither && neither.members.length > 0 && (
          <div
            className={`absolute top-5 left-5 flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium cursor-pointer transition-all duration-150 select-none ${
              hoveredRegionId === "neither"
                ? "bg-muted/60 border-foreground/30 text-foreground shadow-sm"
                : "bg-background/80 border-border/60 text-foreground/80 hover:bg-muted/40"
            }`}
            data-testid="neither-chip"
            onClick={() => handleClick(neither)}
            onMouseEnter={() => setHoveredRegionId("neither")}
            onMouseLeave={() => setHoveredRegionId(null)}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: "hsl(var(--muted-foreground))", opacity: 0.5 }}
            />
            <span>{outsideLabel}:</span>
            <span className="font-bold tabular-nums">{neither.members.length}</span>
            <span className="text-muted-foreground">({pct(neither.members.length, total)}%)</span>
          </div>
        )}

        {/* Hover card — HTML overlay positioned at mouse */}
        <AnimatePresence>
          {hoveredRegion && hoverPos && hoveredRegionId !== "neither" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.1 }}
            >
              <RegionHoverCard region={hoveredRegion} total={total} x={hoverPos.x} y={hoverPos.y} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary table — reads from the SAME computed regions (single source of truth) */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60">
              <th className="text-left py-1.5 px-2.5 font-medium text-muted-foreground">Region</th>
              <th className="text-right py-1.5 px-2.5 font-medium text-muted-foreground">Count</th>
              <th className="text-right py-1.5 px-2.5 font-medium text-muted-foreground">%</th>
            </tr>
          </thead>
          <tbody>
            {visibleRegions
              .sort((a, b) => b.members.length - a.members.length)
              .map((r) => {
                const isHighlighted = hoveredRegionId === r.id;
                return (
                  <tr
                    key={r.id}
                    data-region-id={r.id}
                    className={`border-b border-border/40 transition-colors duration-150 ${
                      isHighlighted ? "bg-muted/50" : ""
                    } ${
                      onRegionClick && r.members.length > 0
                        ? "cursor-pointer hover:bg-muted/40"
                        : ""
                    }`}
                    onClick={() => handleClick(r)}
                    onMouseEnter={() => handleTableRowHover(r.id)}
                    onMouseLeave={() => handleTableRowHover(null)}
                  >
                    <td className="py-1.5 px-2.5 flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-inset ring-black/10"
                        style={{
                          backgroundColor: r.color,
                          opacity: r.id === "neither" ? 0.4 : 0.7,
                        }}
                      />
                      <span className={isHighlighted ? "font-medium text-foreground" : ""}>
                        {r.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono tabular-nums">
                      {r.members.length}
                    </td>
                    <td className="py-1.5 px-2.5 text-right text-muted-foreground tabular-nums">
                      {pct(r.members.length, total)}%
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <p className="text-[9px] text-muted-foreground/60 text-center mt-2">
        Hover for details. Click any region or table row to filter.
      </p>
    </div>
  );
}

// ── PVL convenience: pre-built 4-category set config ──

/**
 * Build the PVL 4-category set definitions from a peptide array.
 * Returns sets ready to pass to <SetDiagram>.
 */
export function buildPVLSets(
  peptides: {
    id: string;
    sswPrediction?: number | null;
    s4predHelixPrediction?: number | null;
    ffSswFlag?: number | null;
    ffHelixFlag?: number | null;
  }[]
): SetDefinition[] {
  return [
    {
      id: "ssw",
      label: "SSW",
      members: peptides.filter((p) => p.sswPrediction === 1).map((p) => p.id),
      color: "hsl(var(--ssw))",
    },
    {
      id: "helix",
      label: "Helix",
      members: peptides.filter((p) => p.s4predHelixPrediction === 1).map((p) => p.id),
      color: "hsl(var(--helix))",
    },
    {
      id: "ff-ssw",
      label: "FF-SSW",
      members: peptides.filter((p) => p.ffSswFlag === 1).map((p) => p.id),
      color: "hsl(var(--ff-ssw))",
      parentSet: "ssw", // FF-SSW ⊆ SSW (Peleg's axiom)
    },
    {
      id: "ff-helix",
      label: "FF-Helix",
      members: peptides.filter((p) => p.ffHelixFlag === 1).map((p) => p.id),
      color: "hsl(var(--ff-helix))",
      parentSet: "helix", // FF-Helix ⊆ Helix (Peleg's axiom)
    },
  ];
}

export default SetDiagram;
