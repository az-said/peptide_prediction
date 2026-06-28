"""B19 — Welch's t-test + cohort comparison endpoint tests."""

from __future__ import annotations

import json
import math
import os

os.environ.setdefault("USE_TANGO", "0")
os.environ.setdefault("USE_S4PRED", "0")
os.environ.setdefault("VECTOR_INDEX_ENABLED", "0")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from api.main import app  # noqa: E402
from services.cohort_stats import welch_t_test  # noqa: E402

client = TestClient(app)


# ---------------------------------------------------------------------------
# welch_t_test — unit tests against scipy reference
# ---------------------------------------------------------------------------


def test_welch_t_test_matches_scipy_reference():
    """Output must match a direct scipy.stats.ttest_ind(equal_var=False) call.

    Same inputs → same t and p to within FP epsilon. This is the contract
    the rest of the service layer relies on.
    """
    from scipy import stats

    a = [0.42, 0.51, 0.48, 0.55, 0.39, 0.47, 0.50, 0.44]
    b = [0.62, 0.68, 0.65, 0.71, 0.58, 0.66, 0.69, 0.64, 0.67]

    expected = stats.ttest_ind(a, b, equal_var=False)
    actual = welch_t_test(a, b)

    assert math.isclose(actual["t"], float(expected.statistic), rel_tol=1e-12)
    assert math.isclose(actual["p"], float(expected.pvalue), rel_tol=1e-12)
    # scipy's Welch-Satterthwaite df agrees with our manual fallback.
    assert math.isclose(actual["df"], float(expected.df), rel_tol=1e-10)


def test_welch_t_test_drops_none_and_nan():
    """None and NaN entries are silently dropped (not counted, not coerced)."""
    a = [0.4, None, 0.5, float("nan"), 0.45]
    b = [0.6, 0.7, None, 0.65]

    result = welch_t_test(a, b)

    # Sanity: comparing same-cleaned vectors directly gives the same numbers.
    direct = welch_t_test([0.4, 0.5, 0.45], [0.6, 0.7, 0.65])
    assert math.isclose(result["t"], direct["t"], rel_tol=1e-12)
    assert math.isclose(result["p"], direct["p"], rel_tol=1e-12)


def test_welch_t_test_rejects_too_few_samples():
    """Each group needs n >= 2."""
    with pytest.raises(ValueError, match=r"fewer than 2"):
        welch_t_test([0.5], [0.6, 0.7, 0.8])
    with pytest.raises(ValueError, match=r"fewer than 2"):
        welch_t_test([0.5, 0.6], [0.7])


def test_welch_t_test_identical_distributions_have_high_pvalue():
    """Two samples from the same distribution should fail to reject H0."""
    a = [0.50, 0.51, 0.49, 0.50, 0.52, 0.48, 0.51, 0.49]
    b = [0.50, 0.51, 0.49, 0.50, 0.52, 0.48, 0.51, 0.49]
    result = welch_t_test(a, b)
    assert result["p"] > 0.5  # very large — they're identical
    assert math.isclose(result["t"], 0.0, abs_tol=1e-9)


# ---------------------------------------------------------------------------
# POST /api/cohorts/compare — route integration
# ---------------------------------------------------------------------------


def _write_cohort(precomputed_dir, dataset_id: str, metric: str, values: list[float | None]):
    """Helper: write a stub precomputed JSON file with a single metric column."""
    rows = [{metric: v, "id": f"{dataset_id}-{i}"} for i, v in enumerate(values)]
    payload = {
        "pvl_version": "0.0.0-test",
        "precomputed_at": "2026-06-18T00:00:00Z",
        "rows": rows,
    }
    (precomputed_dir / f"{dataset_id}.json").write_text(json.dumps(payload), encoding="utf-8")


