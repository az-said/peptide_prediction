/**
 * molstarSswOverpaint.ts — Apply/clear SSW residue overpaint on Mol* plugin.
 *
 * Phase 1 (current): dispatches a custom event so the host component can track
 * state. The real molstar wiring lives in the commented Phase 2 block below.
 * In Phase 1 the Mol3DViewer guards calls behind a null-check on the plugin ref.
 *
 * Phase 2 (when molstar npm package is integrated):
 *   - Replace the minimal type stubs with real molstar imports.
 *   - Uses setStructureOverpaint (NOT a new ColorTheme) to keep base helix coloring.
 *
 * B16 (Peleg 2026-06-18): SSW residue overlay with magenta #E040FB.
 */

import type { StructureOverlay } from "@/lib/molstarOverlays";

export type MolColor = number & { __brand: "MolColor" };

export function Color(hex: number): MolColor {
  return hex as unknown as MolColor;
}

export const CLEAR_COLOR = Color(-1);
export const SSW_OVERPAINT_COLOR = Color(0xe040fb);

/**
 * Minimal plugin interface matching what we need from PluginContext.
 * Phase 2: replace with `PluginContext` from molstar.
 */
export interface MolstarPluginRef {
  managers: {
    structure: {
      hierarchy: {
        current: {
          structures: Array<{
            components: unknown[];
            cell?: { obj?: { data?: unknown } };
          }>;
        };
      };
    };
  };
}

/**
 * Convert 0-indexed PVL overlay ranges into a flat array of 1-indexed
 * residue sequence IDs for Mol*'s label_seq_id selector.
 */
export function overlayRangesToMask(ranges: [number, number][]): number[] {
  const mask: number[] = [];
  for (const [start, end] of ranges) {
    for (let i = start; i < end; i++) mask.push(i + 1);
  }
  return mask;
}

/**
 * Build a Mol* Script query descriptor that selects residues by label_seq_id.
 * Phase 2 will use the real Script API; the descriptor lets tests verify shape.
 */
export function buildResidueSelectionQuery(mask: number[], chainId = "A") {
  return {
    type: "struct.generator.atomGroups" as const,
    params: {
      "chain-test": {
        op: "core.rel.eq",
        args: ["struct.atomProperty.macromolecular.label_asym_id", chainId],
      },
      "residue-test": {
        op: "core.set.has",
        args: ["core.type.set(mask)", "struct.atomProperty.macromolecular.label_seq_id"],
        mask,
      },
    },
  };
}

export async function applySswOverpaint(
  plugin: MolstarPluginRef | null,
  overlay: StructureOverlay | null,
  chainId = "A"
): Promise<boolean> {
  if (!plugin || !overlay || overlay.ranges.length === 0) return false;

  const structures = plugin.managers.structure.hierarchy.current.structures;
  if (!structures.length) return false;

  const mask = overlayRangesToMask(overlay.ranges);
  if (mask.length === 0) return false;

  // Phase 1: record that overpaint was requested (for test verification).
  // Phase 2: replace with actual setStructureOverpaint call (commented below).
  buildResidueSelectionQuery(mask, chainId);

  // --- Phase 2 real implementation (uncomment when molstar is installed) ---
  // const ref = structures[0];
  // const { Script } = await import('molstar/lib/mol-script/script');
  // const { StructureSelection } = await import('molstar/lib/mol-model/structure');
  // const { setStructureOverpaint: overpaint } = await import(
  //   'molstar/lib/mol-plugin-state/helpers/structure-overpaint'
  // );
  // await overpaint(plugin as any, ref.components, SSW_OVERPAINT_COLOR as any,
  //   async (structure: any) => {
  //     const sel = Script.getStructureSelection((Q: any) =>
  //       Q.struct.generator.atomGroups({
  //         'chain-test': Q.core.rel.eq([
  //           Q.struct.atomProperty.macromolecular.label_asym_id(), chainId
  //         ]),
  //         'residue-test': Q.core.set.has([
  //           Q.core.type.set(mask),
  //           Q.struct.atomProperty.macromolecular.label_seq_id()
  //         ]),
  //       }),
  //       structure,
  //     );
  //     return StructureSelection.toLociWithSourceUnits(sel);
  //   }
  // );

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("pvl:ssw-overpaint", {
        detail: { action: "apply", mask, color: SSW_OVERPAINT_COLOR, chainId },
      })
    );
  }

  return true;
}

export async function clearSswOverpaint(
  plugin: MolstarPluginRef | null,
  chainId = "A"
): Promise<boolean> {
  if (!plugin) return false;

  const structures = plugin.managers.structure.hierarchy.current.structures;
  if (!structures.length) return false;

  // --- Phase 2 real implementation (uncomment when molstar is installed) ---
  // const ref = structures[0];
  // const { setStructureOverpaint: overpaint } = await import(
  //   'molstar/lib/mol-plugin-state/helpers/structure-overpaint'
  // );
  // await overpaint(plugin as any, ref.components, CLEAR_COLOR as any,
  //   async () => Loci.Empty);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("pvl:ssw-overpaint", {
        detail: { action: "clear", color: CLEAR_COLOR, chainId },
      })
    );
  }

  return true;
}
