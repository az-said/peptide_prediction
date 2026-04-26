/**
 * Adapters bridging the wire-shape `Meta` (from `@/types/api`) to the
 * narrower `DatasetMetadata` shape consumed by the dataset store
 * (`@/types/peptide`). Kept out of `jobApi.ts` to avoid mixing API
 * client concerns with UI-state coercion.
 */
import type { Meta } from "@/types/api";
import type { DatasetMetadata } from "@/types/peptide";
import { DEFAULT_THRESHOLDS } from "@/lib/thresholds";

/**
 * Coerce backend `Meta` (where `thresholds` is a loose `Record<string, any>`)
 * into the strict `DatasetMetadata` shape the store expects.
 * Falls back to `DEFAULT_THRESHOLDS` for missing/unparseable values.
 */
export function toDatasetMetadata(meta: Meta): DatasetMetadata {
  const t = meta.thresholds ?? {};
  return {
    ...meta,
    thresholds: {
      muHCutoff: Number(t.muHCutoff ?? DEFAULT_THRESHOLDS.muHCutoff),
      hydroCutoff: Number(t.hydroCutoff ?? DEFAULT_THRESHOLDS.hydroCutoff),
    },
  } as DatasetMetadata;
}