@pytest.fixture
def precomputed_dir(tmp_path, monkeypatch):
    """Point the cohorts route at a tmp_path instead of backend/data/precomputed/."""
    from api.routes import cohorts as cohorts_module

    monkeypatch.setattr(cohorts_module, "PRECOMPUTED_DIR", tmp_path)
    return tmp_path


def test_compare_cohorts_returns_t_p_df(precomputed_dir):
    """Happy path: two cohorts on a metric → Welch's t-test result."""
    _write_cohort(precomputed_dir, "peleg_118", "muH", [0.42, 0.51, 0.48, 0.55, 0.39, 0.47])
    _write_cohort(precomputed_dir, "uperin_frog", "muH", [0.62, 0.68, 0.65, 0.71, 0.58, 0.66])

    response = client.post(
        "/api/cohorts/compare",
        json={"a": "peleg_118", "b": "uperin_frog", "metric": "muH"},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["a"] == "peleg_118"
    assert body["b"] == "uperin_frog"
    assert body["metric"] == "muH"
    assert body["n_a"] == 6
    assert body["n_b"] == 6
    # Different means → expect a large |t| and small p.
    assert abs(body["t"]) > 2.0
    assert body["p"] < 0.05
    # Welch-Satterthwaite df is non-integer for unequal variance.
    assert isinstance(body["df"], (int, float))
    assert body["df"] > 0


def test_compare_cohorts_skips_none_metric_values(precomputed_dir):
    """Rows missing the metric don't count toward n and don't break the test."""
    _write_cohort(
        precomputed_dir,
        "with_nulls",
        "hydrophobicity",
        [0.40, None, 0.50, None, 0.45, 0.42],
    )
    _write_cohort(precomputed_dir, "clean", "hydrophobicity", [0.60, 0.70, 0.65, 0.62, 0.68])

    response = client.post(
        "/api/cohorts/compare",
        json={"a": "with_nulls", "b": "clean", "metric": "hydrophobicity"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["n_a"] == 4
    assert body["n_b"] == 5


def test_compare_cohorts_missing_dataset_returns_404(precomputed_dir):
    """No precomputed file → 404 with a helpful message."""
    _write_cohort(precomputed_dir, "peleg_118", "muH", [0.42, 0.51, 0.48])
    response = client.post(
        "/api/cohorts/compare",
        json={"a": "peleg_118", "b": "does_not_exist", "metric": "muH"},
    )
    assert response.status_code == 404
    assert "does_not_exist" in response.json()["detail"]


def test_compare_cohorts_rejects_unsupported_metric():
    """Pydantic Literal rejects unknown metric names with 422."""
    response = client.post(
        "/api/cohorts/compare",
        json={"a": "x", "b": "y", "metric": "notAMetric"},
    )
    assert response.status_code == 422


def test_compare_cohorts_rejects_identical_cohorts():
    """a == b is a user mistake; 422 with a clear message."""
    response = client.post(
        "/api/cohorts/compare",
        json={"a": "same", "b": "same", "metric": "charge"},
    )
    assert response.status_code == 422
    assert "must differ" in response.json()["detail"]


def test_compare_cohorts_rejects_path_traversal():
    """A dataset id with path separators must be rejected before file IO."""
    response = client.post(
        "/api/cohorts/compare",
        json={"a": "../etc/passwd", "b": "peleg_118", "metric": "muH"},
    )
    assert response.status_code == 422
    assert "Invalid dataset id" in response.json()["detail"]


def test_compare_cohorts_too_few_samples_returns_422(precomputed_dir):
    """One row in a cohort → 422 from welch_t_test, not 500."""
    _write_cohort(precomputed_dir, "tiny_a", "charge", [1.0])
    _write_cohort(precomputed_dir, "tiny_b", "charge", [2.0, 3.0, 4.0])

    response = client.post(
        "/api/cohorts/compare",
        json={"a": "tiny_a", "b": "tiny_b", "metric": "charge"},
    )
    assert response.status_code == 422
    assert "fewer than 2" in response.json()["detail"]
