# pvl-py

Python SDK for the Peptide Visual Lab (PVL) prediction API.

```python
import pandas as pd
from pvl import analyze

# From a DataFrame (must contain Entry + Sequence columns)
df = pd.DataFrame([{"Entry": "P12345", "Sequence": "ACDEFGHIKLMNPQRSTVWY"}])
result = analyze(df, base_url="http://localhost:8000")

# From a FASTA / CSV file path
result = analyze("peptides.fasta", base_url="http://localhost:8000")
```

`analyze(input_, base_url=..., timeout=...)` returns the parsed JSON response from
`POST /api/upload-csv`. For a single sequence the underlying endpoint is the same
(the API accepts a one-row CSV), so the SDK is uniform for single + batch.

## Status

Scaffolding only. The full feature surface (auth, async client, threshold config,
streaming progress) is planned for Wave H.
