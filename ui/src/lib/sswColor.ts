/**
 * SSW residue-highlight magenta (chameleon-sequence convention).
 *
 * Different from `--ssw` (the classification badge blue). The magenta
 * encodes "this residue is in a secondary-structure-switch range" and
 * appears in:
 *   - SequenceTrack residues (per-residue color)
 *   - AggregationHeatmap aggregation bars (single-hue gradient)
 *   - WindowProfileChart SSW band stroke
 *   - Mol3DViewer SSW Toggle styling + setStructureOverpaint call
 *
 * Convention is fixed (#E040FB / purple A200) so the constants are not
 * theme-switched. If Peleg ever revises the colour, edit this file +
 * the matching `ssw-residue` token in tailwind.config.ts.
 */

export const SSW_RESIDUE_HEX = "#E040FB";

/** 0xE040FB as a Mol*-style numeric color. */
export const SSW_RESIDUE_HEX_NUM = 0xe040fb;

/** Canonical rgb() string — matches what jsdom emits for #E040FB. */
export const SSW_RESIDUE_RGB = "rgb(224, 64, 251)";

/** Tinted overlay for hovered residues / faint chart bars. */
export function sswTint(opacity: number): string {
  return `rgba(224, 64, 251, ${opacity})`;
}
