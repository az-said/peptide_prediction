# Mol* 3D Overlay Specification

## Overview

The Mol3DViewer component overlays PVL prediction annotations on AlphaFold 3D structures.
This document defines the overlay contract for current and future predictor integrations.

## Current Overlay Types (Phase A)

| Type | Color | Source Field | Detection Logic |
|------|-------|-------------|----------------|
| `tango` | red (#ef4444) | `peptide.tango.agg[]` | Contiguous residues where `agg[i] > threshold` |
| `s4pred-helix` | purple (#a855f7) | `peptide.s4pred.helixSegments` | Direct segment tuples from S4PRED |
| `ff-helix` | green (#22c55e) | `peptide.ffHelixFragments` or fallback `s4pred.helixSegments` | Only when `ffHelixFlag === 1` |
| `ssw` | amber (#f59e0b) | `peptide.s4pred.betaSegments` | Direct segment tuples (helix↔beta switch zones) |

## Overlay Interface

```typescript
interface StructureOverlay {
  type: OverlayType;           // e.g., "tango"
  label: string;               // Human-readable
  ranges: [number, number][];  // 0-indexed [start, end)
  color: string;               // CSS color
  opacity: number;             // 0-1
}
```

## Adding a New Overlay (Phase I Multi-Predictor)

1. Add type literal to `OverlayType` union in `molstarOverlays.ts`
2. Write an `extractXxxOverlay(peptide)` function returning `StructureOverlay | null`
3. Add to `buildDefaultOverlays()` array
4. Add toggle entry to `OVERLAY_TOGGLES`
5. Pick a color that contrasts with existing 4 (avoid red/purple/green/amber)

## Residue Numbering

- PVL internal: 0-indexed
- Mol* auth_seq_id: 1-indexed
- Use `toMolstarRanges()` to convert at render time

## Rendering Phases

- **Phase 1 (current)**: iframe-based EBI Mol* viewer + local "Prediction overlay map" residue bar
- **Phase 2 (planned)**: npm `molstar` package with programmatic overpaint/transparency per-residue + bidirectional hoverStore sync
