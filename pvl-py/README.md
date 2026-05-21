# pvl-py — Python SDK for the Peptide Visual Lab

`pvl-py` is a thin Python client for the [Peptide Visual Lab](https://github.com/saidazaizah/peptide_prediction) REST API. It lets researchers analyze peptides in a Jupyter notebook (or any Python script) without learning the HTTP surface — every endpoint returns a `pandas.DataFrame` ready for downstream analysis.

Per [ADR-015](../docs/active/DECISIONS.md) the package targets the public REST API. It does **not** bundle the PVL scientific code — `pip install pvl-py` stays frictionless because the heavy ML dependencies (PyTorch, ESM-2, LanceDB) live in the backend service you point it at.

## Install

```bash
# From a clone of this repo (until pvl-py ships on PyPI):
cd pvl-py
pip install -e .

# After the PyPI release:
pip install pvl-py
```

## Quickstart

Spin up the backend somewhere reachable (defaults to `http://localhost:8000`):

```bash
# Locally — in the repo root:
make backend
```

Then in a notebook or REPL:

```python
import pvl

# 1. Analyze a FASTA file (or CSV / TSV / XLSX / DataFrame / list of strings)
df = pvl.analyze("seqs.fasta")
df.head()
# id                       sequence                   length  muH    ffHelixFlag  sswPrediction
# amyloid_beta_1_42        DAEFRHDSGYEVHHQK...        42      0.41   1            1
# islet_amyloid_polypep...  KCNTATCATQRL...           37      0.38   1           -1
# ...

# 2. Rank by Peleg's multi-signal ranking — same formula the web UI uses
top = pvl.rank(df, preset="helix", top_n=10)
top[["id", "score", "reasons"]].head()

# 3. Find peptides similar to your top hit (LanceDB + ESM-2 embedding)
similar = pvl.find_similar(top.iloc[0]["id"], k=5)
similar[["id", "distance"]]

# 4. Search UniProt and feed the result straight back into the pipeline
candidates = pvl.search_uniprot("amyloid", organism=1280, length_min=10, length_max=50)
analyzed = pvl.analyze(candidates)
```

A runnable end-to-end walkthrough lives in [`notebooks/quickstart.ipynb`](notebooks/quickstart.ipynb).

## Public API

| Function | What it wraps | Returns |
|---|---|---|
| `pvl.analyze(source, *, server_url, run_tango, run_s4pred, timeout)` | `POST /api/upload-csv` or `POST /api/predict/batch` | Peptide DataFrame |
| `pvl.rank(df, *, weights, preset, top_n, server_url, timeout)` | `POST /api/rank` | DataFrame + `score`, `reasons` columns |
| `pvl.search_uniprot(query, *, organism, length_min, length_max, reviewed, page_size, server_url)` | `POST /api/uniprot/execute` | Peptide DataFrame |
| `pvl.find_similar(reference_id, *, k, dataset_id, server_url)` | `POST /api/peptides/similar` | DataFrame + `distance` column |
| `pvl.set_default_server(url)` | — | Sets URL for this session |

Every function has an `a*` async variant (`pvl.aanalyze`, `pvl.arank`, `pvl.asearch_uniprot`, `pvl.afind_similar`) for Jupyter `await` patterns and concurrent calls.

## Configuration

The server URL resolves in this order (highest wins):

1. `server_url=` kwarg on the call.
2. `pvl.set_default_server(url)` if called this session.
3. `PVL_SERVER_URL` environment variable.
4. `http://localhost:8000` (assumes you're running the backend locally).

The Hetzner deploy hostname is **not** the default — that's PVL's hosted instance, not yours. Self-host or point at the URL from the docs.

## Error handling

- 4xx responses (validation errors, unknown routes) raise `httpx.HTTPStatusError` immediately with the backend's `detail` message attached. No retry.
- 5xx responses (typically 503 when the backend is warming up) auto-retry once with a short back-off, then raise.
- Timeouts default to 600 s — enough for a full-length UniProt result with S4PRED on a CX33 VPS. Pass `timeout=` to tighten or loosen.

## Type hints

`pvl-py` is [PEP 561](https://peps.python.org/pep-0561/) marked (`py.typed`). Every public function has full return-type annotations, so `mypy` and editor intellisense work out of the box.

## Tests

```bash
cd pvl-py
pip install -e ".[dev]"
pytest -v
```

The suite uses `httpx.MockTransport` to stub the PVL backend — no real network, no real backend required to run the tests.

## Publish (future)

Once Said reviews + signs off on the package:

```bash
cd pvl-py
python -m build
python -m twine upload --repository testpypi dist/*

# After verifying on test.pypi.org, publish for real:
python -m twine upload dist/*
```

## License

MIT — same as PVL.
