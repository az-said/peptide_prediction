"""B19 — Welch's two-sample t-test for cohort comparison.

This module is the single seam between the cohort-comparison route and
the underlying statistics library. The route stays thin (load JSON,
extract metric vector, call ``welch_t_test``, return the result) so the
statistical machinery can be swapped or extended (rank tests, effect
sizes) without touching FastAPI plumbing.

Why Welch's t-test (not Student's): the Peleg-118, Gold-2023 and Uperin
cohorts have very different sample sizes (118, 2916, ~5 respectively)
and almost certainly different metric variances. Student's t-test
assumes equal variances and is biased when that fails; Welch's makes
no equal-variance assumption and reduces to Student's when variances
match. See Delacre, Lakens & Leys (2017) for the modern argument
against the "test variance first, then choose t-test" workflow.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Sequence


def _clean_vector(values: Sequence[Any], name: str) -> List[float]:
    """Drop ``None`` / NaN entries, coerce to float, validate non-empty.

    Raises ``ValueError`` if fewer than two valid samples remain — Welch's
    t-test is undefined with n<2 in either group.
    """
    cleaned: List[float] = []
    for value in values:
        if value is None:
            continue
        try:
            v = float(value)
        except (TypeError, ValueError):
            continue
        if math.isnan(v):
            continue
        cleaned.append(v)
    if len(cleaned) < 2:
        raise ValueError(
            f"Cohort {name!r} has fewer than 2 valid samples after cleaning "
            f"(got {len(cleaned)}). Welch's t-test requires n >= 2 per group."
        )
    return cleaned


def welch_t_test(a: Sequence[Any], b: Sequence[Any]) -> Dict[str, float]:
    """Two-sample Welch's t-test (unequal variances).

    Parameters
    ----------
    a, b
        Iterables of numeric values. ``None`` and NaN entries are
        silently dropped. Each group needs at least 2 valid samples.

    Returns
    -------
    dict
        ``{"t": float, "p": float, "df": float}``

        - ``t``: Welch's t-statistic, two-sample.
        - ``p``: two-sided p-value from the t-distribution.
        - ``df``: Welch-Satterthwaite degrees of freedom.

    Raises
    ------
    ValueError
        If either group has fewer than 2 valid samples.
    """
    # Import inside the function so module import stays cheap; scipy is a
    # heavy dependency and we don't want it loaded at FastAPI startup if
    # nobody calls the cohort route.
    from scipy import stats  # type: ignore[import-not-found]

    arr_a = _clean_vector(a, name="a")
    arr_b = _clean_vector(b, name="b")

    result = stats.ttest_ind(arr_a, arr_b, equal_var=False)
    t_stat = float(result.statistic)
    p_value = float(result.pvalue)

    # Welch-Satterthwaite df. scipy >= 1.11 exposes ``result.df``; older
    # scipy doesn't, so compute it explicitly. Both branches give the
    # same number.
    df_attr = getattr(result, "df", None)
    if df_attr is not None and not (isinstance(df_attr, float) and math.isnan(df_attr)):
        df = float(df_attr)
    else:
        n_a = len(arr_a)
        n_b = len(arr_b)
        mean_a = sum(arr_a) / n_a
        mean_b = sum(arr_b) / n_b
        var_a = sum((x - mean_a) ** 2 for x in arr_a) / (n_a - 1)
        var_b = sum((x - mean_b) ** 2 for x in arr_b) / (n_b - 1)
        se_a = var_a / n_a
        se_b = var_b / n_b
        denominator = (se_a**2) / (n_a - 1) + (se_b**2) / (n_b - 1)
        df = ((se_a + se_b) ** 2) / denominator if denominator > 0 else float("nan")

    # Guard against non-finite outputs from degenerate cohorts (zero variance
    # in both groups, identical means, n=1, etc.). The Welch denominator can
    # yield 0/0 → NaN; surface a clean 422 in the route instead of letting
    # NaN propagate into the JSON response.
    for value in (t_stat, p_value, df):
        if not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError(
                "Welch's t-test produced non-finite output (degenerate "
                "cohort: zero variance or n<2 effective). Use cohorts "
                "with finite variance."
            )

    return {"t": t_stat, "p": p_value, "df": df}


__all__ = ["welch_t_test"]
