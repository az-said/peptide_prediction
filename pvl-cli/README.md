# pvl-cli

Command-line client for the Peptide Visual Lab (PVL) prediction API.

```bash
# Single sequence
pvl analyze --sequence ACDEFGHIKLMNPQRSTVWY --entry P12345

# Batch from file
pvl analyze peptides.csv

# Custom backend
pvl analyze peptides.fasta --base-url https://pvl.example.com

# Raw JSON for piping
pvl analyze peptides.csv --json | jq '.meta.traceId'
```

## Status

Scaffolding only. The `analyze` subcommand is wired end-to-end (POSTs to
`/api/upload-csv` and pretty-prints the response with `rich`). Full feature
surface (threshold presets, progress bars, output formats, auth) is planned
for Wave H.
