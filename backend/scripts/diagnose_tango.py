#!/usr/bin/env python3
"""diagnose_tango.py — pinpoint why precompute_dataset.py silently skips TANGO.

Runs the same DataFrame construction the precompute pipeline uses and reports
at every gate where rows are filtered out. Tells us in ~3 seconds whether the
bug is:

  (A) build_records_from_dataframe returning 0 records (column name / sanitize)
  (B) auto_disable_tango tripped by the budget (gold_standard only)
  (C) run_tango_simple silently failing (binary path / runtime dir / output)
  (D) provider_cache split eating all rows (cache pre-populated)

Usage (inside the backend container):
    python scripts/diagnose_tango.py peleg_118
    python scripts/diagnose_tango.py gold_standard
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(HERE))


def main() -> None:
    dataset_id = sys.argv[1] if len(sys.argv) > 1 else "peleg_118"

    from scripts.precompute_dataset import DATASETS, load_reference

    spec = DATASETS.get(dataset_id)
    if not spec:
        print(f"[FAIL] Unknown dataset_id {dataset_id!r}. Known: {list(DATASETS)}")
        sys.exit(2)

    print(f"=== Diagnosing TANGO path for {dataset_id} ===")
    print(f"Source: {spec['source']}")

    # ── Stage 1: load_reference ──────────────────────────────────────────
    df, meta = load_reference(spec["source"])
    print(f"\n[1] load_reference: {len(df)} rows")
    print(f"    Columns: {list(df.columns)}")
    print(f"    Entry[0]: {df['Entry'].iloc[0]!r}")
    print(f"    Sequence[0]: {df['Sequence'].iloc[0]!r}")

    # ── Stage 2: TANGO binary resolution ─────────────────────────────────
    import tango

    bin_path = tango._resolve_tango_bin()
    print(f"\n[2] TANGO binary resolution: {bin_path}")
    print(f"    env TANGO_BINARY_PATH: {os.environ.get('TANGO_BINARY_PATH')!r}")
    print(f"    env USE_TANGO: {os.environ.get('USE_TANGO')!r}")

    from config import settings

    print(f"    settings.USE_TANGO: {settings.USE_TANGO}")

    # ── Stage 3: budget gate ─────────────────────────────────────────────
    budget = settings.MAX_PEPTIDES_PER_RUN_WITH_TANGO
    auto_disable = len(df) > budget
    print(f"\n[3] Budget gate: {len(df)} peptides vs MAX={budget}")
    print(f"    auto_disable_tango: {auto_disable}")
    if auto_disable:
        print("    >>> CAUSE FOUND: dataset exceeds budget. Bypass by setting")
        print("    >>> MAX_PEPTIDES_PER_RUN_WITH_TANGO env var higher,")
        print("    >>> or disable the budget check in the precompute path.")

    # ── Stage 4: provider cache split ────────────────────────────────────
    try:
        from services.provider_cache import split_cached_uncached

        df_hits, df_misses = split_cached_uncached(df, settings.USE_TANGO, settings.USE_S4PRED)
        print(f"\n[4] Cache split: {len(df_hits)} hits, {len(df_misses)} misses")
        if len(df_misses) == 0 and len(df_hits) > 0:
            print("    >>> CAUSE FOUND: all rows hit the cache. TANGO doesn't re-run on hits.")
            print("    >>> Bypass by clearing cache: rm -rf /data/cache or pass a force flag.")
    except Exception as exc:
        print(f"    [skip] cache split errored: {exc}")
        df_misses = df

    # ── Stage 5: build_records_from_dataframe ────────────────────────────
    records = tango.build_records_from_dataframe(df_misses)
    print(f"\n[5] build_records_from_dataframe: {len(records)} records")
    if records:
        print(f"    First record: {records[0]}")
    else:
        print("    >>> CAUSE FOUND: 0 TANGO records produced.")
        print("    >>> Check Entry column non-empty and sequences >= 5 aa")
        entries = df_misses["Entry"].astype(str).str.strip()
        seqs = df_misses["Sequence"].astype(str).str.strip()
        print(f"    Entry blanks: {(entries == '').sum()}")
        print(f"    Sequence too-short (<5): {(seqs.str.len() < 5).sum()}")

    # ── Stage 6: actually try run_tango_simple (small subset) ────────────
    if records and len(records) > 0:
        sample = records[:3]
        print(f"\n[6] Trying run_tango_simple on {len(sample)} sample sequences...")
        try:
            run_dir = tango.run_tango_simple(sample)
            print(f"    OK — run_dir: {run_dir}")
            if run_dir and Path(run_dir).is_dir():
                out_files = list(Path(run_dir).glob("**/*.txt"))[:5]
                print(f"    Output files: {[str(p) for p in out_files]}")
        except Exception as exc:
            print(f"    >>> CAUSE FOUND: run_tango_simple raised: {type(exc).__name__}: {exc}")

    print("\n=== Diagnosis complete ===")


if __name__ == "__main__":
    main()
