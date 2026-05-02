"""
pvl-cli entry point — defines the ``pvl`` console script.

Currently exposes a single subcommand:

    pvl analyze [INPUT_FILE]
        --sequence/-s       (single-sequence shortcut)
        --entry/-e          (entry id for the single-sequence shortcut)
        --base-url/-b       (PVL backend root URL)
        --json/-j           (raw JSON output instead of the pretty table)

The full feature surface is planned for Wave H. This scaffold validates
the wiring: console script registration, argument parsing, HTTP call to
``POST /api/upload-csv``, and pretty-print rendering.
"""

from __future__ import annotations

import io
import json as _json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import click
import httpx
from rich.console import Console
from rich.table import Table

from . import __version__

DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_TIMEOUT = 120.0

_console = Console()


@click.group(
    context_settings={"help_option_names": ["-h", "--help"]},
    help="Command-line client for the Peptide Visual Lab (PVL) prediction API.",
)
@click.version_option(__version__, prog_name="pvl")
def main() -> None:
    """Top-level group. Subcommands attach below."""


@main.command("analyze")
@click.argument(
    "input_file",
    type=click.Path(exists=True, dir_okay=False, path_type=Path),
    required=False,
)
@click.option(
    "-s",
    "--sequence",
    "sequence",
    type=str,
    default=None,
    help="Single peptide sequence (alternative to INPUT_FILE).",
)
@click.option(
    "-e",
    "--entry",
    "entry",
    type=str,
    default="P00000",
    show_default=True,
    help="Entry id for the single-sequence shortcut.",
)
@click.option(
    "-b",
    "--base-url",
    "base_url",
    type=str,
    default=DEFAULT_BASE_URL,
    show_default=True,
    help="PVL backend root URL.",
)
@click.option(
    "-t",
    "--timeout",
    "timeout",
    type=float,
    default=DEFAULT_TIMEOUT,
    show_default=True,
    help="HTTP timeout in seconds.",
)
@click.option(
    "-j",
    "--json",
    "as_json",
    is_flag=True,
    default=False,
    help="Print the raw JSON response instead of the pretty table.",
)
def analyze(
    input_file: Optional[Path],
    sequence: Optional[str],
    entry: str,
    base_url: str,
    timeout: float,
    as_json: bool,
) -> None:
    """Run a peptide prediction and pretty-print the result."""
    if input_file is None and not sequence:
        raise click.UsageError(
            "Provide either INPUT_FILE or --sequence. Run 'pvl analyze --help'."
        )
    if input_file is not None and sequence:
        raise click.UsageError(
            "INPUT_FILE and --sequence are mutually exclusive."
        )

    csv_bytes, filename = _build_payload(input_file, sequence, entry)

    try:
        with httpx.Client(base_url=base_url.rstrip("/"), timeout=timeout) as client:
            resp = client.post(
                "/api/upload-csv",
                files={"file": (filename, csv_bytes, "text/csv")},
            )
            resp.raise_for_status()
            payload: Dict[str, Any] = resp.json()
    except httpx.HTTPError as e:
        _console.print(f"[bold red]Request failed:[/bold red] {e}")
        sys.exit(1)

    if as_json:
        click.echo(_json.dumps(payload, indent=2))
        return

    _render_table(payload)


def _build_payload(
    input_file: Optional[Path], sequence: Optional[str], entry: str
) -> tuple[bytes, str]:
    """Build the multipart-upload bytes the API expects."""
    if input_file is not None:
        return input_file.read_bytes(), input_file.name

    assert sequence is not None  # narrowed by the caller
    buf = io.StringIO()
    buf.write("Entry,Sequence\n")
    buf.write(f"{entry},{sequence.strip().upper()}\n")
    return buf.getvalue().encode("utf-8"), "pvl_input.csv"


def _render_table(payload: Dict[str, Any]) -> None:
    """Render the API response as a small rich table."""
    rows = payload.get("rows", [])
    meta = payload.get("meta", {})

    if not rows:
        _console.print("[yellow]No rows returned.[/yellow]")
        return

    table = Table(title=f"PVL Analyze — {len(rows)} peptide(s)")
    table.add_column("Entry", style="cyan", no_wrap=True)
    table.add_column("Length", justify="right")
    table.add_column("Hydrophobicity", justify="right")
    table.add_column("μH", justify="right")
    table.add_column("FF-Helix", justify="right")
    table.add_column("FF-SSW", justify="right")

    for r in rows:
        table.add_row(
            str(r.get("id", "—")),
            _fmt(r.get("length"), kind="int"),
            _fmt(r.get("hydrophobicity")),
            _fmt(r.get("muH")),
            _fmt_flag(r.get("ffHelixFlag")),
            _fmt_flag(r.get("ffSswFlag")),
        )

    _console.print(table)
    trace = meta.get("traceId")
    if trace:
        _console.print(f"[dim]traceId: {trace}[/dim]")


def _fmt(value: Any, kind: str = "float") -> str:
    if value is None:
        return "—"
    if kind == "int":
        return str(value)
    try:
        return f"{float(value):.3f}"
    except (TypeError, ValueError):
        return str(value)


def _fmt_flag(value: Any) -> str:
    if value == 1:
        return "[green]✓[/green]"
    if value == -1:
        return "[red]✗[/red]"
    return "—"


if __name__ == "__main__":
    main()
